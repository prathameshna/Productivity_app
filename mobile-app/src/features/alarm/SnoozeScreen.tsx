import React, { useState, useEffect } from 'react';
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
import { Check, ChevronLeft } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/tokens';
import { useAlarm, updateAlarm } from './alarmState';

// ---------------------------------------------------------------------------
// Constants & Options
// ---------------------------------------------------------------------------
const BRAND = colors.sun; // Using the 'sun' token which is amber-like
const BRAND_SELECTED_BG = 'rgba(245, 158, 11, 0.1)';

const INTERVAL_OPTIONS = [
  '1 minute',
  '3 minutes',
  '5 minutes',
  '10 minutes',
  '30 minutes',
];

const REPEAT_OPTIONS = [
  'forever', // lowercase in state, we'll capitalize it for UI
  '1 time',
  '3 times',
  '5 times',
];

// Helper to format repeat options for display
const formatOptionLabel = (opt: string) => {
  if (opt === 'forever') return 'Forever';
  return opt;
};

// ---------------------------------------------------------------------------
// SnoozeScreen Component
// ---------------------------------------------------------------------------
export default function SnoozeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { snooze } = useAlarm();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // State parsed from the snooze string (e.g., "5 minutes, forever")
  // Or fallback if not set / disabled
  const [snoozeEnabled, setSnoozeEnabled] = useState(snooze !== 'Off');
  
  const defaultParts = snooze !== 'Off' && snooze.includes(', ') 
    ? snooze.split(', ') 
    : ['5 minutes', 'forever'];
    
  const [interval, setIntervalVal] = useState(defaultParts[0] || '5 minutes');
  const [repeat, setRepeatVal] = useState(defaultParts[1] || 'forever');

  // Sync state back to global alarm state
  useEffect(() => {
    if (!snoozeEnabled) {
      updateAlarm({ snooze: 'Off' });
    } else {
      updateAlarm({ snooze: `${interval}, ${repeat}` });
    }
  }, [snoozeEnabled, interval, repeat]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && s.backBtnPressed]}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={s.headerTitle}>Snooze</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={s.scrollArea}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Enable Snooze Card */}
        <View style={s.enableCard}>
          <Text style={s.enableText}>Enable snooze</Text>
          <Pressable
            onPress={() => setSnoozeEnabled(!snoozeEnabled)}
            style={[
              s.toggleBase,
              snoozeEnabled ? s.toggleOn : s.toggleOff,
            ]}
            accessibilityRole="switch"
            accessibilityState={{ checked: snoozeEnabled }}
          >
            <View
              style={[
                s.toggleKnob,
                snoozeEnabled ? s.knobOn : s.knobOff,
              ]}
            />
          </Pressable>
        </View>

        {/* Interval Card */}
        <View style={[s.listCard, !snoozeEnabled && s.disabledCard]}>
          <View style={s.listHeader}>
            <Text style={s.listHeaderText}>INTERVAL</Text>
          </View>
          <View style={s.listGroup}>
            {INTERVAL_OPTIONS.map((opt, index) => {
              const isSelected = interval === opt && snoozeEnabled;
              return (
                <View key={opt}>
                  {index > 0 && <View style={s.divider} />}
                  <Pressable
                    disabled={!snoozeEnabled}
                    onPress={() => setIntervalVal(opt)}
                    style={({ pressed }) => [
                      s.optionRow,
                      isSelected && s.optionRowSelected,
                      pressed && !isSelected && s.optionRowPressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text
                      style={[
                        s.optionText,
                        isSelected && s.optionTextSelected,
                      ]}
                    >
                      {opt}
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

        {/* Repeat Card */}
        <View style={[s.listCard, !snoozeEnabled && s.disabledCard]}>
          <View style={s.listHeader}>
            <Text style={s.listHeaderText}>REPEAT</Text>
          </View>
          <View style={s.listGroup}>
            {REPEAT_OPTIONS.map((opt, index) => {
              const isSelected = repeat === opt && snoozeEnabled;
              return (
                <View key={opt}>
                  {index > 0 && <View style={s.divider} />}
                  <Pressable
                    disabled={!snoozeEnabled}
                    onPress={() => setRepeatVal(opt)}
                    style={({ pressed }) => [
                      s.optionRow,
                      isSelected && s.optionRowSelected,
                      pressed && !isSelected && s.optionRowPressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text
                      style={[
                        s.optionText,
                        isSelected && s.optionTextSelected,
                      ]}
                    >
                      {formatOptionLabel(opt)}
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
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF9F6', // appBg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingTop: 8,
    paddingBottom: 8,
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
    fontSize: 24, // text-2xl
    color: colors.ink,
    letterSpacing: -0.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 16,
    gap: 16, // spaced out cards
  },
  enableCard: {
    backgroundColor: '#FFFFFF', // cardBg
    borderRadius: radii.lg,
    paddingHorizontal: spacing.page,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(237, 235, 230, 1)', // cardBorder #EDEBE6
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 16,
  },
  enableText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  toggleBase: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: BRAND,
  },
  toggleOff: {
    backgroundColor: '#D6D3D1', // stone-300
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  knobOn: {
    transform: [{ translateX: 22 }],
  },
  knobOff: {
    transform: [{ translateX: 0 }],
  },
  disabledCard: {
    opacity: 0.5,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(237, 235, 230, 1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  listHeader: {
    paddingHorizontal: spacing.page,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listHeaderText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#7D7E78', // textMuted
    letterSpacing: 0.5,
  },
  listGroup: {
    flexDirection: 'column',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
  },
  optionRowPressed: {
    backgroundColor: 'rgba(250, 250, 249, 0.7)', // stone-50/70
  },
  optionRowSelected: {
    backgroundColor: BRAND_SELECTED_BG,
  },
  optionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.ink,
  },
  optionTextSelected: {
    fontFamily: 'Inter_500Medium',
    color: BRAND,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F0EB', // itemBorder
  },
});
