import { useState, useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Polyline,
} from 'react-native-svg';
import { colors, radii, spacing } from '@/theme/tokens';
import { getAlarm, updateAlarm } from './alarmState';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BRAND = '#D97706'; // Warm amber — matches reference
const BRAND_SELECTED_BG = '#FEF3C7';

type MoodChip = {
  id: string;
  label: string;
  icon: 'music' | 'bell' | 'flame' | 'coffee';
};

const MOOD_CHIPS: MoodChip[] = [
  { id: 'bright', label: 'Bright', icon: 'music' },
  { id: 'noisy', label: 'Noisy', icon: 'bell' },
  { id: 'energetic', label: 'Energetic', icon: 'flame' },
  { id: 'calm', label: 'Calm', icon: 'coffee' },
];

const SOUND_LIST: string[] = [
  'Skyblue',
  '3000',
  'City Rush',
  'Momentum',
  'Motion',
  'Runners',
];

// ---------------------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------------------
function MusicIcon({ color: c }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18V5l12-2v13" />
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="18" cy="16" r="3" />
    </Svg>
  );
}

function BellIcon({ color: c }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

function FlameIcon() {
  // Filled amber flame for selected "Energetic" chip
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        fill={BRAND_SELECTED_BG}
        d="M12 2c.3 2.1-.7 4.1-1.6 5.8C9.5 9.4 8.7 11 8.7 13c0 2.2 1.5 4 3.3 4s3.3-1.8 3.3-4c0-.7-.2-1.3-.4-1.9C15.6 12 17 13.9 17 16c0 3.3-2.7 6-6 6s-6-2.7-6-6c0-3.6 2.3-6.8 4.4-9.8.9-1.3 1.7-2.6 1.9-4.2h.7z"
      />
    </Svg>
  );
}

function CoffeeIcon({ color: c }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <Path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <Line x1="6" y1="1" x2="6" y2="4" />
      <Line x1="10" y1="1" x2="10" y2="4" />
      <Line x1="14" y1="1" x2="14" y2="4" />
    </Svg>
  );
}

function ShuffleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={BRAND} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="16 3 21 3 21 8" />
      <Line x1="4" y1="20" x2="21" y2="3" />
      <Polyline points="21 16 21 21 16 21" />
      <Line x1="15" y1="15" x2="21" y2="21" />
      <Line x1="4" y1="4" x2="9" y2="9" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke={BRAND} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

function VolumeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke={BRAND} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </Svg>
  );
}

function BackArrowIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none"
      stroke={colors.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="19" y1="12" x2="5" y2="12" />
      <Polyline points="12 19 5 12 12 5" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Chip icon renderer
// ---------------------------------------------------------------------------
function ChipIcon({ icon, active }: { icon: MoodChip['icon']; active: boolean }) {
  const iconColor = active ? '#FEF3C7' : colors.secondary;
  switch (icon) {
    case 'music': return <MusicIcon color={iconColor} />;
    case 'bell': return <BellIcon color={iconColor} />;
    case 'flame': return <FlameIcon />;
    case 'coffee': return <CoffeeIcon color={iconColor} />;
  }
}

// ---------------------------------------------------------------------------
// Simple volume slider (native Slider not available without expo-av/community pkg)
// Rendered as a visual-only track + thumb via View composition
// ---------------------------------------------------------------------------
function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  // value: 0–100
  const pct = value / 100;

  return (
    <View style={slStyles.sliderContainer}>
      {/* Background track */}
      <View style={slStyles.track}>
        {/* Filled portion */}
        <View style={[slStyles.trackFilled, { flex: pct }]} />
        {/* Unfilled portion */}
        <View style={[slStyles.trackEmpty, { flex: 1 - pct }]} />
      </View>
      {/* Thumb — positioned via absolute */}
      <View
        style={[
          slStyles.thumb,
          { left: `${pct * 100}%` as any },
        ]}
        pointerEvents="none"
      />
      {/* Touch overlay: split into decrease / increase areas */}
      <View style={slStyles.touchOverlay} pointerEvents="box-none">
        <Pressable
          style={{ flex: value, minWidth: 0 }}
          onPress={() => onChange(Math.max(0, value - 10))}
          accessibilityLabel="Decrease volume"
        />
        <Pressable
          style={{ flex: 100 - value, minWidth: 0 }}
          onPress={() => onChange(Math.min(100, value + 10))}
          accessibilityLabel="Increase volume"
        />
      </View>
    </View>
  );
}

