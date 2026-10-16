import { useSyncExternalStore } from 'react';
import { clampMemoryQuestions, DEFAULT_MEMORY_QUESTIONS } from './memoryMission';

export interface AlarmData {
  id: string;
  hour: number;
  minute: number;
  period: 'am' | 'pm';
  repeatDays: number[]; // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  name: string;
  mission: string;
  sound: string;
  vibration: string;
  snooze: string;
  // Memory mission configuration (optional so alarms persisted before
  // this feature existed keep loading cleanly)
  memoryQuestions?: number;
  memoryDifficulty?: string;
  wakeUpCheck: boolean;
  showMemo: boolean;
  memo: string;
  enabled: boolean;
}

export const defaultAlarmTemplate: AlarmData = {
  id: 'alarm-default',
  hour: 6,
  minute: 5,
  period: 'am',
  repeatDays: [0, 1, 2, 3, 4, 5, 6],
  name: 'Every day',
  mission: 'Memory',
  sound: 'Skyblue',
  vibration: 'Basic',
  snooze: '5 minutes, forever',
  memoryQuestions: DEFAULT_MEMORY_QUESTIONS,
  memoryDifficulty: 'Normal',
  wakeUpCheck: false,
  showMemo: true,
  memo: '',
  enabled: false,
};

const initialAlarms: AlarmData[] = [
  {
    id: 'alarm-1',
    hour: 6,
    minute: 5,
    period: 'am',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    name: 'Every day',
    mission: 'Memory',
    sound: 'Skyblue',
    vibration: 'Basic',
    snooze: '5 minutes, forever',
    memoryQuestions: DEFAULT_MEMORY_QUESTIONS,
    memoryDifficulty: 'Normal',
    wakeUpCheck: false,
    showMemo: true,
    memo: '',
    enabled: false,
  },
  {
    id: 'alarm-2',
    hour: 6,
    minute: 23,
    period: 'am',
    repeatDays: [],
    name: 'Tomorrow',
    mission: 'Memory',
    sound: 'Skyblue',
    vibration: 'Basic',
    snooze: '5 minutes, forever',
    memoryQuestions: DEFAULT_MEMORY_QUESTIONS,
    memoryDifficulty: 'Normal',
    wakeUpCheck: false,
    showMemo: true,
    memo: '',
    enabled: false,
  },
];

const STORAGE_KEY = '@productivity/alarms_data';

let alarms: AlarmData[] = [...initialAlarms];
let activeEditingAlarmId: string | null = initialAlarms[0].id;
let activeEditingAlarm: AlarmData = { ...initialAlarms[0] };

const alarmListeners = new Set<() => void>();
const alarmsListeners = new Set<() => void>();

function notifyAlarm() {
  alarmListeners.forEach((listener) => listener());
}

function notifyAlarms() {
  alarmsListeners.forEach((listener) => listener());
}

function notifyAll() {
  notifyAlarm();
  notifyAlarms();
}

export function saveAlarmsToStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
    }
  } catch {
    // Ignore web storage errors
  }

  try {
    // Attempt dynamic native file storage if running in native Expo environment
    const FileSystem = require('expo-file-system/legacy');
    if (FileSystem && FileSystem.documentDirectory) {
      const fileUri = `${FileSystem.documentDirectory}productivity_alarms.json`;
      FileSystem.writeAsStringAsync(fileUri, JSON.stringify(alarms)).catch(() => {});
    }
  } catch {
    // Ignore native file errors
  }
}

function normalizeLoadedAlarms(loaded: AlarmData[]): AlarmData[] {
  return loaded.map((a) => ({
    ...a,
    memoryQuestions:
      typeof a.memoryQuestions === 'number'
        ? clampMemoryQuestions(a.memoryQuestions)
        : DEFAULT_MEMORY_QUESTIONS,
  }));
}

