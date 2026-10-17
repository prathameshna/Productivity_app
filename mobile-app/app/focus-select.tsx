import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Minus, Plus, X } from 'lucide-react-native';
import { focusColors as c, focusRadii } from '@/theme/focusTokens';
import { FEATURE_BLOCKS } from '@/features/focus/blockingFeatures';
import {
  clampEmergency,
  defaultRemindMin,
  formatLimit,
  stepDailyLimit,
  validReminderChoices,
} from '@/features/focus/focusHelpers';
import type { InstalledApp, FocusPermissionStates } from '@/features/focus/focusNative';
import { focusBlockingService } from '@/services/focusBlockingService';
import {
  addBlockedSite,
  getFocusState,
  removeBlockedSite,
  upsertBlockedApp,
  useFocusState,
  type FocusBlockedApp,
} from '@/features/focus/focusState';

type Tab = 'apps' | 'websites';
const permissionNames: Record<keyof FocusPermissionStates, string> = {
  usage: 'Usage access',
  accessibility: 'Accessibility service',
  overlay: 'Display over apps',
  notifications: 'Notifications',
  battery: 'Battery optimization exemption',
};
type AppWithUsage = InstalledApp & {
  usageMin: number;
  averageDailyUsageMin7d: number;
  icon?: string | null;
};

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function normalizeDomain(value: string) {
  const candidate = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$/.test(candidate) ? candidate : null;
}

