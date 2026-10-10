import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultState = {
  checkins: [],
  digitalWellbeing: [],
  settings: {
    userId: 'usr_default',
    notificationsEnabled: true,
    digitalWellbeingPermission: true,
    scheduledSlots: {
      morning: '08:30',
      afternoon: '13:30',
      evening: '18:30',
      night: '22:00'
    },
    cloudSyncEnabled: true,
    lastSyncedAt: null
  }
};

class Database {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return { ...defaultState, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Failed to read db file, using defaults:', err.message);
    }
    this.save(defaultState);
    return defaultState;
  }

  save(dataToSave) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db file:', err.message);
    }
  }

  // Check-ins
  getCheckins(limit = 100) {
    return [...this.data.checkins]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  upsertCheckins(newCheckins) {
    const existingMap = new Map(this.data.checkins.map(c => [c.id, c]));
    for (const item of newCheckins) {
      existingMap.set(item.id, {
        ...item,
        syncedAt: new Date().toISOString()
      });
    }
    this.data.checkins = Array.from(existingMap.values());
    this.save();
    return this.data.checkins.length;
  }

  // Digital Well-being
  getWellbeing(days = 30) {
    return [...this.data.digitalWellbeing]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, days);
  }

  upsertWellbeing(logs) {
    const existingMap = new Map(this.data.digitalWellbeing.map(w => [w.date, w]));
    for (const log of logs) {
      existingMap.set(log.date, {
        ...log,
        syncedAt: new Date().toISOString()
      });
    }
    this.data.digitalWellbeing = Array.from(existingMap.values());
    this.save();
    return this.data.digitalWellbeing.length;
  }

  // Settings
  getSettings() {
    return this.data.settings;
  }

  updateSettings(partial) {
    this.data.settings = { ...this.data.settings, ...partial };
    this.save();
    return this.data.settings;
  }

  clear() {
    this.data = {
      checkins: [],
      digitalWellbeing: [],
      settings: { ...defaultState.settings }
    };
    this.save();
  }
}

export const db = new Database();
