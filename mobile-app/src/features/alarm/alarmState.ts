import { useSyncExternalStore } from 'react';

export interface AlarmData {
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

const defaultAlarm: AlarmData = {
  hour: 6,
  minute: 5,
  period: 'am',
  repeatDays: [],
  name: '',
  mission: 'Memory',
  sound: 'Skyblue',
  vibration: 'Basic',
  snooze: '5 minutes, forever',
  wakeUpCheck: false,
  showMemo: true,
  memo: '',
  enabled: true,
};

let currentAlarm: AlarmData = { ...defaultAlarm };
const listeners = new Set<() => void>();

export function getAlarm(): AlarmData {
  return currentAlarm;
}

export function updateAlarm(patch: Partial<AlarmData>): AlarmData {
  currentAlarm = { ...currentAlarm, ...patch };
  listeners.forEach((listener) => listener());
  return currentAlarm;
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

export function formatAlarmTime(hour: number, minute: number, period: 'am' | 'pm'): string {
  const paddedH = hour.toString().padStart(2, '0');
  const paddedM = minute.toString().padStart(2, '0');
  return `${paddedH}:${paddedM} ${period.toUpperCase()}`;
}

export const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function formatRepeatDays(days: number[]): string {
  if (days.length === 0) return 'None';
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
