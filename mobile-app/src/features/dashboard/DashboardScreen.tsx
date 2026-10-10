import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlarmClock, ArrowUpRight, CircleCheck, FileText, FolderOpen, House, Hourglass, Newspaper, NotebookPen } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { CadenceMark } from '@/components/CadenceMark';
import { SurfaceCard } from '@/components/SurfaceCard';
import { featureCards, navItems } from './dashboardData';
import { colors, radii, spacing } from '@/theme/tokens';
import { useAlarm, formatAlarmTime } from '@/features/alarm/alarmState';

const icons = { alarm: AlarmClock, hourglass: Hourglass, 'notebook-pen': NotebookPen, newspaper: Newspaper };
const navIcons = { house: House, alarm: AlarmClock, 'circle-check': CircleCheck, hourglass: Hourglass };

export default function DashboardScreen() {
  const router = useRouter();
  const alarm = useAlarm();
  const [activeTab, setActiveTab] = useState('Home');
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const insets = useSafeAreaInsets();
  if (!fontsLoaded) return null;

  const handleCardPress = (label: string) => {
    if (label === 'Alarm') {
      router.push('/alarm');
    }
  };

  const handleNavPress = (label: string) => {
    if (label === 'Alarm') {
      router.push('/alarm');
      return;
    }
    setActiveTab(label);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 116 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>evening, Prathamesh</Text>
            <Text style={styles.date}>Wednesday, Oct 24</Text>
          </View>
          <Pressable accessibilityLabel="Open User Profile" style={({ pressed }) => [styles.profile, pressed && styles.pressed]}>
            <CadenceMark size={42} />
          </Pressable>
        </View>

        <SurfaceCard style={styles.summary}>
          <View style={styles.pill}><View style={styles.dot} /><Text style={styles.pillText}>3 tasks remaining</Text></View>
          <View style={styles.taskTitle}><View style={styles.taskDot} /><Text style={styles.taskText}>Deep work &amp; review session</Text></View>
          <Text style={styles.taskDetail}>Due today at 4:30 PM • High priority</Text>
          <View style={styles.progressLabels}><Text style={styles.muted}>Daily momentum</Text><Text style={styles.strong}>65% completed</Text></View>
          <View style={styles.progressTrack}><View style={styles.progress} /></View>
        </SurfaceCard>

        <View style={styles.grid}>
          {featureCards.map((card) => {
            const Icon = icons[card.icon];
            const displayValue = card.label === 'Alarm' ? formatAlarmTime(alarm.hour, alarm.minute, alarm.period) : card.value;
            const displayDetail = card.label === 'Alarm' ? (alarm.enabled ? 'Gentle Wake • Enabled' : 'Disabled') : card.detail;
            return <Pressable key={card.label} onPress={() => handleCardPress(card.label)} style={({ pressed }) => [styles.feature, pressed && styles.pressed]}>
              <View style={styles.featureTop}><View style={[styles.iconBox, { backgroundColor: card.tint }]}><Icon size={19} color={card.accent} strokeWidth={2.2} /></View><Text style={styles.muted}>{card.label}</Text></View>
              <View><Text style={styles.featureValue}>{displayValue}</Text><Text style={styles.featureDetail} numberOfLines={1}><View style={[styles.smallDot, { backgroundColor: card.accent }]} />{displayDetail}</Text></View>
            </Pressable>;
          })}
        </View>

        <SurfaceCard style={styles.workspace}>
          <View style={styles.workspaceHeader}><View style={styles.workspaceIdentity}><View style={styles.folderBox}><FolderOpen size={20} color={colors.ink} /></View><View><Text style={styles.workspaceTitle}>Workspace</Text><Text style={styles.muted}>3 active connections</Text></View></View><Pressable style={styles.openButton}><ArrowUpRight size={18} color={colors.secondary} /></Pressable></View>
          <View style={styles.activity}><View style={styles.activityTitle}><Text style={styles.workspaceTitle} numberOfLines={1}>Q4 Roadmap Strategy Review</Text><Text style={styles.muted}>45m ago</Text></View><View style={styles.chips}><View style={styles.chip}><FileText size={13} color={colors.ink} /><Text style={styles.chipText}>Drive</Text></View><View style={styles.chip}><View style={styles.figmaMark}><View /><View /><View /><View /></View><Text style={styles.chipText}>Figma</Text></View><View style={[styles.chip, styles.synced]}><Text style={styles.muted}>Synced</Text></View></View></View>
        </SurfaceCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Svg pointerEvents="none" style={styles.footerSvg} viewBox="0 0 400 76" preserveAspectRatio="none">
          <Path d="M0 0H130C148 0 156 8 164 22C173 38 184 46 200 46C216 46 227 38 236 22C244 8 252 0 270 0H400V76H0V0Z" fill={colors.surface} />
          <Path d="M0 0H130C148 0 156 8 164 22C173 38 184 46 200 46C216 46 227 38 236 22C244 8 252 0 270 0H400" stroke={colors.border} strokeWidth={1} fill="none" />
        </Svg>
        <View style={styles.navGroup}>{navItems.slice(0, 2).map((item) => <NavItem key={item.label} item={item} active={activeTab === item.label} onPress={handleNavPress} />)}</View>
        <Pressable accessibilityLabel="Cadence Voice Assistant" style={({ pressed }) => [styles.aiButton, pressed && styles.pressed]}><CadenceMark size={54} /></Pressable>
        <View style={styles.navGroup}>{navItems.slice(2).map((item) => <NavItem key={item.label} item={item} active={activeTab === item.label} onPress={handleNavPress} />)}</View>
      </View>
    </SafeAreaView>
  );
}