export default function FocusSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focus = useFocusState();
  const [tab, setTab] = useState<Tab>('apps');
  const [query, setQuery] = useState('');
  const [apps, setApps] = useState<AppWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<FocusPermissionStates | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const usageAccess = permissions?.usage ?? false;
  const [website, setWebsite] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  const [sheetApp, setSheetApp] = useState<AppWithUsage | null>(null);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      let currentPermissions: FocusPermissionStates | null = null;
      try {
        currentPermissions = await focusBlockingService.checkPermissions();
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Focus permission status could not be read.');
      }
      setPermissions(currentPermissions);
      if (!focusBlockingService.isAvailable) {
        setLoading(false);
        return;
      }
      const installed = await focusBlockingService.getInstalledApps();
      let usage: Record<string, number> = {};
      let averages: Record<string, number> = {};
      if (currentPermissions?.usage) {
        try {
          usage = await focusBlockingService.getUsageToday(installed.map((app) => app.packageName));
          averages = await focusBlockingService.getAverageUsage7Days(installed.map((app) => app.packageName));
        } catch (error) {
          setLoadError(error instanceof Error ? error.message : 'Usage data could not be read.');
        }
      }
      setApps(installed
        .map((app) => ({
          ...app,
          usageMin: Math.floor((usage[app.packageName] ?? 0) / 60),
          averageDailyUsageMin7d: Math.floor((averages[app.packageName] ?? 0) / 60),
        }))
        .sort((a, b) => b.usageMin - a.usageMin));
      setLoading(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Focus app data could not be loaded.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const filteredApps = useMemo(
    () => apps.filter((app) => app.label.toLowerCase().includes(query.trim().toLowerCase())),
    [apps, query],
  );

  const handleWebsiteAdd = () => {
    const domain = normalizeDomain(website);
    if (!domain) {
      setWebsiteError('Enter a valid domain such as youtube.com.');
      return;
    }
    addBlockedSite(domain);
    setWebsite('');
    setWebsiteError('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back to Focus" onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft color={c.text} size={22} />
        </Pressable>
        <Text style={styles.title}>Block apps</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {focusBlockingService.isAvailable && permissions && Object.values(permissions).some((granted) => !granted) && (
          <View style={styles.permissionCard}>
            <Text style={styles.cardTitle}>Permissions needed for app blocking</Text>
            <Text style={styles.secondary}>Open each missing setting, then return here to refresh the status.</Text>
            {(Object.keys(permissions) as Array<keyof FocusPermissionStates>).filter((kind) => !permissions[kind]).map((kind) => (
              <Pressable key={kind} onPress={() => { void focusBlockingService.requestPermissions(kind).catch((error) => setLoadError(error instanceof Error ? error.message : 'Android settings could not be opened.')); }} style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>{permissionNames[kind]}</Text>
                <Text style={styles.grantLabel}>Open settings</Text>
              </Pressable>
            ))}
          </View>
        )}
        {loadError && <Text accessibilityRole="alert" style={styles.error}>{loadError}</Text>}

        <View style={styles.segmented}>
          <Pressable onPress={() => setTab('apps')} style={[styles.segment, tab === 'apps' && styles.segmentActive]}>
            <Text style={[styles.segmentLabel, tab === 'apps' && styles.segmentLabelActive]}>Apps</Text>
          </Pressable>
          <Pressable onPress={() => setTab('websites')} style={[styles.segment, tab === 'websites' && styles.segmentActive]}>
            <Text style={[styles.segmentLabel, tab === 'websites' && styles.segmentLabelActive]}>Websites</Text>
          </Pressable>
        </View>

        {tab === 'apps' ? (
          <>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search apps"
              placeholderTextColor={c.secondary}
              style={styles.search}
              accessibilityLabel="Search installed apps"
            />
            {!focusBlockingService.isAvailable ? (
              <Text style={styles.empty}>The native app list is unavailable in this build. Android uses a development build; iOS needs Screen Time picker support.</Text>
            ) : loading ? (
              <View style={styles.loading}><ActivityIndicator color={c.accent} /><Text style={styles.secondary}>Loading installed apps…</Text></View>
            ) : filteredApps.length === 0 ? (
              <Text style={styles.empty}>No apps match your search.</Text>
            ) : (
              <View style={styles.list}>
                {filteredApps.map((app) => {
                  const added = focus.blockedApps.some((item) => item.packageName === app.packageName);
                  return (
                    <Pressable key={app.packageName} onPress={() => added ? setSheetApp(app) : handleAddForApp(app)} style={({ pressed }) => [styles.appRow, pressed && styles.pressed]}>
                      <AppIcon app={app} />
                      <View style={styles.appText}>
                        <Text numberOfLines={1} style={styles.appName}>{app.label}</Text>
                        <Text style={styles.secondary}>Usage today: {usageAccess ? formatMinutes(app.usageMin) : '—'}</Text>
                      </View>
                      <View style={[styles.addButton, added && styles.addedButton]}>
                        {added ? <Check size={16} color={c.accent} /> : <Text style={styles.addButtonText}>Add</Text>}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.websiteInputRow}>
              <TextInput value={website} onChangeText={(value) => { setWebsite(value); setWebsiteError(''); }} placeholder="Enter website, e.g. youtube.com" placeholderTextColor={c.secondary} style={styles.websiteInput} autoCapitalize="none" />
              <Pressable onPress={handleWebsiteAdd} style={styles.websiteAdd}><Text style={styles.websiteAddText}>Add</Text></Pressable>
            </View>
            {!!websiteError && <Text style={styles.error}>{websiteError}</Text>}
            {focus.blockedSites.length === 0 ? (
              <Text style={styles.empty}>No blocked websites yet.</Text>
            ) : (
              <View style={styles.list}>
                {focus.blockedSites.map((site) => (
                  <View key={site} style={styles.siteRow}>
                    <Text style={styles.appName}>{site}</Text>
                    <Pressable accessibilityLabel={`Remove ${site}`} onPress={() => removeBlockedSite(site)}><X size={20} color={c.secondary} /></Pressable>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.websiteNote}>Website blocking is unavailable in this build. The listed domains are saved locally only.</Text>
          </>
        )}
      </ScrollView>

      <LimitSheet app={sheetApp} onClose={() => setSheetApp(null)} onSave={(app) => {
        upsertBlockedApp(app);
        setSheetApp(null);
        router.back();
      }} />
    </SafeAreaView>
  );

  function handleAddForApp(app: AppWithUsage) {
    if (!focusBlockingService.isAvailable) return;
    setSheetApp(app);
  }
}

function AppIcon({ app }: { app: AppWithUsage }) {
  const [icon, setIcon] = useState<string | null | undefined>(app.icon);
  useEffect(() => {
    let mounted = true;
    void focusBlockingService.getAppIcon(app.packageName).then((value) => { if (mounted) setIcon(value); }).catch(() => { if (mounted) setIcon(null); });
    return () => { mounted = false; };
  }, [app.packageName]);
  return icon ? <Image source={{ uri: `data:image/png;base64,${icon}` }} style={styles.appIcon} /> : <View style={[styles.appIcon, styles.fallbackIcon]}><Text style={styles.fallbackLabel}>{app.label.slice(0, 1).toUpperCase()}</Text></View>;
}

function LimitSheet({ app, onClose, onSave }: { app: AppWithUsage | null; onClose: () => void; onSave: (app: FocusBlockedApp) => void }) {
  const existing = app ? getFocusState().blockedApps.find((item) => item.packageName === app.packageName) : undefined;
  const [limit, setLimit] = useState(existing?.dailyLimitMin ?? 60);
  const [emergency, setEmergency] = useState(existing?.emergencyTotal ?? 2);
  const [strict, setStrict] = useState(existing?.strict ?? false);
  const [remind, setRemind] = useState(existing?.remindEnabled ?? false);
  const [remindMin, setRemindMin] = useState(existing?.remindMin ?? defaultRemindMin(60));
  const [blockedFeatures, setBlockedFeatures] = useState<string[]>(existing?.blockedFeatures ?? []);

  useEffect(() => {
    if (!app) return;
    const saved = getFocusState().blockedApps.find((item) => item.packageName === app.packageName);
    setLimit(saved?.dailyLimitMin ?? 60);
    setEmergency(saved?.emergencyTotal ?? 2);
    setStrict(saved?.strict ?? false);
    setRemind(saved?.remindEnabled ?? false);
    setRemindMin(saved?.remindMin ?? defaultRemindMin(saved?.dailyLimitMin ?? 60));
    setBlockedFeatures(saved?.blockedFeatures ?? []);
  }, [app]);

  if (!app) return null;
  const save = () => onSave({
    packageName: app.packageName,
    label: app.label,
    dailyLimitMin: limit,
    emergencyTotal: emergency,
    emergencyUsedToday: existing?.emergencyUsedToday ?? 0,
    remindEnabled: remind,
    remindMin: validReminderChoices(limit).includes(remindMin) ? remindMin : defaultRemindMin(limit),
    strict,
    blockedFeatures,
    enabled: existing?.enabled ?? true,
    spentTodayMin: app.usageMin,
    averageDailyUsageMin7d: existing?.averageDailyUsageMin7d ?? app.averageDailyUsageMin7d,
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}><View style={styles.sheetIdentity}><AppIcon app={app} /><View><Text style={styles.sheetTitle}>{app.label}</Text><Text style={styles.secondary}>Usage today: {formatMinutes(app.usageMin)}</Text></View></View><Pressable onPress={onClose}><X color={c.secondary} size={22} /></Pressable></View>
          {app.usageMin >= limit && <Text style={styles.warning}>You've already used more than this today. It will be blocked right away.</Text>}
          <Stepper label="Daily limit" helper="Time allowed per day" value={formatLimit(limit)} onMinus={() => setLimit(stepDailyLimit(limit, -1))} onPlus={() => setLimit(stepDailyLimit(limit, 1))} min={limit <= 5} max={limit >= 720} />
          <View style={strict && styles.dimmed}><Stepper label="Emergency uses" helper="Times you can open the app after the limit is reached" value={String(emergency)} onMinus={() => setEmergency(clampEmergency(emergency, -1))} onPlus={() => setEmergency(clampEmergency(emergency, 1))} min={emergency <= 0} max={emergency >= 5} /></View>
          <View style={styles.switchRow}><Text style={styles.sheetLabel}>Remind me before limit</Text><Pressable onPress={() => setRemind(!remind)} style={[styles.toggle, remind && styles.toggleOn]}><View style={[styles.toggleKnob, remind && styles.toggleKnobOn]} /></Pressable></View>
          {remind && <View style={styles.chips}>{validReminderChoices(limit).map((value) => <Pressable key={value} onPress={() => setRemindMin(value)} style={[styles.chip, remindMin === value && styles.chipSelected]}><Text style={styles.chipText}>{value} min</Text></Pressable>)}</View>}
          <View style={styles.switchRow}><Text style={styles.sheetLabel}>Strict mode <Text style={styles.pro}>PRO</Text></Text><Pressable onPress={() => setStrict(!strict)} style={[styles.toggle, strict && styles.toggleOn]}><View style={[styles.toggleKnob, strict && styles.toggleKnobOn]} /></Pressable></View>
          {focusBlockingService.getCapabilities().partialBlocking && FEATURE_BLOCKS[app.packageName] && <View style={styles.featureCard}><Text style={styles.sheetLabel}>Block specific features <Text style={styles.pro}>PRO</Text></Text>{FEATURE_BLOCKS[app.packageName].map((feature) => { const selected = blockedFeatures.includes(feature.id); return <Pressable key={feature.id} onPress={() => setBlockedFeatures((current) => selected ? current.filter((id) => id !== feature.id) : [...current, feature.id])} style={styles.featureRow}><View><Text style={styles.featureLabel}>{feature.label}</Text><Text style={styles.secondary}>{feature.description}</Text></View><View style={[styles.toggle, selected && styles.toggleOn]}><View style={[styles.toggleKnob, selected && styles.toggleKnobOn]} /></View></Pressable>; })}</View>}
          <Pressable onPress={save} style={styles.saveButton}><Text style={styles.saveText}>{existing ? 'Save' : 'Add'}</Text></Pressable>
          <Pressable onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stepper({ label, helper, value, onMinus, onPlus, min, max }: { label: string; helper: string; value: string; onMinus: () => void; onPlus: () => void; min: boolean; max: boolean }) {
  return <View style={styles.stepperRow}><View style={styles.stepperCopy}><Text style={styles.sheetLabel}>{label}</Text><Text style={styles.secondary}>{helper}</Text></View><View style={styles.stepper}><Pressable disabled={min} onPress={onMinus} style={styles.stepperButton}><Minus size={16} color={min ? c.border : c.text} /></Pressable><Text style={styles.stepperValue}>{value}</Text><Pressable disabled={max} onPress={onPlus} style={styles.stepperButton}><Plus size={16} color={max ? c.border : c.text} /></Pressable></View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: { height: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 40 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: c.text },
  content: { paddingHorizontal: 20, gap: 16 },
  permissionCard: { padding: 16, borderRadius: focusRadii.card, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, gap: 8 },
  permissionRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  permissionLabel: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: c.text },
  grantLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: c.accent },
  cardTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: c.text },
  secondary: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: c.secondary },
  grantButton: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: c.text },
  grantButtonText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  segmented: { flexDirection: 'row', padding: 4, backgroundColor: c.segmented, borderRadius: 14 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentActive: { backgroundColor: c.card },
  segmentLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: c.secondary },
  segmentLabelActive: { color: c.text },
  search: { height: 48, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, color: c.text, fontFamily: 'PlusJakartaSans_400Regular' },
  loading: { alignItems: 'center', gap: 10, padding: 32 },
  empty: { textAlign: 'center', padding: 32, color: c.secondary, fontFamily: 'PlusJakartaSans_500Medium' },
  list: { backgroundColor: c.card, borderRadius: 24, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  appRow: { minHeight: 72, padding: 14, borderBottomWidth: 1, borderBottomColor: c.background, flexDirection: 'row', alignItems: 'center' },
  appIcon: { width: 44, height: 44, borderRadius: focusRadii.appIcon, marginRight: 12 },
  fallbackIcon: { backgroundColor: c.accentTint, alignItems: 'center', justifyContent: 'center' },
  fallbackLabel: { color: c.accent, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18 },
  appText: { flex: 1, gap: 3 },
  appName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: c.text },
  addButton: { minWidth: 56, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: c.text, alignItems: 'center' },
  addedButton: { backgroundColor: c.accentTint },
  addButtonText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  websiteInputRow: { flexDirection: 'row', gap: 8 },
  websiteInput: { flex: 1, height: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, color: c.text },
  websiteAdd: { paddingHorizontal: 18, borderRadius: 14, backgroundColor: c.text, justifyContent: 'center' },
  websiteAddText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold' },
  error: { color: '#D32F2F', fontSize: 12 },
  websiteNote: { color: c.secondary, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  siteRow: { padding: 16, borderRadius: focusRadii.card, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pressed: { opacity: 0.75 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { backgroundColor: c.card, borderTopLeftRadius: focusRadii.sheet, borderTopRightRadius: focusRadii.sheet, padding: 20, gap: 16 },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: c.border },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: c.text },
  warning: { color: '#D32F2F', backgroundColor: c.reachedBg, borderRadius: 12, padding: 10, fontSize: 12 },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperCopy: { flex: 1, gap: 3, marginRight: 10 },
  sheetLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: c.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.segmented, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { minWidth: 52, textAlign: 'center', fontFamily: 'PlusJakartaSans_700Bold', color: c.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { width: 46, height: 26, padding: 3, borderRadius: 13, backgroundColor: c.border },
  toggleOn: { backgroundColor: c.accent },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  toggleKnobOn: { alignSelf: 'flex-end' },
  dimmed: { opacity: 0.45 },
  pro: { color: c.accent, fontSize: 10 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: c.segmented },
  chipSelected: { backgroundColor: c.accentTint, borderWidth: 1, borderColor: c.accent },
  chipText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: c.text },
  featureCard: { gap: 12, padding: 14, borderRadius: 18, backgroundColor: c.sheetRow, borderWidth: 1, borderColor: c.border },
  featureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  featureLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: c.text },
  saveButton: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: c.text },
  saveText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 },
  cancelButton: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: c.secondary, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});