export function loadAlarmsFromStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          alarms = normalizeLoadedAlarms(parsed);
          if (alarms.length > 0) {
            activeEditingAlarmId = alarms[0].id;
            activeEditingAlarm = { ...alarms[0] };
          } else {
            activeEditingAlarmId = null;
            activeEditingAlarm = { ...defaultAlarmTemplate };
          }
          notifyAll();
          return;
        }
      }
    }
  } catch {
    // Ignore web storage errors
  }

  try {
    const FileSystem = require('expo-file-system/legacy');
    if (FileSystem && FileSystem.documentDirectory) {
      const fileUri = `${FileSystem.documentDirectory}productivity_alarms.json`;
      FileSystem.getInfoAsync(fileUri).then((info: { exists: boolean }) => {
        if (info.exists) {
          FileSystem.readAsStringAsync(fileUri).then((content: string) => {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              alarms = normalizeLoadedAlarms(parsed);
              if (alarms.length > 0) {
                activeEditingAlarmId = alarms[0].id;
                activeEditingAlarm = { ...alarms[0] };
              } else {
                activeEditingAlarmId = null;
                activeEditingAlarm = { ...defaultAlarmTemplate };
              }
              notifyAll();
            }
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  } catch {
    // Ignore native file errors
  }
}

// Initial load from storage
loadAlarmsFromStorage();

export function getAlarms(): AlarmData[] {
  return alarms;
}

export function getAlarm(): AlarmData {
  return activeEditingAlarm;
}

export function setEditingAlarm(id?: string) {
  if (id) {
    const existing = alarms.find((a) => a.id === id);
    if (existing) {
      activeEditingAlarmId = id;
      activeEditingAlarm = { ...existing };
      notifyAlarm();
      return;
    }
  }
  // Creation mode for new alarm
  const newId = `alarm-${Date.now()}`;
  activeEditingAlarmId = newId;
  activeEditingAlarm = {
    ...defaultAlarmTemplate,
    id: newId,
  };
  notifyAlarm();
}

export function updateAlarm(patch: Partial<AlarmData>): AlarmData {
  activeEditingAlarm = { ...activeEditingAlarm, ...patch };
  if (activeEditingAlarmId) {
    const index = alarms.findIndex((a) => a.id === activeEditingAlarmId);
    if (index !== -1) {
      alarms[index] = { ...activeEditingAlarm };
      saveAlarmsToStorage();
    }
  }
  notifyAll();
  return activeEditingAlarm;
}

export function saveCurrentAlarm(patch?: Partial<AlarmData>) {
  if (patch) {
    activeEditingAlarm = { ...activeEditingAlarm, ...patch };
  }
  if (!activeEditingAlarmId) {
    activeEditingAlarmId = activeEditingAlarm.id || `alarm-${Date.now()}`;
    activeEditingAlarm.id = activeEditingAlarmId;
  }
  const index = alarms.findIndex((a) => a.id === activeEditingAlarmId);
  if (index !== -1) {
    alarms[index] = { ...activeEditingAlarm };
  } else {
    alarms.push({ ...activeEditingAlarm });
  }
  saveAlarmsToStorage();
  notifyAll();
}

export function deleteCurrentAlarm() {
  if (activeEditingAlarmId) {
    alarms = alarms.filter((a) => a.id !== activeEditingAlarmId);
    if (alarms.length > 0) {
      activeEditingAlarmId = alarms[0].id;
      activeEditingAlarm = { ...alarms[0] };
    } else {
      activeEditingAlarmId = null;
      activeEditingAlarm = { ...defaultAlarmTemplate };
    }
    saveAlarmsToStorage();
    notifyAll();
  }
}

export function deleteDisabledAlarms(): number {
  const initialCount = alarms.length;
  alarms = alarms.filter((a) => a.enabled);
  const deletedCount = initialCount - alarms.length;

  if (activeEditingAlarmId) {
    const exists = alarms.some((a) => a.id === activeEditingAlarmId);
    if (!exists) {
      if (alarms.length > 0) {
        activeEditingAlarmId = alarms[0].id;
        activeEditingAlarm = { ...alarms[0] };
      } else {
        activeEditingAlarmId = null;
        activeEditingAlarm = { ...defaultAlarmTemplate };
      }
    }
  }

  saveAlarmsToStorage();
  notifyAll();
  return deletedCount;
}

export function toggleAlarmEnabled(id: string) {
  alarms = alarms.map((a) => {
    if (a.id === id) {
      return { ...a, enabled: !a.enabled };
    }
    return a;
  });
  if (activeEditingAlarmId && activeEditingAlarm.id === id) {
    activeEditingAlarm.enabled = !activeEditingAlarm.enabled;
  }
  saveAlarmsToStorage();
  notifyAll();
}

export function subscribeAlarm(listener: () => void): () => void {
  alarmListeners.add(listener);
  return () => {
    alarmListeners.delete(listener);
  };
}

export function subscribeAlarms(listener: () => void): () => void {
  alarmsListeners.add(listener);
  return () => {
    alarmsListeners.delete(listener);
  };
}

export function useAlarm(): AlarmData {
  return useSyncExternalStore(subscribeAlarm, getAlarm, getAlarm);
}

export function useAlarms(): AlarmData[] {
  return useSyncExternalStore(subscribeAlarms, getAlarms, getAlarms);
}

export function formatAlarmTime(hour: number, minute: number, period: 'am' | 'pm'): string {
  const paddedH = hour.toString().padStart(2, '0');
  const paddedM = minute.toString().padStart(2, '0');
  return `${paddedH}:${paddedM} ${period.toUpperCase()}`;
}

export const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function formatRepeatDays(days: number[]): string {
  if (days.length === 0) return 'Tomorrow';
  if (days.length === 7) return 'Every day';
  const sorted = [...days].sort((a, b) => a - b);
  const isWeekdays = sorted.length === 5 && sorted.every((d, i) => d === i + 1);
  if (isWeekdays) return 'Weekdays';
  const isWeekends = sorted.length === 2 && sorted.includes(0) && sorted.includes(6);
  if (isWeekends) return 'Weekends';
  return sorted.map((d) => DAY_NAMES[d]).join(', ');
}

export function getNextEnabledAlarm(alarmList: AlarmData[]): AlarmData | null {
  const enabled = alarmList.filter((a) => a.enabled);
  if (enabled.length === 0) return null;
  const now = new Date();
  let minDiff = Infinity;
  let nextAlarm = enabled[0];
  for (const alarm of enabled) {
    const target = new Date(now);
    let h24 = alarm.hour % 12;
    if (alarm.period === 'pm') h24 += 12;
    target.setHours(h24, alarm.minute, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const diff = target.getTime() - now.getTime();
    if (diff < minDiff) {
      minDiff = diff;
      nextAlarm = alarm;
    }
  }
  return nextAlarm;
}

export function calculateCountdownText(hour: number, minute: number, period: 'am' | 'pm'): string {
  const now = new Date();
  const target = new Date(now);
  let h24 = hour % 12;
  if (period === 'pm') {
    h24 += 12;
  }
  target.setHours(h24, minute, 0, 0);

  // If already passed today, set to tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diffMs = target.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (diffHours === 0 && remainingMinutes === 0) {
    return 'Alarm in less than a minute';
  }
  if (diffHours === 0) {
    return `Alarm in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
  }
  if (remainingMinutes === 0) {
    return `Alarm in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  }
  return `Alarm in ${diffHours} hour${diffHours === 1 ? '' : 's'} ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}`;
}
