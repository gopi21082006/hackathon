import type { CheckinItem, DigitalWellbeingLog, InsightReport } from '../types';

const CHECKINS_KEY = 'aura_local_checkins';
const WELLBEING_KEY = 'aura_local_wellbeing';
const PERMISSION_KEY = 'aura_wb_permission';
const LAST_SYNC_KEY = 'aura_last_sync';

export const localStore = {
  // Check-ins (Saved on device first)
  getCheckins(): CheckinItem[] {
    try {
      const data = localStorage.getItem(CHECKINS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCheckinLocally(item: Omit<CheckinItem, 'id' | 'synced'>): CheckinItem {
    const list = this.getCheckins();
    const newItem: CheckinItem = {
      ...item,
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      synced: false
    };
    list.unshift(newItem);
    localStorage.setItem(CHECKINS_KEY, JSON.stringify(list));
    return newItem;
  },

  setAllCheckins(list: CheckinItem[]) {
    localStorage.setItem(CHECKINS_KEY, JSON.stringify(list));
  },

  getUnsyncedCheckins(): CheckinItem[] {
    return this.getCheckins().filter(c => !c.synced);
  },

  markCheckinsSynced(ids: string[]) {
    const set = new Set(ids);
    const list = this.getCheckins().map(c => {
      if (set.has(c.id)) {
        return { ...c, synced: true };
      }
      return c;
    });
    localStorage.setItem(CHECKINS_KEY, JSON.stringify(list));
  },

  // Digital Well-being Permission
  hasWellbeingPermission(): boolean {
    const val = localStorage.getItem(PERMISSION_KEY);
    return val === null ? true : val === 'true'; // default enabled
  },

  setWellbeingPermission(granted: boolean) {
    localStorage.setItem(PERMISSION_KEY, String(granted));
  },

  // Digital Well-being Telemetry
  getWellbeingLogs(): DigitalWellbeingLog[] {
    try {
      const data = localStorage.getItem(WELLBEING_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setAllWellbeingLogs(list: DigitalWellbeingLog[]) {
    localStorage.setItem(WELLBEING_KEY, JSON.stringify(list));
  },

  saveTodayWellbeing(log: Partial<DigitalWellbeingLog>): DigitalWellbeingLog {
    const today = new Date().toISOString().split('T')[0];
    const list = this.getWellbeingLogs();
    const existingIndex = list.findIndex(w => w.date === today);

    const defaultCategories = {
      social: 75,
      productivity: 140,
      entertainment: 65,
      communication: 40
    };

    const fullLog: DigitalWellbeingLog = {
      id: `wb_${today}`,
      userId: 'usr_default',
      date: today,
      totalScreenTimeMinutes: log.totalScreenTimeMinutes ?? 320,
      pickupsCount: log.pickupsCount ?? 58,
      lateNightScreenMinutes: log.lateNightScreenMinutes ?? 25,
      categories: log.categories ?? defaultCategories,
      longestSessionMinutes: log.longestSessionMinutes ?? 45,
      synced: false
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...fullLog, synced: false };
    } else {
      list.unshift(fullLog);
    }

    localStorage.setItem(WELLBEING_KEY, JSON.stringify(list));
    return fullLog;
  },

  // Last Sync Timestamp
  getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  },

  setLastSyncTime(iso: string) {
    localStorage.setItem(LAST_SYNC_KEY, iso);
  },

  // Cloud/Backend Sync Engine
  async syncToBackend(): Promise<{ success: boolean; syncedCheckins: number; syncedWellbeing: number; error?: string }> {
    const unsyncedCheckins = this.getUnsyncedCheckins();
    const wellbeingLogs = this.getWellbeingLogs();
    const unsyncedWellbeing = wellbeingLogs.filter(w => !w.synced);

    try {
      // 1. Sync Checkins
      if (unsyncedCheckins.length > 0) {
        const res = await fetch('/api/checkins/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkins: unsyncedCheckins })
        });
        if (!res.ok) throw new Error('Checkins sync failed');
        this.markCheckinsSynced(unsyncedCheckins.map(c => c.id));
      }

      // 2. Sync Well-being Telemetry
      if (unsyncedWellbeing.length > 0) {
        const res = await fetch('/api/wellbeing/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: unsyncedWellbeing })
        });
        if (!res.ok) throw new Error('Wellbeing sync failed');
        const set = new Set(unsyncedWellbeing.map(w => w.date));
        const updated = wellbeingLogs.map(w => set.has(w.date) ? { ...w, synced: true } : w);
        this.setAllWellbeingLogs(updated);
      }

      const now = new Date().toISOString();
      this.setLastSyncTime(now);

      return {
        success: true,
        syncedCheckins: unsyncedCheckins.length,
        syncedWellbeing: unsyncedWellbeing.length
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCheckins: 0,
        syncedWellbeing: 0,
        error: err.message || 'Network error'
      };
    }
  },

  // Pull all data from backend (useful for initial load or seeding)
  async pullFromBackend(): Promise<boolean> {
    try {
      const [chkRes, wbRes] = await Promise.all([
        fetch('/api/checkins?limit=100'),
        fetch('/api/wellbeing?days=30')
      ]);

      if (chkRes.ok && wbRes.ok) {
        const { checkins } = await chkRes.json();
        const { wellbeing } = await wbRes.json();

        if (Array.isArray(checkins) && checkins.length > 0) {
          const marked = checkins.map((c: CheckinItem) => ({ ...c, synced: true }));
          this.setAllCheckins(marked);
        }

        if (Array.isArray(wellbeing) && wellbeing.length > 0) {
          const markedWb = wellbeing.map((w: DigitalWellbeingLog) => ({ ...w, synced: true }));
          this.setAllWellbeingLogs(markedWb);
        }

        this.setLastSyncTime(new Date().toISOString());
        return true;
      }
    } catch (e) {
      console.warn('Backend offline or unreachable, using local data', e);
    }
    return false;
  }
};
