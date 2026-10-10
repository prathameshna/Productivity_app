import React, { useState, useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
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
import Svg, { Path, Rect, Polyline } from 'react-native-svg';
import { Check, ChevronLeft } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/tokens';
import { getAlarm, updateAlarm } from './alarmState';

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------
const BRAND = colors.sun; // #F59E0B
const BRAND_SELECTED_BG = 'rgba(245, 158, 11, 0.1)'; // #fef3c7 approx

const VIBRATION_PATTERNS = [
  'Short',
  'Medium',
  'Basic',
  'Heartbeat',
  'Ticktock',
  'Waltz',
  'Zig-Zig-Zig',
  'Offbeat',
  'Spinning',
];

// ---------------------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------------------
function PhoneVibrateIcon({ color }: { color: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M3 8.5l1.5 1.75L3 12l1.5 1.75L3 15.5" strokeLinecap="round" strokeLinejoin="round" />
      <Rect height="15" rx="2" strokeWidth="1.8" width="9" x="7.5" y="4.5" />
      <Path d="M21 8.5l-1.5 1.75L21 12l-1.5 1.75L21 15.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function IntensitySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
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
          accessibilityLabel="Decrease intensity"
        />
        <Pressable
          style={{ flex: 100 - value, minWidth: 0 }}
          onPress={() => onChange(Math.min(100, value + 10))}
          accessibilityLabel="Increase intensity"
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    marginLeft: -11,
    top: '50%',
    marginTop: -11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
});

// ---------------------------------------------------------------------------
// VibrationScreen
// ---------------------------------------------------------------------------
export default function VibrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const initial = getAlarm();
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState<string>(initial.vibration);
  const [intensity, setIntensity] = useState(20);

  const handleSelectPattern = useCallback((name: string) => {
    setSelectedPattern(name);
    updateAlarm({ vibration: name });
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && s.backBtnPressed]}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={s.headerTitle}>Vibration</Text>
        <View style={{ width: 40 }} /> {/* balance */}
      </View>

      {/* ── Scrollable Content ─────────────────────────────────── */}
      <ScrollView
        style={s.scrollArea}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: insets.bottom + 100 }, // space for bottom bar
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Enable Vibration Card */}
        <View style={s.enableCard}>
          <Text style={s.enableText}>Enable vibration</Text>
          <Pressable
            onPress={() => setVibrationEnabled((prev) => !prev)}
            style={[
              s.toggleBase,
              vibrationEnabled ? s.toggleOn : s.toggleOff,
            ]}
            accessibilityRole="switch"
            accessibilityState={{ checked: vibrationEnabled }}
          >
            <View
              style={[
                s.toggleKnob,
                vibrationEnabled ? s.knobOn : s.knobOff,
              ]}
            />
          </Pressable>
        </View>

        {/* Vibrations List Card */}
        <View style={s.listCard}>
          <View style={s.listHeader}>
            <Text style={s.listHeaderText}>Vibrations</Text>
          </View>

          <View style={s.listGroup}>
            {VIBRATION_PATTERNS.map((pattern, index) => {
              const isSelected = selectedPattern === pattern;
              return (
                <View key={pattern}>
                  {index > 0 && <View style={s.divider} />}
                  <Pressable
                    onPress={() => handleSelectPattern(pattern)}
                    style={({ pressed }) => [
                      s.patternRow,
                      isSelected && s.patternRowSelected,
                      pressed && !isSelected && s.patternRowPressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text
                      style={[
                        s.patternText,
                        isSelected && s.patternTextSelected,
                      ]}
                    >
                      {pattern}
                    </Text>
                    {isSelected && (
                      <Check size={20} color={BRAND} strokeWidth={2.5} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Intensity Bar ───────────────────────────────── */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={s.bottomBarInner}>
          <PhoneVibrateIcon color={BRAND} />
          <IntensitySlider
            value={intensity}
            onChange={setIntensity}
          />
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
    backgroundColor: '#EDECE8', // Matching the body background from reference
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingTop: spacing.page,
    paddingBottom: 12,
    zIndex: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  backBtnPressed: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 4,
  },
  enableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 228, 221, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  enableText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.ink,
  },
  toggleBase: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: BRAND,
  },
  toggleOff: {
    backgroundColor: '#E5E5EA',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  knobOn: {
    transform: [{ translateX: 20 }],
  },
  knobOff: {
    transform: [{ translateX: 0 }],
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 228, 221, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    overflow: 'hidden',
  },
  listHeader: {
    paddingHorizontal: spacing.page,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listHeaderText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  listGroup: {
    flexDirection: 'column',
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
  },
  patternRowPressed: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  patternRowSelected: {
    backgroundColor: BRAND_SELECTED_BG,
  },
  patternText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.ink,
  },
  patternTextSelected: {
    fontFamily: 'Inter_600SemiBold',
    color: BRAND,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 228, 221, 0.6)',
    paddingHorizontal: spacing.page,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 20,
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
