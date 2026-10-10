import { useSyncExternalStore } from 'react';

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
    wakeUpCheck: false,
    showMemo: true,
    memo: '',
    enabled: false,
  },
];

let alarms: AlarmData[] = [...initialAlarms];
let activeEditingAlarmId: string | null = initialAlarms[0].id;
let activeEditingAlarm: AlarmData = { ...initialAlarms[0] };

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getAlarms(): AlarmData[] {
  return alarms;
}

export function getAlarm(): AlarmData {
  return activeEditingAlarm;
}

export function getActiveEditingAlarmId(): string | null {
  return activeEditingAlarmId;
}

export function setEditingAlarm(id?: string) {
  if (id) {
    const existing = alarms.find((a) => a.id === id);
    if (existing) {
      activeEditingAlarmId = id;
      activeEditingAlarm = { ...existing };
      notify();
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
  notify();
}

export function updateAlarm(patch: Partial<AlarmData>): AlarmData {
  activeEditingAlarm = { ...activeEditingAlarm, ...patch };
  if (activeEditingAlarmId) {
    const index = alarms.findIndex((a) => a.id === activeEditingAlarmId);
    if (index !== -1) {
      alarms[index] = { ...activeEditingAlarm };
    }
  }
  notify();
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
  notify();
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
    notify();
  }
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
  notify();
}

export function disableAllAlarms() {
  alarms = alarms.map((a) => ({ ...a, enabled: false }));
  if (activeEditingAlarm) {
    activeEditingAlarm.enabled = false;
  }
  notify();
}

export function subscribeAlarm(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAlarm(): AlarmData {
  return useSyncExternalStore(subscribeAlarm, getAlarm, getAlarm);
}

export function useAlarms(): AlarmData[] {
  return useSyncExternalStore(subscribeAlarm, getAlarms, getAlarms);
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
