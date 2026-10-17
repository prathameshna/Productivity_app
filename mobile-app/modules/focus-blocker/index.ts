import { requireOptionalNativeModule } from 'expo';

export interface FocusBlockerNativeModule {
  getInstalledApps(): Promise<string>;
  getAppIcon(packageName: string): Promise<string>;
  getUsageToday(packagesJson: string): Promise<string>;
  getUsageTodayMs(packagesJson: string): Promise<string>;
  hasUsageAccess(): Promise<boolean>;
  openUsageAccessSettings(): Promise<void>;
  getUsage7dAverages(packagesJson: string): Promise<string>;
  getPermissionStates(): Promise<string>;
  openPermissionSettings(kind: string): Promise<void>;
  getNativeCounters(): Promise<string>;
  clearIconCache(): Promise<void>;
  syncRules(json: string): boolean;
}

let nativeModule: FocusBlockerNativeModule | null = null;

try {
  // Returns null in Expo Go / iOS / web where the native module is not linked.
  nativeModule = requireOptionalNativeModule<FocusBlockerNativeModule>('FocusBlocker');
} catch {
  nativeModule = null;
}

export default nativeModule;