function NavItem({ item, active, onPress }: { item: (typeof navItems)[number]; active: boolean; onPress: (label: string) => void }) {
  const Icon = navIcons[item.icon];
  return <Pressable onPress={() => onPress(item.label)} style={styles.navItem}><Icon size={24} color={active ? colors.ink : colors.secondary} strokeWidth={active ? 2.5 : 2} /><Text style={[styles.navLabel, active && styles.navActive]}>{item.label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.page, paddingTop: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: colors.ink, fontFamily: 'Inter_600SemiBold', fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  date: { color: colors.secondary, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, marginTop: 1 },
  profile: { borderRadius: 24 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  summary: { padding: 16, marginBottom: 20 },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceContainer, paddingHorizontal: 11, paddingVertical: 6, borderRadius: radii.control, marginBottom: 16 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ink },
  pillText: { color: colors.ink, fontFamily: 'Inter_500Medium', fontSize: 12 },
  taskTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink },
  taskText: { flex: 1, color: colors.ink, fontFamily: 'Inter_500Medium', fontSize: 16, lineHeight: 21 },
  taskDetail: { color: colors.secondary, fontFamily: 'Inter_400Regular', fontSize: 14, marginLeft: 20, marginTop: 3, marginBottom: 18 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  muted: { color: colors.secondary, fontFamily: 'Inter_500Medium', fontSize: 12 },
  strong: { color: colors.ink, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  progressTrack: { height: 7, borderRadius: 5, backgroundColor: colors.surfaceContainer, overflow: 'hidden' },
  progress: { width: '65%', height: '100%', backgroundColor: colors.ink, borderRadius: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  feature: { width: '48.1%', height: 120, padding: 12, justifyContent: 'space-between', borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, shadowColor: '#171715', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  featureTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  featureValue: { color: colors.ink, fontFamily: 'Inter_600SemiBold', fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  featureDetail: { color: colors.secondary, fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  smallDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  workspace: { padding: 16 },
  workspaceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  workspaceIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  folderBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  workspaceTitle: { color: colors.ink, fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 21 },
  openButton: { width: 34, height: 34, borderRadius: 18, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  activity: { backgroundColor: colors.surfaceLow, borderRadius: 14, padding: 12, gap: 10 },
  activityTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radii.control, backgroundColor: colors.surfaceHighest },
  chipText: { color: colors.ink, fontFamily: 'Inter_500Medium', fontSize: 11 },
  synced: { marginLeft: 'auto', backgroundColor: colors.surfaceContainer },
  figmaMark: { width: 12, height: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
  navGroup: { flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', height: 76 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 76, flexDirection: 'row', alignItems: 'center', zIndex: 4, paddingHorizontal: 6 },
  footerSvg: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 76 },
  aiButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: -28, shadowColor: '#080808', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 6, zIndex: 5 },
  navItem: { width: 58, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navLabel: { color: colors.secondary, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 14 },
  navActive: { color: colors.ink, fontFamily: 'Inter_600SemiBold' },
});
