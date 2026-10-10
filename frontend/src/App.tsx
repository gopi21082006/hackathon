import React, { useState, useEffect, useCallback } from 'react';
import type {
  AppStep,
  UserProfile,
  MetricCategory,
  MetricState,
  NotificationQuestion,
  AIInsightItem,
  DigitalWellbeingData
} from './types';

import { trackerStore, notificationQuestions } from './storage/trackerStore';
import {
  supabase,
  isSupabaseConfigured,
  getSession,
  signOutUser,
  syncUserProfile,
  fetchUserSetupFromCloud,
  fetchDashboardDataFromCloud
} from './lib/supabase';
import { LoginScreen } from './components/LoginScreen';
import { UserSetupScreen } from './components/UserSetupScreen';
import { DashboardView } from './components/DashboardView';
import { NotificationWidget } from './components/NotificationWidget';
import { DigitalWellbeingModal } from './components/DigitalWellbeingModal';
import { Navigation } from './components/Navigation';
import type { MainNavTab } from './components/Navigation';
import { OverviewView } from './components/OverviewView';
import { SettingsView } from './components/SettingsView';
import { PandaAssistant } from './components/PandaAssistant';
import { ChatbotPanel } from './components/ChatbotPanel';

export function App() {
  const [user, setUser] = useState<UserProfile>(trackerStore.getUser());
  const [step, setStep] = useState<AppStep>(() => {
    const u = trackerStore.getUser();
    if (!u.isLoggedIn) return 'login';
    if (!u.setupComplete) return 'setup';
    return 'dashboard';
  });

  const [metrics, setMetrics] = useState<Record<MetricCategory, MetricState>>(trackerStore.getMetrics());
  const [insights, setInsights] = useState<AIInsightItem[]>(trackerStore.getAIInsights());
  const [wellbeing, setWellbeing] = useState<DigitalWellbeingData>(trackerStore.getWellbeing());

  // Interactive notification state
  const [activeQuestion, setActiveQuestion] = useState<NotificationQuestion | null>(null);
  const [recentlyUpdatedCategory, setRecentlyUpdatedCategory] = useState<MetricCategory | null>(null);

  // Digital well-being modal state
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  // Main Navigation & AI Companion & Theme State
  const [mainTab, setMainTab] = useState<MainNavTab>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('aura_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // Persist theme to document & localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aura_theme', theme);
  }, [theme]);

  // Hydrate user and data from cloud database
  const hydrateUserFromCloud = useCallback(async (sessionUser: any, provider?: any) => {
    const userId = sessionUser.id;
    const email = sessionUser.email || 'alex@aura.app';
    const name =
      sessionUser.user_metadata?.full_name ||
      sessionUser.user_metadata?.name ||
      email.split('@')[0];
    const authProvider = provider || sessionUser.app_metadata?.provider || 'google';

    // 1. Ensure profile exists in cloud database
    await syncUserProfile({ id: userId, email, name, provider: authProvider });

    // 2. Check if setup was already completed in cloud
    const cloudSetup = await fetchUserSetupFromCloud(userId);
    const isSetupDone = Boolean(cloudSetup);

    const updatedUser = trackerStore.saveUser({
      id: userId,
      name,
      email,
      provider: authProvider,
      isLoggedIn: true,
      setupComplete: isSetupDone,
      lifestyle: cloudSetup
        ? {
            student: cloudSetup.student,
            gym: cloudSetup.gym,
            sports: cloudSetup.sports,
            work: cloudSetup.work,
            hobbies: Array.isArray(cloudSetup.hobbies) ? cloudSetup.hobbies : ['Music', 'Reading']
          }
        : trackerStore.getUser().lifestyle
    });

    setUser(updatedUser);
    setStep(isSetupDone ? 'dashboard' : 'setup');

    // 3. Hydrate dashboard metrics from cloud if user has cloud data
    const cloudDashboard = await fetchDashboardDataFromCloud(userId);
    if (cloudDashboard) {
      const hydratedMetrics = trackerStore.hydrateFromCloudData(cloudDashboard);
      setMetrics({ ...hydratedMetrics });
      setWellbeing(trackerStore.getWellbeing());
      setInsights(trackerStore.getAIInsights());
    }
  }, []);

  // Supabase Auth listener & Session initialization
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      // 1. Check existing session on boot (preserves login on page refresh)
      getSession().then(session => {
        if (session?.user) {
          hydrateUserFromCloud(session.user);
        }
      });

      // 2. Listen to auth changes (OAuth redirect return, sign-in, sign-out)
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            hydrateUserFromCloud(session.user);
          } else if (event === 'SIGNED_OUT') {
            trackerStore.logout();
            setUser(trackerStore.getUser());
            setStep('login');
          }
        }
      );

      return () => {
        authListener?.subscription.unsubscribe();
      };
    } else {
      // Fallback local persistence
      const currentUser = trackerStore.getUser();
      setUser(currentUser);
      setMetrics(trackerStore.getMetrics());
      setInsights(trackerStore.getAIInsights());
      setWellbeing(trackerStore.getWellbeing());
    }
  }, [hydrateUserFromCloud]);

  // Demonstration notification timer on first dashboard load
  useEffect(() => {
    if (user.isLoggedIn && user.setupComplete && step === 'dashboard') {
      const timer = setTimeout(() => {
        triggerNotification('mood');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, user.isLoggedIn, user.setupComplete]);

  // Handle Login Success
  const handleLoginSuccess = async (
    provider: 'google' | 'facebook' | 'email',
    name: string,
    id?: string,
    email?: string
  ) => {
    const userEmail = email || `${name.toLowerCase()}@aura.app`;
    const updated = trackerStore.login(provider, name, userEmail, id);
    setUser(updated);

    // If cloud is configured, check if user setup exists in database
    if (isSupabaseConfigured() && updated.id) {
      const cloudSetup = await fetchUserSetupFromCloud(updated.id);
      if (cloudSetup) {
        const withSetup = trackerStore.saveUser({
          setupComplete: true,
          lifestyle: {
            student: cloudSetup.student,
            gym: cloudSetup.gym,
            sports: cloudSetup.sports,
            work: cloudSetup.work,
            hobbies: Array.isArray(cloudSetup.hobbies) ? cloudSetup.hobbies : ['Music', 'Reading']
          }
        });
        setUser(withSetup);
        setStep('dashboard');

        // Hydrate metrics from database
        const cloudData = await fetchDashboardDataFromCloud(updated.id);
        if (cloudData) {
          const hydrated = trackerStore.hydrateFromCloudData(cloudData);
          setMetrics({ ...hydrated });
        }
        return;
      }
    }

    setStep('setup');
  };

  // Handle Setup Completion: Saves answers to cloud database
  const handleSetupComplete = (lifestyle: UserProfile['lifestyle']) => {
    const updated = trackerStore.completeSetup(lifestyle, user.id);
    setUser(updated);
    setStep('dashboard');

    // Trigger welcoming notification after 1.2s
    setTimeout(() => {
      triggerNotification('mood');
    }, 1200);
  };

  // Trigger a phone notification (User Input Interface)
  const triggerNotification = (preferredCategory?: MetricCategory) => {
    if (preferredCategory) {
      const q = notificationQuestions.find(item => item.category === preferredCategory);
      if (q) {
        setActiveQuestion(q);
        return;
      }
    }
    const randomIndex = Math.floor(Math.random() * notificationQuestions.length);
    setActiveQuestion(notificationQuestions[randomIndex]);
  };

  // User answers directly from notification!
  // Saves to cloud database and updates dashboard statistics instantly
  const handleAnswerSelected = (
    category: MetricCategory,
    option: { label: string; emoji: string; score: number },
    elapsed = 2.0
  ) => {
    const questionDetails = activeQuestion
      ? { id: activeQuestion.id, question: activeQuestion.question, elapsed }
      : { id: `q_${category}`, question: `Check-in for ${category}`, elapsed };

    const updatedMetrics = trackerStore.answerNotification(
      category,
      option,
      questionDetails,
      user.id
    );

    setMetrics({ ...updatedMetrics });
    setInsights(trackerStore.getAIInsights());

    // Highlight the card on the dashboard
    setRecentlyUpdatedCategory(category);
    setTimeout(() => {
      setRecentlyUpdatedCategory(null);
    }, 3000);
  };

  // Handle Logout / Reset
  const handleLogout = async () => {
    await signOutUser();
    trackerStore.logout();
    setUser(trackerStore.getUser());
    setStep('login');
    setActiveQuestion(null);
  };

  // Digital well-being permission actions
  const handleAllowWellbeing = () => {
    const updated = trackerStore.setWellbeingPermission(true, user.id);
    setWellbeing(updated);
    setShowPermissionModal(false);
    setMetrics(trackerStore.getMetrics());
  };

  const handleDenyWellbeing = () => {
    const updated = trackerStore.setWellbeingPermission(false, user.id);
    setWellbeing(updated);
    setShowPermissionModal(false);
    setMetrics(trackerStore.getMetrics());
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', position: 'relative' }}>
      {/* 
        FLOATING INTERACTIVE PHONE NOTIFICATION 
        "The notification itself is the user's input interface. DO NOT create a separate Notifications or Check-in page."
      */}
      {activeQuestion && step === 'dashboard' && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92%',
            maxWidth: 440,
            zIndex: 1050
          }}
        >
          <NotificationWidget
            question={activeQuestion}
            onAnswerSelected={handleAnswerSelected}
            onDismiss={() => setActiveQuestion(null)}
          />
        </div>
      )}

      {/* STEP 1: LOGIN */}
      {step === 'login' && <LoginScreen onLoginSuccess={handleLoginSuccess} />}

      {/* STEP 2: USER SETUP (Lifestyle questions with selectable cards only) */}
      {step === 'setup' && <UserSetupScreen onSetupComplete={handleSetupComplete} />}

      {/* STEP 3: MAIN APP CONTENT WITH NAVIGATION */}
      {step === 'dashboard' && (
        <>
          {/* Main Top Navigation: Dashboard | Overview | Settings */}
          <Navigation currentTab={mainTab} onTabChange={setMainTab} />

          {/* TAB 1: DASHBOARD (Preserved Exactly) */}
          {mainTab === 'dashboard' && (
            <DashboardView
              user={user}
              metrics={metrics}
              insights={insights}
              wellbeing={wellbeing}
              recentlyUpdatedCategory={recentlyUpdatedCategory}
              onTriggerNotification={triggerNotification}
              onRequestWellbeingPermission={() => setShowPermissionModal(true)}
              onLogout={handleLogout}
            />
          )}

          {/* TAB 2: OVERVIEW / INSIGHTS (Weekly + Monthly real data) */}
          {mainTab === 'overview' && (
            <OverviewView
              user={user}
              onNavigateToDashboard={() => setMainTab('dashboard')}
            />
          )}

          {/* TAB 3: SETTINGS (Theme switch + Logout) */}
          {mainTab === 'settings' && (
            <SettingsView
              user={user}
              currentTheme={theme}
              onThemeChange={setTheme}
              onLogout={handleLogout}
            />
          )}

          {/* FLOATING CUTE PANDA AI ASSISTANT BUTTON */}
          <PandaAssistant
            isOpen={isChatOpen}
            onClick={() => setIsChatOpen(!isChatOpen)}
          />

          {/* AI CHATBOT PANEL */}
          <ChatbotPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            user={user}
          />
        </>
      )}

      {/* DIGITAL WELL-BEING PERMISSION MODAL */}
      <DigitalWellbeingModal
        isOpen={showPermissionModal}
        onAllow={handleAllowWellbeing}
        onDeny={handleDenyWellbeing}
      />
    </div>
  );
}

export default App;
