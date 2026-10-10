import React from 'react';
import { LayoutDashboard, BarChart3, Settings } from 'lucide-react';

export type MainNavTab = 'dashboard' | 'overview' | 'settings';

interface NavigationProps {
  currentTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as MainNavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'overview' as MainNavTab, label: 'Overview', icon: BarChart3 },
    { id: 'settings' as MainNavTab, label: 'Settings', icon: Settings }
  ];

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(var(--canvas-rgb, 251, 251, 250), 0.85)',
        borderBottom: '1px solid var(--border-light)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--surface)',
          padding: '4px',
          borderRadius: 9999,
          border: '1px solid var(--border-light)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#FFFFFF' : 'var(--ink-secondary)',
                background: isActive ? 'var(--ink-primary)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--ink-primary)';
                  e.currentTarget.style.background = 'var(--surface-hover)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--ink-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
