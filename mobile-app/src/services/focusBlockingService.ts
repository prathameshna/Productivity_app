import { Platform } from 'react-native';
import {
  fetchAppIcon,
  fetchInstalledApps,
  fetchNativeCounters,
  fetchPermissionStates,
  fetchUsage7dAverages,
  fetchUsageTodayMs,
  hasNativeFocus,
  hasUsageAccess,
  openPermissionSettings,
  openUsageAccessSettings,
  syncRulesToNative,
  type FocusPermissionKind,
  type FocusPermissionStates,
} from '../features/focus/focusNative';
import type { FocusState } from '../features/focus/focusState';

export interface FocusCapabilities {
  installedAppList: boolean;
  appUsage: boolean;
  dailyLimits: boolean;
  emergencyPasses: boolean;
  schedules: boolean;
  partialBlocking: boolean;
  websiteBlocking: boolean;
  realAppIcons: boolean;
}

export interface FocusBlockingService {
  getCapabilities(): FocusCapabilities;
  checkPermissions(): Promise<FocusPermissionStates | null>;
  requestPermissions(kind?: FocusPermissionKind): Promise<void>;
  applyRules(rules: FocusState): void;
  clearRules(): void;
  getUsageToday(packages: string[]): Promise<Record<string, number>>;
  getAverageUsage7Days(packages: string[]): ReturnType<typeof fetchUsage7dAverages>;
  startSession(minutes: number): Promise<void>;
  stopSession(): Promise<void>;
  getInstalledApps(): ReturnType<typeof fetchInstalledApps>;
  getAppIcon(packageName: string): ReturnType<typeof fetchAppIcon>;
  getCounters(): ReturnType<typeof fetchNativeCounters>;
  readonly isAvailable: boolean;
}

const androidCapabilities: FocusCapabilities = {
  installedAppList: true,
  appUsage: true,
  dailyLimits: true,
  emergencyPasses: true,
  schedules: false,
  partialBlocking: false,
  websiteBlocking: false,
  realAppIcons: true,
};

const unsupportedCapabilities: FocusCapabilities = {
  installedAppList: false,
  appUsage: false,
  dailyLimits: false,
  emergencyPasses: false,
  schedules: false,
  partialBlocking: false,
  websiteBlocking: false,
  realAppIcons: false,
};

function unavailable(feature: string): Error {
  return new Error(`${feature} is unavailable on ${Platform.OS} in this build.`);
}

const androidService: FocusBlockingService = {
  isAvailable: hasNativeFocus,
  getCapabilities: () => hasNativeFocus ? androidCapabilities : unsupportedCapabilities,
  async checkPermissions() {
    if (!hasNativeFocus) return null;
    const permissions = await fetchPermissionStates();
    if (!permissions) throw new Error('Android Focus permission status could not be read.');
    return permissions;
  },
  async requestPermissions(kind) {
    if (!hasNativeFocus) throw unavailable('Focus permissions');
    if (kind === 'usage') await openUsageAccessSettings();
    else if (kind) await openPermissionSettings(kind);
    else {
      const states = await fetchPermissionStates();
      const missing = states && (Object.keys(states) as FocusPermissionKind[]).find((key) => !states[key]);
      if (missing === 'usage') await openUsageAccessSettings();
      else if (missing) await openPermissionSettings(missing);
    }
  },
  applyRules(rules) {
    if (!hasNativeFocus) return;
    if (!syncRulesToNative(rules)) throw new Error('Focus rules could not be saved to Android storage. Try again before relying on blocking.');
  },
  clearRules() {
    if (!hasNativeFocus) return;
    if (!syncRulesToNative({ blockedApps: [], blockedSites: [], blocksFiredToday: 0, lastResetDate: new Date().toISOString().slice(0, 10) })) {
      throw new Error('Focus rules could not be cleared from Android storage.');
    }
  },
  async getUsageToday(packages) {
    if (!await hasUsageAccess()) throw new Error('Usage access is not granted. Open Android settings to enable it.');
    const milliseconds = await fetchUsageTodayMs(packages);
    return Object.fromEntries(Object.entries(milliseconds).map(([pkg, value]) => [pkg, Math.floor(value / 1000)]));
  },
  async startSession() { throw unavailable('Start focus now'); },
  async stopSession() { throw unavailable('Focus sessions'); },
  getInstalledApps: fetchInstalledApps,
  getAppIcon: fetchAppIcon,
  getCounters: fetchNativeCounters,
  getAverageUsage7Days: fetchUsage7dAverages,
};

const iosService: FocusBlockingService = {
  isAvailable: false,
  getCapabilities: () => unsupportedCapabilities,
  async checkPermissions() { return null; },
  async requestPermissions() { throw unavailable('Screen Time authorization'); },
  applyRules() { throw unavailable('Screen Time rule storage'); },
  clearRules() { throw unavailable('Screen Time rule storage'); },
  async getUsageToday() { throw unavailable('Per-app usage reporting'); },
  async getAverageUsage7Days() { throw unavailable('Per-app usage reporting'); },
  async startSession() { throw unavailable('Focus sessions'); },
  async stopSession() { throw unavailable('Focus sessions'); },
  async getInstalledApps() { throw unavailable('Installed app inventory'); },
  async getAppIcon() { throw unavailable('Installed app icons'); },
  async getCounters() { return null; },
};

export const focusBlockingService: FocusBlockingService = Platform.OS === 'android' ? androidService : iosService;
