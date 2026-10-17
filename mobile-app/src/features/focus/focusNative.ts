import { Platform } from 'react-native';
import nativeFocusBlocker, { type FocusBlockerNativeModule } from '../../../modules/focus-blocker';
import { BROWSER_URL_BAR_IDS, FEATURE_BLOCKS } from './blockingFeatures';

export type FocusPermissionKind =
  | 'usage'
  | 'accessibility'
  | 'overlay'
  | 'notifications'
  | 'battery';

export interface FocusPermissionStates {
  usage: boolean;
  accessibility: boolean;
  overlay: boolean;
  notifications: boolean;
  battery: boolean;
}

export interface InstalledApp {
  packageName: string;
  label: string;
}

export interface NativeFocusCounters {
  date: string;
  blocksFired: number;
  emergencyUsed: Record<string, number>;
}

/** Only Android in a development build exposes the native blocker. */
const native: FocusBlockerNativeModule | null =
  Platform.OS === 'android' ? nativeFocusBlocker : null;

/** False on iOS and in Expo Go: screens must disable Add and explain instead of crashing. */
export const hasNativeFocus: boolean = native !== null;
export const isAndroid: boolean = Platform.OS === 'android';

function parseJson<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error('Focus native storage returned invalid data.', { cause: error });
  }
}

export async function fetchInstalledApps(): Promise<InstalledApp[]> {
  if (!native) return [];
  return parseJson<InstalledApp[]>((await native.getInstalledApps()) ?? '[]', []);
}

/** Base64 PNG of the app's real launcher icon, or null when unavailable. */
export async function fetchAppIcon(packageName: string): Promise<string | null> {
  if (!native) return null;
  const encoded = (await native.getAppIcon(packageName)) ?? '';
  return encoded ? encoded : null;
}

/** Seconds in the foreground since local midnight, keyed by package. */
export function fetchUsageToday(packages: string[]): Promise<Record<string, number>> {
  if (!native) return Promise.reject(new Error('Focus usage is unavailable in this build.'));
  return native.getUsageToday(JSON.stringify(packages)).then((raw) => parseJson<Record<string, number>>(raw ?? '{}', {}));
}

export function hasUsageAccess(): Promise<boolean> {
  if (!native) return Promise.resolve(false);
  return native.hasUsageAccess();
}

export function openUsageAccessSettings(): Promise<void> {
  if (!native) return Promise.reject(new Error('Android usage settings are unavailable in this build.'));
  return native.openUsageAccessSettings();
}

export function fetchUsageTodayMs(packages: string[]): Promise<Record<string, number>> {
  if (!native) return Promise.reject(new Error('Focus usage is unavailable in this build.'));
  return native.getUsageTodayMs(JSON.stringify(packages)).then((raw) => parseJson<Record<string, number>>(raw ?? '{}', {}));
}

/** Average daily seconds over the previous 7 days, keyed by package. */
export function fetchUsage7dAverages(packages: string[]): Promise<Record<string, number>> {
  if (!native) return Promise.reject(new Error('Focus usage is unavailable in this build.'));
  return native.getUsage7dAverages(JSON.stringify(packages)).then((raw) => parseJson<Record<string, number>>(raw ?? '{}', {}));
}

/** null when unsupported (iOS / Expo Go) so the UI can show its own state. */
export async function fetchPermissionStates(): Promise<FocusPermissionStates | null> {
  if (!native) return null;
  const raw = (await native.getPermissionStates()) ?? '';
  if (!raw) return null;
  const parsed = parseJson<Partial<FocusPermissionStates>>(raw, {});
  return {
    usage: parsed.usage === true,
    accessibility: parsed.accessibility === true,
    overlay: parsed.overlay === true,
    notifications: parsed.notifications === true,
    battery: parsed.battery === true,
  };
}

export function openPermissionSettings(kind: FocusPermissionKind): Promise<void> {
  if (!native) return Promise.reject(new Error('Android permission settings are unavailable in this build.'));
  return native.openPermissionSettings(kind);
}

/** Mirrors focusState to SharedPreferences so blocking keeps working with JS closed. */
export function syncRulesToNative(state: unknown): boolean {
  if (!native) return false;
  try {
    const source = state as {
      blockedApps?: Array<Record<string, unknown>>;
      blockedSites?: string[];
      blocksFiredToday?: number;
      lastResetDate?: string;
    };
    return native.syncRules(JSON.stringify({
      apps: source.blockedApps ?? [],
      sites: (source.blockedSites ?? []).map((domain) => ({
        domain,
        dailyLimitMin: 60,
        strict: false,
        enabled: true,
      })),
      features: FEATURE_BLOCKS,
      browsers: BROWSER_URL_BAR_IDS,
      counters: {
        date: source.lastResetDate ?? '',
        blocksFiredToday: source.blocksFiredToday ?? 0,
      },
    }));
  } catch { return false; }
}

export async function fetchNativeCounters(): Promise<NativeFocusCounters | null> {
  if (!native) return null;
  const raw = (await native.getNativeCounters()) ?? '';
  if (!raw) return null;
  const parsed = parseJson<Partial<NativeFocusCounters>>(raw, {});
  return {
    date: typeof parsed.date === 'string' ? parsed.date : '',
    blocksFired: typeof parsed.blocksFired === 'number' ? parsed.blocksFired : 0,
    emergencyUsed: (parsed.emergencyUsed as Record<string, number>) ?? {},
  };
}
