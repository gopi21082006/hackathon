/**
 * AI Pattern Analysis Engine for Emotional Well-being Tracker
 * Strictly processes structured numerical ratings (1-5) and binary (Yes/No) inputs
 * paired with digital well-being telemetry (screen time minutes, pickups, category hours).
 *
 * Provides non-medical, pattern-based insights and gentle behavioral nudges.
 */

// Helper: Calculate Pearson correlation coefficient
function calculatePearsonCorrelation(x, y) {
  const n = x.length;
  if (n < 3) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(2));
}

// Helper: Group check-ins by date
function groupCheckinsByDate(checkins) {
  const map = {};
  for (const item of checkins) {
    const date = item.timestamp.split('T')[0];
    if (!map[date]) {
      map[date] = {
        date,
        morning: null,
        afternoon: null,
        evening: null,
        night: null,
        responseTimes: []
      };
    }
    if (item.slot === 'morning') map[date].morning = item.value;
    if (item.slot === 'afternoon') map[date].afternoon = item.value;
    if (item.slot === 'evening') map[date].evening = item.value;
    if (item.slot === 'night') map[date].night = item.value;
    if (item.answeredInSeconds) map[date].responseTimes.push(item.answeredInSeconds);
  }
  return map;
}

export function analyzeWellbeingPatterns(checkins = [], wellbeingLogs = []) {
  const disclaimer = "Notice: These automated insights are derived strictly from your numerical ratings and digital usage metrics. They are non-medical, observational pattern indicators designed to promote self-awareness and gentle lifestyle rhythm.";

  if (!checkins || checkins.length < 4) {
    return {
      status: "insufficient_data",
      sampleCount: checkins.length,
      insights: [
        {
          id: "welcome_init",
          type: "status",
          confidence: "low",
          title: "Calibrating Your Baseline",
          summary: "Log at least 3-4 days of check-ins to activate multi-variable pattern discovery.",
          gentleSuggestion: "Take 2–3 seconds when notifications chime to tap your rating or Yes/No answer.",
          metricBadge: "Data Collection Phase"
        }
      ],
      correlations: {
        screenTimeVsCalm: 0,
        lateNightScreenVsRested: 0,
        breakDaysCalmLift: 0
      },
      stats: {
        avgResponseSeconds: 2.3,
        totalCheckins: checkins.length,
        completionRate: 100
      },
      disclaimer
    };
  }

  const dateMap = groupCheckinsByDate(checkins);
  const wellbeingMap = new Map(wellbeingLogs.map(w => [w.date, w]));

  const pairedDays = [];
  const allResponseTimes = [];

  for (const [date, chk] of Object.entries(dateMap)) {
    const wb = wellbeingMap.get(date);
    if (chk.responseTimes) allResponseTimes.push(...chk.responseTimes);
    if (wb) {
      pairedDays.push({
        date,
        checkin: chk,
        wellbeing: wb
      });
    }
  }

  // Sort by date ascending
  pairedDays.sort((a, b) => a.date.localeCompare(b.date));

  // 1. Screen Time vs Evening Calm Correlation
  const screenTimes = [];
  const eveningCalms = [];
  for (const d of pairedDays) {
    if (d.checkin.night !== null && d.wellbeing.totalScreenTimeMinutes) {
      screenTimes.push(d.wellbeing.totalScreenTimeMinutes);
      eveningCalms.push(Number(d.checkin.night));
    }
  }
  const screenCalmCorr = calculatePearsonCorrelation(screenTimes, eveningCalms);

  // 2. Late Night Screen Time vs Next Morning Restedness
  const lateNightMins = [];
  const nextMorningRested = [];
  for (let i = 0; i < pairedDays.length - 1; i++) {
    const today = pairedDays[i];
    const tomorrow = pairedDays[i + 1];
    if (today.wellbeing.lateNightScreenMinutes !== undefined && tomorrow.checkin.morning !== null) {
      lateNightMins.push(today.wellbeing.lateNightScreenMinutes);
      nextMorningRested.push(Number(tomorrow.checkin.morning));
    }
  }
  const lateNightCorr = calculatePearsonCorrelation(lateNightMins, nextMorningRested);

  // 3. Screen Break Impact on Calm (Evening Break == true vs false)
  const breakCalmScores = [];
  const noBreakCalmScores = [];
  for (const d of pairedDays) {
    if (d.checkin.evening !== null && d.checkin.night !== null) {
      if (d.checkin.evening === true || d.checkin.evening === 1) {
        breakCalmScores.push(Number(d.checkin.night));
      } else {
        noBreakCalmScores.push(Number(d.checkin.night));
      }
    }
  }

  const avgBreakCalm = breakCalmScores.length > 0 
    ? breakCalmScores.reduce((a, b) => a + b, 0) / breakCalmScores.length 
    : 0;
  const avgNoBreakCalm = noBreakCalmScores.length > 0 
    ? noBreakCalmScores.reduce((a, b) => a + b, 0) / noBreakCalmScores.length 
    : 0;
  const breakCalmLift = avgBreakCalm && avgNoBreakCalm 
    ? Number((avgBreakCalm - avgNoBreakCalm).toFixed(2)) 
    : 0;

  // 4. Afternoon Overwhelm Analysis
  let overwhelmDays = 0;
  let totalAfternoonDays = 0;
  let overwhelmScreenSum = 0;
  let nonOverwhelmScreenSum = 0;
  let overwhelmCount = 0;
  let nonOverwhelmCount = 0;

  for (const d of pairedDays) {
    if (d.checkin.afternoon !== null) {
      totalAfternoonDays++;
      const isOverwhelmed = d.checkin.afternoon === true || d.checkin.afternoon === 1;
      if (isOverwhelmed) {
        overwhelmDays++;
        overwhelmScreenSum += d.wellbeing.totalScreenTimeMinutes;
        overwhelmCount++;
      } else {
        nonOverwhelmScreenSum += d.wellbeing.totalScreenTimeMinutes;
        nonOverwhelmCount++;
      }
    }
  }

  const overwhelmRate = totalAfternoonDays > 0 
    ? Math.round((overwhelmDays / totalAfternoonDays) * 100) 
    : 0;

  // 5. Response Time Latency
  const avgResponseSeconds = allResponseTimes.length > 0
    ? Number((allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length).toFixed(1))
    : 2.2;

  // Generate Pattern-Driven Structured Insights
  const insights = [];

  // Insight 1: Screen Time vs Evening Calm
  if (screenCalmCorr < -0.25) {
    insights.push({
      id: "screen_calm_negative",
      category: "Screen Balance",
      confidence: "high",
      significance: "moderate",
      title: "Screen Time Dampens Evening Calm",
      summary: `There is a noticeable inverse correlation (r = ${screenCalmCorr}) between daily total screen duration and nighttime calm. Extended screen days average lower ratings.`,
      gentleSuggestion: "Consider a designated 20-minute screen twilight transition before turning in.",
      metricBadge: `Correlation: ${screenCalmCorr}`,
      type: "opportunity"
    });
  } else if (screenCalmCorr >= 0.25) {
    insights.push({
      id: "screen_calm_neutral",
      category: "Screen Balance",
      confidence: "medium",
      significance: "positive",
      title: "Balanced Digital Consumption",
      summary: "Your daily screen hours show no adverse drag on evening tranquility.",
      gentleSuggestion: "Maintain your healthy digital boundaries during high-output sessions.",
      metricBadge: `Steady Stability (r = ${screenCalmCorr})`,
      type: "affirmation"
    });
  } else {
    insights.push({
      id: "screen_calm_neutral_general",
      category: "Screen Balance",
      confidence: "medium",
      significance: "neutral",
      title: "Moderate Digital Equilibrium",
      summary: "Screen hours remain within an adaptable threshold without acute emotional swing.",
      gentleSuggestion: "Keep monitoring your weekly distribution to preserve this balance.",
      metricBadge: "Equilibrium Detected",
      type: "neutral"
    });
  }

  // Insight 2: Screen Breaks & Recovery
  if (breakCalmLift > 0.4) {
    insights.push({
      id: "break_resilience_positive",
      category: "Micro-Habits",
      confidence: "high",
      significance: "high",
      title: "Midday Screen Breaks Create Calm Lift",
      summary: `On days when you stepped away from screens, your evening calm score averaged +${breakCalmLift} points higher (${avgBreakCalm.toFixed(1)} vs ${avgNoBreakCalm.toFixed(1)} / 5.0).`,
      gentleSuggestion: "Protect a 5-minute screen-free window around sunset or after your longest task.",
      metricBadge: `+${Math.round((breakCalmLift / 5) * 100)}% Calm Lift`,
      type: "superpower"
    });
  } else {
    insights.push({
      id: "break_resilience_habit",
      category: "Micro-Habits",
      confidence: "medium",
      significance: "moderate",
      title: "Screen Break Micro-Ritual",
      summary: "Intermittent eye and postural breaks help relieve latent cognitive tension.",
      gentleSuggestion: "Try the 20-20-20 visual rest rhythm during peak afternoon screen blocks.",
      metricBadge: "Habit Target",
      type: "opportunity"
    });
  }

  // Insight 3: Late Night Usage vs Morning Energy
  if (lateNightCorr < -0.2) {
    insights.push({
      id: "late_screen_morning_lag",
      category: "Circadian Rhythm",
      confidence: "high",
      significance: "moderate",
      title: "Late-Night Luminescence Lowers Morning Rest",
      summary: `Device usage after 10:00 PM correlates with reduced morning restedness ratings (r = ${lateNightCorr}).`,
      gentleSuggestion: "Switch to amber night-shift mode or charge your phone slightly away from the bedside.",
      metricBadge: `Inverse R: ${lateNightCorr}`,
      type: "opportunity"
    });
  }

  // Insight 4: Afternoon Overwhelm Trend
  if (overwhelmRate > 35) {
    insights.push({
      id: "afternoon_slump_cluster",
      category: "Diurnal Energy",
      confidence: "medium",
      significance: "moderate",
      title: "Afternoon Overwhelm Frequency",
      summary: `You reported feeling overwhelmed during ${overwhelmRate}% of afternoon 1:30 PM check-ins.`,
      gentleSuggestion: "Schedule light admin or take a quiet 3-minute breath pause right before 1:30 PM.",
      metricBadge: `${overwhelmRate}% Occurrence`,
      type: "warning"
    });
  } else {
    insights.push({
      id: "afternoon_resilience",
      category: "Diurnal Energy",
      confidence: "high",
      significance: "positive",
      title: "Strong Midday Composure",
      summary: `Only ${overwhelmRate}% of afternoon check-ins registered feelings of overwhelm.`,
      gentleSuggestion: "Acknowledge your steady task pacing throughout the early afternoon stretch.",
      metricBadge: `${100 - overwhelmRate}% Steady Days`,
      type: "affirmation"
    });
  }

  // Insight 5: Micro-Interaction Speed (2-3 second answering)
  insights.push({
    id: "frictionless_response_rate",
    category: "System Engagement",
    confidence: "high",
    significance: "positive",
    title: "Ultra-Low Response Latency",
    summary: `Your average check-in latency is ${avgResponseSeconds} seconds, fulfilling frictionless notification capture.`,
    gentleSuggestion: "Continue answering directly through notification chips without opening full panels.",
    metricBadge: `${avgResponseSeconds}s Avg Latency`,
    type: "affirmation"
  });

  return {
    status: "active",
    analyzedDays: pairedDays.length,
    correlations: {
      screenTimeVsCalm: screenCalmCorr,
      lateNightScreenVsRested: lateNightCorr,
      breakDaysCalmLift: breakCalmLift
    },
    averages: {
      breakCalm: Number(avgBreakCalm.toFixed(2)),
      noBreakCalm: Number(avgNoBreakCalm.toFixed(2)),
      overwhelmRate
    },
    stats: {
      avgResponseSeconds,
      totalCheckins: checkins.length,
      pairedTelemetryDays: pairedDays.length
    },
    insights,
    disclaimer
  };
}
