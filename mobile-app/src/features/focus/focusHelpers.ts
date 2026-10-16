import { Alert, Platform } from 'react-native';

/** "27m", "1h 40m", "12h" */
export function formatMinutes(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  if (safe < 60) return `${safe}m`;
  const hours = Math.floor(safe / 60);
  const remainder = safe % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

/** Stepper label: "45m" or "1h 00m" (matches the reference design). */
export function formatLimit(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  if (safe < 60) return `${safe}m`;
  const hours = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${hours}h ${String(remainder).padStart(2, '0')}m`;
}

export const LIMIT_MIN_MIN = 5;
export const LIMIT_MAX_MIN = 12 * 60;
export const EMERGENCY_MAX = 5;
export const DEFAULT_DAILY_LIMIT_MIN = 60;
export const REMINDER_CHOICES = [5, 10, 15] as const;

/** 5 minute steps below 1h, 15 minute steps above; clamped to 5m - 12h. */
export function stepDailyLimit(current: number, direction: 1 | -1): number {
  const step = direction === 1 ? (current >= 60 ? 15 : 5) : current > 60 ? 15 : 5;
  const next = current + direction * step;
  return Math.min(LIMIT_MAX_MIN, Math.max(LIMIT_MIN_MIN, next));
}

export function clampEmergency(current: number, direction: 1 | -1): number {
  return Math.min(EMERGENCY_MAX, Math.max(0, current + direction));
}

/** Valid reminder choices strictly below the daily limit, ascending. */
export function validReminderChoices(dailyLimitMin: number): number[] {
  return REMINDER_CHOICES.filter((choice) => choice < dailyLimitMin);
}

/** Largest reminder time that is still below the limit (design: auto-select). */
export function defaultRemindMin(dailyLimitMin: number): number {
  const choices = validReminderChoices(dailyLimitMin);
  return choices.length ? choices[choices.length - 1] : 5;
}

export function floorMinutesFromSeconds(seconds: number | undefined): number {
  if (!seconds || seconds <= 0) return 0;
  return Math.floor(seconds / 60);
}

export function minutesFromSeconds(seconds: number | undefined): number {
  if (!seconds || seconds <= 0) return 0;
  return Math.floor(seconds / 60);
}

/**
 * Accepts "youtube.com", "https://www.youtube.com/watch?v=x", "  Instagram.com " ...
 * Returns the bare registrable host, or null when the input is not a valid domain.
 */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  value = value.split(/[/?#]/)[0] ?? '';
  value = value.replace(/:\d+$/, '');
  value = value.replace(/^www\./, '');
  value = value.replace(/\.+$/, '');
  if (!value || value.includes(' ') || !value.includes('.')) return null;
  if (value.length > 253) return null;
  const labels = value.split('.');
  const labelPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  if (labels.length < 2) return null;
  if (labels.some((label) => !labelPattern.test(label))) return null;
  const tld = labels[labels.length - 1] ?? '';
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) return null;
  return value;
}

/** True when host equals blocked domain or is a subdomain of it. */
export function hostMatchesDomain(host: string, domain: string): boolean {
  if (!host || !domain) return false;
  return host === domain || host.endsWith(`.${domain}`);
}

/** Browser URL text -> host, or null for search queries / unusable text. */
export function hostFromBrowserText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return normalizeDomain(trimmed);
  }
  if (trimmed.includes('.') && !trimmed.endsWith('.')) {
    return normalizeDomain(trimmed);
  }
  return null;
}

/** Promise-based confirm that also works in the web preview (Alert is a no-op there). */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  cancelLabel = 'Cancel'
): Promise<boolean> {
  if (Platform.OS === 'web') {
    const confirmed =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(`${title}\n\n${message}`)
        : false;
    return Promise.resolve(confirmed);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
