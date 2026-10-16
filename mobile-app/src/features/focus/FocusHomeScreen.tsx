import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlarmClock,
  CircleCheck,
  Clock3,
  House,
  Hourglass,
  Info,
  OctagonAlert,
  Plus,
  Smartphone,
} from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { navItems } from '@/features/dashboard/dashboardData';
import avatarImage from '@/assests/raw/avtar.png';
import { focusColors as c } from '@/theme/focusTokens';
import { getFocusState, updateFocusState, useFocusState } from './focusState';
import {
  fetchAppIcon,
  fetchNativeCounters,
  fetchPermissionStates,
  fetchUsageToday,
  openPermissionSettings,
  type FocusPermissionKind,
  type FocusPermissionStates,
} from './focusNative';
import { blockedFeatureTags } from './blockingFeatures';

const navIcons = {
  house: House,
  alarm: AlarmClock,
  'circle-check': CircleCheck,
  hourglass: Hourglass,
};

export default function FocusHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focus = useFocusState();
  const [infoOpen, setInfoOpen] = useState(false);
  const [permissions, setPermissions] = useState<FocusPermissionStates | null>(null);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const refreshUsage = useCallback(async () => {
    const current = getFocusState();
    const usage = await fetchUsageToday(current.blockedApps.map((app) => app.packageName));
    updateFocusState({
      blockedApps: current.blockedApps.map((app) => ({
        ...app,
        spentTodayMin: Math.floor((usage[app.packageName] ?? app.spentTodayMin * 60) / 60),
      })),
    });
    const counters = await fetchNativeCounters();
    if (counters && counters.date === current.lastResetDate) {
      updateFocusState({ blocksFiredToday: counters.blocksFired });
    }
  }, []);

  useEffect(() => {
    void refreshUsage();
    void fetchPermissionStates().then(setPermissions);
    const timer = setInterval(() => void refreshUsage(), 30_000);
    return () => clearInterval(timer);
  }, [refreshUsage]);

  if (!fontsLoaded) return null;

  const blockedApps = focus.blockedApps;
  const activeApps = blockedApps.filter((app) => app.enabled);
  const usedMin = activeApps.reduce((total, app) => total + app.spentTodayMin, 0);
  const limitMin = activeApps.reduce((total, app) => total + app.dailyLimitMin, 0);
  const progress = limitMin > 0 ? Math.min(1, usedMin / limitMin) : 0;
  const timeSaved = activeApps
    .filter((app) => app.spentTodayMin >= app.dailyLimitMin)
    .reduce((total, app) => total + Math.max(0, app.averageDailyUsageMin7d - app.spentTodayMin), 0);
  const addApps = () => router.push('/focus-select');
  const missingPermission: FocusPermissionKind | null = permissions
    ? !permissions.usage ? 'usage'
      : !permissions.accessibility ? 'accessibility'
        : !permissions.overlay ? 'overlay'
          : !permissions.notifications ? 'notifications'
            : !permissions.battery ? 'battery' : null
    : null;

  const handleNavPress = (label: string) => {
    if (label === 'Home') router.push('/');
    if (label === 'Alarm') router.push('/alarm');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 112 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text maxFontSizeMultiplier={1.15} style={styles.pageTitle}>Focus</Text>
          <Pressable
            accessibilityLabel="Info"
            onPress={() => setInfoOpen(true)}
            style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
          >
            <Info size={20} color={c.secondary} strokeWidth={2} />
          </Pressable>
        </View>

        {missingPermission && (
          <Pressable
            onPress={() => openPermissionSettings(missingPermission)}
            style={styles.permissionBanner}
          >
            <Text style={styles.permissionBannerTitle}>Focus permissions need attention</Text>
            <Text style={styles.permissionBannerText}>Tap to open the next missing Android permission.</Text>
          </Pressable>
        )}

        <View style={styles.hero}>
          <View style={styles.ringContainer}>
            <Svg width={176} height={176} viewBox="0 0 160 160">
              <Circle cx={80} cy={80} r={68} stroke={c.background} strokeWidth={10} fill="none" />
              <Circle
                cx={80}
                cy={80}
                r={68}
                stroke={c.accent}
                strokeWidth={10}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={427}
                strokeDashoffset={427 * (1 - progress)}
                rotation={-90}
                origin="80, 80"
              />
            </Svg>
            <Pressable
              accessibilityLabel="Block distracting apps"
              onPress={addApps}
              style={({ pressed }) => [styles.heroAddButton, pressed && styles.pressed]}
            >
              <Plus size={32} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>
          <Text maxFontSizeMultiplier={1.15} style={styles.heroTitle}>Block distracting apps</Text>
          <Text maxFontSizeMultiplier={1.15} style={styles.heroSubtitle}>Pick apps &amp; set healthy daily limits</Text>
        </View>

        <View style={styles.stats}>
          <StatCard icon="phone" value={String(activeApps.length)} label="Apps blocked" />
          <StatCard icon="time" value={formatMinutes(timeSaved)} label="Time saved" />
          <StatCard icon="blocks" value={String(focus.blocksFiredToday)} label="Blocks fired" />
        </View>

        {blockedApps.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleGroup}>
                <Text maxFontSizeMultiplier={1.15} style={styles.sectionTitle}>Blocked apps</Text>
                <Text maxFontSizeMultiplier={1.15} style={styles.countBadge}>{blockedApps.length}</Text>
              </View>
              <Pressable onPress={addApps} hitSlop={6}>
                <Text maxFontSizeMultiplier={1.15} style={styles.addLabel}>+ Add</Text>
              </Pressable>
            </View>
            <View style={styles.appList}>
              {blockedApps.map((app) => (
                <AppCard key={app.packageName} app={app} onPress={addApps} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Svg pointerEvents="none" style={styles.footerSvg} viewBox="0 0 400 76" preserveAspectRatio="none">
          <Path d="M0 0H130C148 0 156 8 164 22C173 38 184 46 200 46C216 46 227 38 236 22C244 8 252 0 270 0H400V76H0V0Z" fill="#FFFFFF" />
          <Path d="M0 0H130C148 0 156 8 164 22C173 38 184 46 200 46C216 46 227 38 236 22C244 8 252 0 270 0H400" stroke={c.border} strokeWidth={1} fill="none" />
        </Svg>
        <View style={styles.navGroup}>
          {navItems.slice(0, 2).map((item) => (
            <NavItem key={item.label} item={item} active={false} onPress={handleNavPress} />
          ))}
        </View>
        <Pressable accessibilityLabel="Cadence Voice Assistant" style={styles.aiButton}>
          <Image source={avatarImage} style={styles.aiAvatar} resizeMode="contain" />
        </Pressable>
        <View style={styles.navGroup}>
          {navItems.slice(2).map((item) => (
            <NavItem key={item.label} item={item} active={item.label === 'Focus'} onPress={handleNavPress} />
          ))}
        </View>
      </View>

      {infoOpen && (
        <Pressable onPress={() => setInfoOpen(false)} style={styles.scrim}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.infoSheet}>
            <View style={styles.sheetHandle} />
            <Text maxFontSizeMultiplier={1.15} style={styles.sheetTitle}>How Focus works</Text>
            <Text maxFontSizeMultiplier={1.15} style={styles.sheetText}>
              Choose apps and daily limits to help protect your focus. Focus uses Android permissions to track usage and block selected apps. Time saved is an estimate based on your average usage over the previous 7 days.
            </Text>
            <Text maxFontSizeMultiplier={1.15} style={styles.sheetText}>Your settings and usage stay on this device.</Text>
            <Pressable onPress={() => setInfoOpen(false)} style={styles.doneButton}>
              <Text maxFontSizeMultiplier={1.15} style={styles.doneLabel}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label }: { icon: 'phone' | 'time' | 'blocks'; value: string; label: string }) {
  const Icon = icon === 'phone' ? Smartphone : icon === 'time' ? Clock3 : OctagonAlert;
  const accent = icon === 'phone';
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, accent ? styles.statIconAccent : styles.statIconNeutral]}>
        <Icon size={16} color={accent ? c.accent : c.text} strokeWidth={2} />
      </View>
      <Text maxFontSizeMultiplier={1.15} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.statValue}>{value}</Text>
      <Text maxFontSizeMultiplier={1.15} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AppCard({ app, onPress }: { app: ReturnType<typeof useFocusState>['blockedApps'][number]; onPress: () => void }) {
  const reached = app.enabled && app.spentTodayMin >= app.dailyLimitMin;
  const paused = !app.enabled;
  const status = paused ? 'Paused' : reached ? 'Limit reached' : 'Blocking';
  const left = Math.max(0, app.dailyLimitMin - app.spentTodayMin);
  const progress = app.dailyLimitMin > 0 ? Math.min(1, app.spentTodayMin / app.dailyLimitMin) : 0;
  const spentColor = reached ? c.reachedText : c.secondary;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.appCard, pressed && styles.pressed]}>
      <View style={styles.appRow}>
        <AppIcon packageName={app.packageName} label={app.label} />
        <View style={styles.appInfo}>
          <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={styles.appName}>{app.label}</Text>
          <View style={styles.appMetaRow}>
            <Text maxFontSizeMultiplier={1.15} style={[styles.appMeta, { color: spentColor }]}>{formatMinutes(app.spentTodayMin)} spent</Text>
            <Text maxFontSizeMultiplier={1.15} style={styles.appMeta}> • </Text>
            <Text maxFontSizeMultiplier={1.15} style={styles.leftMeta}>{formatMinutes(left)} left</Text>
          </View>
        </View>
        <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={[styles.statusPill, paused ? styles.statusPaused : reached ? styles.statusReached : styles.statusBlocking]}>{status}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: paused ? '#A8A7A1' : reached ? '#D32F2F' : c.accent }]} />
      </View>
      {(app.strict || blockedFeatureTags(app.packageName, app.blockedFeatures).length > 0) && (
        <View style={styles.tags}>
          {app.strict && <Text style={styles.tag}>Strict</Text>}
          {blockedFeatureTags(app.packageName, app.blockedFeatures).map((tag) => <Text key={tag} style={styles.tag}>{tag}</Text>)}
        </View>
      )}
    </Pressable>
  );
}

