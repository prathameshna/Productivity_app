import { useSyncExternalStore } from 'react';
import { focusBlockingService } from '../../services/focusBlockingService';

export interface FocusBlockedApp {
  packageName: string;
  label: string;
  dailyLimitMin: number;
  emergencyTotal: number;
  emergencyUsedToday: number;
  remindEnabled: boolean;
  remindMin: number;
  strict: boolean;
  blockedFeatures: string[];
  enabled: boolean;
  spentTodayMin: number;
  averageDailyUsageMin7d: number;
}

export interface FocusState {
  blockedApps: FocusBlockedApp[];
  blockedSites: string[];
  blocksFiredToday: number;
  lastResetDate: string;
}

const STORAGE_KEY = '@productivity/focus_data';
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const defaults = (): FocusState => ({ blockedApps: [], blockedSites: [], blocksFiredToday: 0, lastResetDate: today() });
let state = defaults();
const listeners = new Set<() => void>();
let syncError: string | null = null;
const syncErrorListeners = new Set<() => void>();

function emit() { listeners.forEach((listener) => listener()); }
function setSyncError(message: string | null) {
  if (syncError === message) return;
  syncError = message;
  syncErrorListeners.forEach((listener) => listener());
}
export function getFocusState() { return state; }
export function subscribeFocus(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); }
export function useFocusState() { return useSyncExternalStore(subscribeFocus, getFocusState, getFocusState); }
export function getFocusSyncError() { return syncError; }
export function subscribeFocusSyncError(listener: () => void) { syncErrorListeners.add(listener); return () => syncErrorListeners.delete(listener); }
export function useFocusSyncError() { return useSyncExternalStore(subscribeFocusSyncError, getFocusSyncError, getFocusSyncError); }

export function saveFocusState(next: FocusState) {
  state = next;
  try {
    focusBlockingService.applyRules(state);
    setSyncError(null);
  } catch (error) {
    setSyncError(error instanceof Error ? error.message : 'Focus rules could not be saved to native storage.');
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* Storage can be unavailable in embedded web views. */ }
  try {
    const FileSystem = require('expo-file-system/legacy');
    if (FileSystem?.documentDirectory) {
      FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory}productivity_focus.json`, JSON.stringify(state)).catch(() => {});
    }
  } catch { /* Native storage will be available in a later native integration phase. */ }
  emit();
}

export function updateFocusState(patch: Partial<FocusState>) {
  saveFocusState({ ...state, ...patch });
}

export function upsertBlockedApp(app: FocusBlockedApp) {
  const blockedApps = state.blockedApps.filter((item) => item.packageName !== app.packageName);
  saveFocusState({ ...state, blockedApps: [...blockedApps, app] });
}

export function removeBlockedApp(packageName: string) {
  saveFocusState({
    ...state,
    blockedApps: state.blockedApps.filter((app) => app.packageName !== packageName),
  });
}

export function addBlockedSite(domain: string) {
  if (state.blockedSites.includes(domain)) return;
  saveFocusState({ ...state, blockedSites: [...state.blockedSites, domain] });
}

export function removeBlockedSite(domain: string) {
  saveFocusState({
    ...state,
    blockedSites: state.blockedSites.filter((site) => site !== domain),
  });
}

function normalize(value: Partial<FocusState>): FocusState {
  const loadedDate = typeof value.lastResetDate === 'string' ? value.lastResetDate : '';
  if (loadedDate !== today()) {
    return {
      blockedApps: Array.isArray(value.blockedApps) ? value.blockedApps.map((app) => ({ ...app, emergencyUsedToday: 0, spentTodayMin: 0 })) : [],
      blockedSites: Array.isArray(value.blockedSites) ? value.blockedSites : [],
      blocksFiredToday: 0,
      lastResetDate: today(),
    };
  }
  return {
    blockedApps: Array.isArray(value.blockedApps) ? value.blockedApps : [],
    blockedSites: Array.isArray(value.blockedSites) ? value.blockedSites : [],
    blocksFiredToday: typeof value.blocksFiredToday === 'number' ? value.blocksFiredToday : 0,
    lastResetDate: typeof value.lastResetDate === 'string' ? value.lastResetDate : today(),
  };
}

export function loadFocusState() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) { state = normalize(JSON.parse(stored)); try { focusBlockingService.applyRules(state); setSyncError(null); } catch (error) { setSyncError(error instanceof Error ? error.message : 'Focus rules could not be restored to native storage.'); } emit(); return; }
    }
  } catch { /* Fall through to native file storage or defaults. */ }
  try {
    const FileSystem = require('expo-file-system/legacy');
    if (FileSystem?.documentDirectory) {
      const uri = `${FileSystem.documentDirectory}productivity_focus.json`;
      FileSystem.getInfoAsync(uri).then((info: { exists: boolean }) => {
        if (!info.exists) return;
        return FileSystem.readAsStringAsync(uri).then((content: string) => { state = normalize(JSON.parse(content)); try { focusBlockingService.applyRules(state); setSyncError(null); } catch (error) { setSyncError(error instanceof Error ? error.message : 'Focus rules could not be restored to native storage.'); } emit(); });
      }).catch(() => {});
    }
  } catch { /* A new install starts with defaults. */ }
}

loadFocusState();