const slStyles = StyleSheet.create({
  sliderContainer: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  trackFilled: {
    backgroundColor: colors.ink,
    borderRadius: 9999,
  },
  trackEmpty: {
    backgroundColor: colors.border,
    borderRadius: 9999,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BRAND,
    marginLeft: -10,
    top: '50%',
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
});

// ---------------------------------------------------------------------------
// SoundScreen
// ---------------------------------------------------------------------------
export default function SoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const initial = getAlarm();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'ringtones' | 'mymusic'>('ringtones');
  const [activeMood, setActiveMood] = useState<string>('energetic');
  const [selectedSound, setSelectedSound] = useState<string>(initial.sound);
  const [gradualVolume, setGradualVolume] = useState(true);
  const [volume, setVolume] = useState(20);

  const handleSelectSound = useCallback((name: string) => {
    setSelectedSound(name);
    updateAlarm({ sound: name });
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
        >
          <BackArrowIcon />
        </Pressable>
        <Text style={s.headerTitle}>Sound</Text>
      </View>

      {/* Scrollable Body */}
      <ScrollView
        contentContainerStyle={[
          s.body,
          { paddingBottom: Math.max(insets.bottom, 16) + 112 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Enable Sound Card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>Enable Sound</Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: colors.border, true: BRAND }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
            accessibilityLabel="Enable sound toggle"
          />
        </View>

        {/* Segmented Tabs */}
        <View style={s.tabsRow}>
          <Pressable
            onPress={() => setActiveTab('ringtones')}
            style={s.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'ringtones' }}
          >
            <Text style={[s.tabLabel, activeTab === 'ringtones' && s.tabLabelActive]}>
              Ringtones
            </Text>
            {activeTab === 'ringtones' && <View style={s.tabUnderline} />}
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('mymusic')}
            style={s.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'mymusic' }}
          >
            <Text style={[s.tabLabel, activeTab === 'mymusic' && s.tabLabelActive]}>
              My Music
            </Text>
            {activeTab === 'mymusic' && <View style={s.tabUnderline} />}
          </Pressable>
        </View>

        {/* Mood Filter Chips (horizontally scrollable) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
        >
          {MOOD_CHIPS.map((chip) => {
            const active = chip.id === activeMood;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setActiveMood(chip.id)}
                style={({ pressed }) => [
                  s.chip,
                  active ? s.chipActive : s.chipInactive,
                  pressed && !active && s.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <ChipIcon icon={chip.icon} active={active} />
                <Text style={[s.chipLabel, active && s.chipLabelActive]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Random button */}
        <Pressable
          style={({ pressed }) => [s.randomBtn, pressed && s.randomBtnPressed]}
          accessibilityLabel="Random (Energetic)"
        >
          <ShuffleIcon />
          <Text style={s.randomBtnLabel}>Random (Energetic)</Text>
        </Pressable>

        {/* Sound List */}
        <View style={s.listCard}>
          {SOUND_LIST.map((name, index) => {
            const selected = name === selectedSound;
            const isLast = index === SOUND_LIST.length - 1;
            return (
              <View key={name}>
                <Pressable
                  onPress={() => handleSelectSound(name)}
                  style={({ pressed }) => [
                    s.listItem,
                    pressed && s.listItemPressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${name}${selected ? ', selected' : ''}`}
                >
                  <Text style={[s.listItemLabel, selected && s.listItemLabelActive]}>
                    {name}
                  </Text>
                  {selected && <CheckIcon />}
                </Pressable>
                {!isLast && <View style={s.divider} />}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Volume Panel */}
      <View style={[s.bottomPanel, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}>
        {/* Gradually increase volume row */}
        <View style={s.gradualRow}>
          <Text style={s.gradualLabel}>Gradually increase volume</Text>
          <Switch
            value={gradualVolume}
            onValueChange={setGradualVolume}
            trackColor={{ false: colors.border, true: '#E66A1F' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
            accessibilityLabel="Gradually increase volume toggle"
          />
        </View>

        {/* Volume slider row */}
        <View style={s.volumeRow}>
          <VolumeIcon />
          <VolumeSlider value={volume} onChange={setVolume} />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header ───────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}99`,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    marginLeft: -6,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.3,
    marginLeft: 8,
  },

  // ── Body scroll ──────────────────────────────────────────────
  body: {
    paddingHorizontal: spacing.page,
    paddingTop: 16,
    gap: 16,
  },

  // ── Enable card ──────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.1,
  },

  // ── Tabs ─────────────────────────────────────────────────────
  tabsRow: {
    flexDirection: 'row',
    gap: 28,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}CC`,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  tabItem: {
    paddingBottom: 10,
    position: 'relative',
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.secondary,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: BRAND,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: BRAND,
    borderRadius: 9999,
  },

  // ── Mood chips ───────────────────────────────────────────────
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.secondary,
    letterSpacing: -0.1,
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },

  // ── Random button ────────────────────────────────────────────
  randomBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  randomBtnPressed: {
    backgroundColor: '#F4F2EC',
  },
  randomBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
  },

  // ── Sound list ───────────────────────────────────────────────
  listCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listItemPressed: {
    backgroundColor: '#F4F2EC',
  },
  listItemLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  listItemLabelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: BRAND,
  },
  divider: {
    height: 1,
    backgroundColor: `${colors.border}B3`,
    marginHorizontal: 20,
  },

  // ── Bottom panel ─────────────────────────────────────────────
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: `${colors.surface}F2`,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.page,
    paddingTop: 16,
    gap: 12,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  gradualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gradualLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.1,
    flex: 1,
    marginRight: 12,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },

  // ── Utilities ────────────────────────────────────────────────
  pressed: { opacity: 0.72 },
});