function AppIcon({ packageName, label }: { packageName: string; label: string }) {
  const [icon, setIcon] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    void fetchAppIcon(packageName).then((value) => { if (mounted) setIcon(value); });
    return () => { mounted = false; };
  }, [packageName]);
  return icon
    ? <Image source={{ uri: `data:image/png;base64,${icon}` }} style={styles.appIconFallback} />
    : <View style={styles.appIconFallback}><Text maxFontSizeMultiplier={1.15} style={styles.appInitial}>{label.slice(0, 1).toUpperCase()}</Text></View>;
}

function NavItem({ item, active, onPress }: { item: (typeof navItems)[number]; active: boolean; onPress: (label: string) => void }) {
  const Icon = navIcons[item.icon];
  return (
    <Pressable onPress={() => onPress(item.label)} style={styles.navItem}>
      <Icon size={24} color={active ? c.text : c.secondary} strokeWidth={active ? 2.5 : 2} />
      <Text maxFontSizeMultiplier={1.15} style={[styles.navLabel, active && styles.navActive]}>{item.label}</Text>
    </Pressable>
  );
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 20, paddingTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  permissionBanner: { padding: 14, marginBottom: 16, borderRadius: 16, backgroundColor: c.accentTint, borderWidth: 1, borderColor: c.border },
  permissionBannerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: c.text },
  permissionBannerText: { marginTop: 3, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: c.secondary },
  pageTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, letterSpacing: -0.5, color: c.text },
  infoButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', borderColor: c.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#171715', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  hero: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: c.border, shadowColor: '#171715', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  ringContainer: { width: 176, height: 176, marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  heroAddButton: { position: 'absolute', top: 48, left: 48, width: 80, height: 80, borderRadius: 40, backgroundColor: c.text, alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 5, elevation: 4 },
  heroTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: c.text, marginBottom: 2, textAlign: 'center' },
  heroSubtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: c.secondary, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 0, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: '#FFFFFF', shadowColor: '#171715', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 1 },
  statIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statIconAccent: { backgroundColor: '#FDF2F0' }, statIconNeutral: { backgroundColor: '#F3F4F6' },
  statValue: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, lineHeight: 24, color: c.text },
  statLabel: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 15, color: c.secondary, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: c.text },
  countBadge: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, lineHeight: 16, color: c.text, backgroundColor: '#EAE8E3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  addLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: c.text },
  appList: { gap: 12 },
  appCard: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: '#FFFFFF', shadowColor: '#171715', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  appRow: { flexDirection: 'row', alignItems: 'center' },
  appIconFallback: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.accentTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  appInitial: { color: c.accent, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18 },
  appInfo: { flex: 1, minWidth: 0, marginRight: 8 },
  appName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: c.text },
  appMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  appMeta: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: c.secondary },
  leftMeta: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: c.text },
  statusPill: { flexShrink: 0, overflow: 'hidden', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11 },
  statusBlocking: { color: '#1E7E34', backgroundColor: '#EBF7EE', borderColor: '#D1F0D9' },
  statusReached: { color: '#D32F2F', backgroundColor: '#FDF2F2', borderColor: '#FAD2D2' },
  statusPaused: { color: c.secondary, backgroundColor: c.background, borderColor: c.border },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: c.background, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 999 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: c.segmented, color: c.secondary, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 76, flexDirection: 'row', alignItems: 'center', zIndex: 4, paddingHorizontal: 6 },
  footerSvg: { position: 'absolute', top: 5, left: 6, right: 5, width: '100%', height: 74 },
  navGroup: { flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', height: 76 },
  aiButton: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginTop: -46, zIndex: 5 },
  aiAvatar: { width: 126, height: 113, borderRadius: 57 },
  navItem: { width: 48, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navLabel: { color: c.secondary, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 14 },
  navActive: { color: c.text, fontFamily: 'PlusJakartaSans_600SemiBold' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  scrim: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#0006', justifyContent: 'flex-end' },
  infoSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#FFFFFF', padding: 24, paddingBottom: 32 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { color: c.text, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, marginBottom: 12 },
  sheetText: { fontFamily: 'PlusJakartaSans_400Regular', color: c.secondary, fontSize: 14, lineHeight: 22, marginBottom: 10 },
  doneButton: { height: 50, backgroundColor: c.text, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  doneLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', color: '#FFFFFF', fontSize: 15 },
});
