# Aura · Minimalist Emotional Well-being Tracker

A simple, clean, and unique Emotional Well-being Tracker mobile application with a responsive dashboard built with **React**, **Node.js**, and an **Interactive Phone Notification Input System**.

---

## 🌟 The Core Flow
```
LOGIN → USER SETUP → DASHBOARD → PHONE NOTIFICATION → USER ANSWERS DIRECTLY FROM NOTIFICATION → DASHBOARD STATISTICS UPDATE
```

> **CRITICAL ARCHITECTURE**:  
> The notification itself is the user's input interface. There is **NO** separate “Notifications” or “Check-in” page. The user answers tiny questions in 2–3 seconds directly from their phone notification, while the app quietly builds their emotional well-being picture in the dashboard.

---

## 📱 1. Login Screen
- **Minimal single-screen entry**:
  - `Continue with Google`
  - `Continue with Facebook`
  - `Email / Quick Login`
- Clean local authentication state with server and database structure ready for future cloud sync.

---

## 📋 2. User Setup (Lifestyle Onboarding)
Asks simple lifestyle questions **one at a time** using selectable cards only (zero text-heavy forms):
1. **Student?** (Yes, full-time / Pursuing / No)
2. **Gym?** (Regularly / Occasionally / No)
3. **Sports?** (Active / Weekends / Rarely)
4. **Work?** (Full-time / Remote / Freelance / None)
5. **Hobbies?** (Music, Reading, Art, Gaming, Outdoors, Cooking)

Smoothly auto-advances to the **Main Dashboard** upon completion.

---

## 🔔 3. Notification = User Input (Key Feature)
The app sends simple questions as **interactive phone notifications / widgets**:
- 🔔 *How is your mood?* → `[ 😊 Good ]` `[ 😐 Okay ]` `[ 😔 Low ]`
- 🔔 *Did you follow your diet today?* → `[ 😊 Yes ]` `[ 😐 Partly ]` `[ 😔 No ]`
- 🔔 *Did you sleep more than 7 hours?* → `[ 😊 Yes ]` `[ 😐 Almost ]` `[ 😔 No ]`
- 🔔 *Did you spend time on your hobby?* → `[ 😊 Yes ]` `[ 😐 A little ]` `[ 😔 No ]`
- 🔔 *How was your productivity today?* → `[ 😊 High ]` `[ 😐 Normal ]` `[ 😔 Low ]`
- 🔔 *Did you make progress in your studies?* → `[ 😊 Yes ]` `[ 😐 Some ]` `[ 😔 No ]`

**When the user taps an option directly on the notification**:
1. Response is recorded and saved locally.
2. The relevant card on the dashboard pulses with a subtle green highlight and updates its numerical value, status, and 7-day sparkline graph immediately.
3. The notification auto-dismisses in < 1 second.
4. **No separate check-in screen is opened.**

---

## 📱 4. Digital Well-being Telemetry
- Uses a system permission dialog (similar to granting camera permission).
- The user simply taps **Allow Access**.
- Automatically pulls and uses:
  - **Screen Time**: e.g., `3h 42m`
  - **App Usage Breakdown**: Productivity, Social, Hobby/Audio, Communication.
- Does **not** require any manual data entry.

---

## 📊 5. The Single Responsive Dashboard
A single unified dashboard that adapts responsively to mobile, tablet, and desktop screens. Contains **ONLY** the 7 core parameters:
1. 😊 **Mood**
2. 😴 **Sleep**
3. 🍎 **Food / Diet**
4. 📱 **Screen Time**
5. 🎨 **Hobby**
6. 💼 **Productivity**
7. 📚 **Study**

Each card features soft rounded corners, small visual indicators, and a clean mini 7-day sparkline graph.

---

## 🧠 6. AI Insights (Non-Medical)
Located directly on the same dashboard. Observational patterns generated strictly from structured numerical and rating data:
- `Pattern noticed`: *"Your mood was generally better on days when your sleep was above 7 hours."*
- `Possible relationship`: *"Your productivity was lower on days with higher screen time."*
- `Based on your recent data`: *"Spending time on your hobby shows a positive correlation with your evening calm."*
- `Pattern noticed`: *"Consistent meal and nutrition habits correlate with more stable afternoon energy."*

*(Strictly non-medical observational guidance).*

---

## 🚀 Running the Application
From the workspace root:
```bash
npm run dev
# or
npm start
```
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Cloud Database Schema**: `backend/schema.sql` (PostgreSQL / Supabase / Neon ready)
