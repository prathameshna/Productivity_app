import { useState } from 'react';
import {
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
  Polyline,
  Rect,
} from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';
import { SurfaceCard } from '@/components/SurfaceCard';
import { colors, radii, spacing } from '@/theme/tokens';
import {
  calculateCountdownText,
  DAY_LABELS,
  formatRepeatDays,
  getAlarm,
  updateAlarm,
  useAlarm,
} from './alarmState';

export default function AlarmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initial = getAlarm();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<'am' | 'pm'>(initial.period);
  const [repeatDays, setRepeatDays] = useState<number[]>(initial.repeatDays);
  const [name, setName] = useState(initial.name);
  const [mission, setMission] = useState(initial.mission);
  // sound and vibration are read from the reactive store so the badge updates when their screens write to it
  const { sound, vibration } = useAlarm();
  const [snooze, setSnooze] = useState(initial.snooze);
  const [wakeUpCheck, setWakeUpCheck] = useState(initial.wakeUpCheck);
  const [showMemo, setShowMemo] = useState(initial.showMemo);
  const [memo, setMemo] = useState(initial.memo);

  // Modal selector for settings
  const [activePicker, setActivePicker] = useState<{
    title: string;
    options: string[];
    current: string;
    onSelect: (val: string) => void;
  } | null>(null);

  if (!fontsLoaded) return null;

  // Toggle individual day
  const toggleDay = (dayIndex: number) => {
    if (repeatDays.includes(dayIndex)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex].sort((a, b) => a - b));
    }
  };

  // Toggle all days
  const toggleAllDays = () => {
    if (repeatDays.length === 7) {
      setRepeatDays([]);
    } else {
      setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
    }
  };

  // Shift hour
  const adjustHour = (delta: number) => {
    let next = (hour + delta) % 12;
    if (next <= 0) next += 12;
    setHour(next);
  };

  // Shift minute
  const adjustMinute = (delta: number) => {
    let next = (minute + delta) % 60;
    if (next < 0) next += 60;
    setMinute(next);
  };

  // Helper values for drum roller rows
  const getPrevHour = (step: number) => {
    let h = hour - step;
    while (h <= 0) h += 12;
    return h;
  };
  const getNextHour = (step: number) => {
    let h = (hour + step) % 12;
    if (h === 0) h = 12;
    return h;
  };
  const getPrevMinute = (step: number) => {
    let m = minute - step;
    while (m < 0) m += 60;
    return m.toString().padStart(2, '0');
  };
  const getNextMinute = (step: number) => {
    let m = (minute + step) % 60;
    return m.toString().padStart(2, '0');
  };

  const handleSave = () => {
    updateAlarm({
      hour,
      minute,
      period,
      repeatDays,
      name,
      mission,
      sound,
      vibration,
      snooze,
      wakeUpCheck,
      showMemo,
      memo,
      enabled: true,
    });
    router.back();
  };

  const allDaysSelected = repeatDays.length === 7;
  const isCheckboxChecked = repeatDays.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.screenContainer}>
          {/* Top Section */}
          <View style={styles.topStack}>
            {/* BEGIN: NavigationHeader */}
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="Go back"
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
                ]}
              >
                <Svg
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.ink}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Line x1="19" y1="12" x2="5" y2="12" />
                  <Polyline points="12 19 5 12 12 5" />
                </Svg>
              </Pressable>
              <Text style={styles.headerTitle}>Edit alarm</Text>
            </View>
            {/* END: NavigationHeader */}

            {/* BEGIN: StatusSubheader */}
            <View style={styles.statusSubheader}>
              <Text style={styles.statusText}>
                {calculateCountdownText(hour, minute, period)}
              </Text>
            </View>
            {/* END: StatusSubheader */}

            {/* BEGIN: TimePickerWheelCard */}
            <SurfaceCard style={styles.pickerCard}>
              {/* Sun icon on top right */}
              <View style={styles.sunIcon}>
                <Svg
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.sun}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Circle cx="12" cy="12" r="4" />
                  <Path d="M12 2v2" />
                  <Path d="M12 20v2" />
                  <Path d="m4.93 4.93 1.41 1.41" />
                  <Path d="m17.66 17.66 1.41 1.41" />
                  <Path d="M2 12h2" />
                  <Path d="M20 12h2" />
                  <Path d="m6.34 17.66-1.41 1.41" />
                  <Path d="m19.07 4.93-1.41 1.41" />
                </Svg>
              </View>

              {/* Drum Roller Rows */}
              <View style={styles.rollerContainer}>
                {/* Row -2: Most Faded */}
                <View style={styles.rollerRowOuter}>
                  <Pressable
                    onPress={() => adjustHour(-2)}
                    style={styles.colHour}
                  >
                    <Text style={styles.rollerTextDim2}>{getPrevHour(2)}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => adjustMinute(-2)}
                    style={styles.colMinute}
                  >
                    <Text style={styles.rollerTextDim2}>
                      {getPrevMinute(2)}
                    </Text>
                  </Pressable>
                  <View style={styles.colPeriod} />
                </View>

                {/* Row -1: Medium Faded */}
                <View style={styles.rollerRowOuter}>
                  <Pressable
                    onPress={() => adjustHour(-1)}
                    style={styles.colHour}
                  >
                    <Text style={styles.rollerTextDim1}>{getPrevHour(1)}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => adjustMinute(-1)}
                    style={styles.colMinute}
                  >
                    <Text style={styles.rollerTextDim1}>
                      {getPrevMinute(1)}
                    </Text>
                  </Pressable>
                  <View style={styles.colPeriod} />
                </View>

                {/* Active Selected Row (Highlighted pill bar) */}
                <View style={styles.activePillBar}>
                  <View style={styles.activeRowInner}>
                    <Pressable
                      onPress={() => adjustHour(1)}
                      style={styles.colHour}
                    >
                      <Text style={styles.activeNumber}>{hour}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => adjustMinute(1)}
                      style={styles.colMinute}
                    >
                      <Text style={styles.activeNumber}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setPeriod(period === 'am' ? 'pm' : 'am')
                      }
                      style={styles.colPeriod}
                    >
                      <Text style={styles.activePeriod}>{period}</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Row +1: Medium Faded */}
                <View style={styles.rollerRowOuter}>
                  <Pressable
                    onPress={() => adjustHour(1)}
                    style={styles.colHour}
                  >
                    <Text style={styles.rollerTextDim1}>{getNextHour(1)}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => adjustMinute(1)}
                    style={styles.colMinute}
                  >
                    <Text style={styles.rollerTextDim1}>
                      {getNextMinute(1)}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setPeriod(period === 'am' ? 'pm' : 'am')
                    }
                    style={styles.colPeriod}
                  >
                    <Text style={styles.rollerPeriodDim1}>
                      {period === 'am' ? 'pm' : 'am'}
                    </Text>
                  </Pressable>
                </View>

                {/* Row +2: Most Faded */}
                <View style={styles.rollerRowOuter}>
                  <Pressable
                    onPress={() => adjustHour(2)}
                    style={styles.colHour}
                  >
                    <Text style={styles.rollerTextDim2}>{getNextHour(2)}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => adjustMinute(2)}
                    style={styles.colMinute}
                  >
                    <Text style={styles.rollerTextDim2}>
                      {getNextMinute(2)}
                    </Text>
                  </Pressable>
                  <View style={styles.colPeriod} />
                </View>
              </View>
            </SurfaceCard>
            {/* END: TimePickerWheelCard */}

            {/* BEGIN: DaysOfWeekRepeatCard */}
            <SurfaceCard style={styles.repeatCard}>
              <View style={styles.repeatHeader}>
                <Text style={styles.repeatSummaryText}>
                  {formatRepeatDays(repeatDays)}
                </Text>
                <View style={styles.repeatActions}>
                  {/* Calendar icon */}
                  <Pressable
                    accessibilityLabel="Open Calendar"
                    onPress={toggleAllDays}
                    style={({ pressed }) => [
                      styles.iconButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={colors.secondary}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                      <Line x1="16" y1="2" x2="16" y2="6" />
                      <Line x1="8" y1="2" x2="8" y2="6" />
                      <Line x1="3" y1="10" x2="21" y2="10" />
                    </Svg>
                  </Pressable>

                  {/* Terracotta checkbox */}
                  <Pressable
                    accessibilityLabel="Select all days"
                    onPress={toggleAllDays}
                    style={[
                      styles.checkbox,
                      isCheckboxChecked && styles.checkboxChecked,
                    ]}
                  >
                    {isCheckboxChecked && (
                      <Svg
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <Polyline points="20 6 9 17 4 12" />
                      </Svg>
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Day Pills: [S] [M] [T] [W] [T] [F] [S] */}
              <View style={styles.daysGrid}>
                {DAY_LABELS.map((label, idx) => {
                  const selected = repeatDays.includes(idx);
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => toggleDay(idx)}
                      style={({ pressed }) => [
                        styles.dayPill,
                        selected && styles.dayPillSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPillText,
                          selected && styles.dayPillTextSelected,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </SurfaceCard>
            {/* END: DaysOfWeekRepeatCard */}

            {/* BEGIN: AlarmNameCard */}
            <SurfaceCard style={styles.nameCard}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter an alarm name"
                placeholderTextColor={colors.secondary}
                style={styles.nameInput}
              />
            </SurfaceCard>
            {/* END: AlarmNameCard */}

            {/* BEGIN: MissionBadgeCard */}
            <Pressable
              onPress={() => router.push('/mission')}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <SurfaceCard style={styles.missionCard}>
                <Text style={styles.sectionRowTitle}>Mission</Text>
                <View style={styles.missionRight}>
                  {/* Memory terracotta badge */}
                  <View style={styles.missionBadge}>
                    <Svg
                      width={14}
                      height={14}
                      viewBox="0 0 24 24"
                      fill={colors.alarm}
                    >
                      <Rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <Rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <Rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <Rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </Svg>
                    <Text style={styles.missionBadgeText}>{mission}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.secondary} strokeWidth={2.2} />
                </View>
              </SurfaceCard>
            </Pressable>
            {/* END: MissionBadgeCard */}

            {/* BEGIN: SoundAndAlertSettingsCard */}
            <SurfaceCard style={styles.settingsGroupCard}>
              {/* Sound row */}
              <Pressable
                onPress={() => router.push('/sound')}
                style={({ pressed }) => [
                  styles.settingsRow,
                  pressed && styles.pressedRow,
                ]}
              >
                <Text style={styles.sectionRowTitle}>Sound</Text>
                <View style={styles.settingsRowRight}>
                  <Text style={styles.settingsRowValue}>{sound}</Text>
                  <ChevronRight size={16} color={colors.secondary} strokeWidth={2} />
                </View>
              </Pressable>

              <View style={styles.divider} />

              {/* Vibration row */}
              <Pressable
                onPress={() => router.push('/vibration')}
                style={({ pressed }) => [
                  styles.settingsRow,
                  pressed && styles.pressedRow,
                ]}
              >
                <Text style={styles.sectionRowTitle}>Vibration</Text>
                <View style={styles.settingsRowRight}>
                  <Text style={styles.settingsRowValue}>{vibration}</Text>
                  <ChevronRight size={16} color={colors.secondary} strokeWidth={2} />
                </View>
              </Pressable>

              <View style={styles.divider} />

              {/* Snooze row */}
              <Pressable
                onPress={() =>
                  setActivePicker({
                    title: 'Select Snooze',
                    options: [
                      '5 minutes, forever',
                      '5 minutes, 3 times',
                      '10 minutes, 3 times',
                      'Off',
                    ],
                    current: snooze,
                    onSelect: setSnooze,
                  })
                }
                style={({ pressed }) => [
                  styles.settingsRow,
                  pressed && styles.pressedRow,
                ]}
              >
                <Text style={styles.sectionRowTitle}>Snooze</Text>
                <View style={styles.settingsRowRight}>
                  <Text style={styles.settingsRowValue}>{snooze}</Text>
                  <ChevronRight size={16} color={colors.secondary} strokeWidth={2} />
                </View>
              </Pressable>

              <View style={styles.divider} />

              {/* Wake Up Check row */}
              <Pressable
                onPress={() => setWakeUpCheck(!wakeUpCheck)}
                style={({ pressed }) => [
                  styles.settingsRow,
                  pressed && styles.pressedRow,
                ]}
              >
                <View style={styles.wakeUpTitleGroup}>
                  <Text style={styles.sectionRowTitle}>Wake Up Check</Text>
                  <Svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill={colors.secondary}
                  >
                    <Path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7z" />
                  </Svg>
                </View>
                <View style={styles.settingsRowRight}>
                  <Text style={styles.settingsRowValue}>
                    {wakeUpCheck ? 'On' : 'Off'}
                  </Text>
                  <ChevronRight size={16} color={colors.secondary} strokeWidth={2} />
                </View>
              </Pressable>
            </SurfaceCard>
            {/* END: SoundAndAlertSettingsCard */}

            {/* BEGIN: ShowMemoCard */}
            <SurfaceCard style={styles.memoCard}>
              <View style={styles.memoTopRow}>
                <Text style={styles.sectionRowTitle}>
                  Show memo after alarm
                </Text>
                {/* Custom iOS Toggle Switch */}
                <Pressable
                  accessibilityLabel="Toggle show memo after alarm"
                  onPress={() => setShowMemo(!showMemo)}
                  style={[
                    styles.switchTrack,
                    showMemo ? styles.switchTrackOn : styles.switchTrackOff,
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      showMemo ? styles.switchThumbOn : styles.switchThumbOff,
                    ]}
                  />
                </Pressable>
              </View>

              {/* Bottom memo input row with note icon */}
              <View style={styles.memoInputRow}>
                <Svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.secondary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <Polyline points="14 2 14 8 20 8" />
                  <Line x1="16" y1="13" x2="8" y2="13" />
                  <Line x1="16" y1="17" x2="8" y2="17" />
                  <Polyline points="10 9 9 9 8 9" />
                </Svg>
                <TextInput
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="Enter an alarm memo"
                  placeholderTextColor={colors.secondary}
                  editable={showMemo}
                  style={[
                    styles.memoInput,
                    !showMemo && styles.memoInputDisabled,
                  ]}
                />
              </View>
            </SurfaceCard>
            {/* END: ShowMemoCard */}
          </View>

          {/* BEGIN: PrimaryActionButton ("Save") */}
          <View style={styles.saveWrapper}>
            <Pressable
              accessibilityLabel="Save Alarm"
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
              ]}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
          {/* END: PrimaryActionButton */}
        </View>
      </ScrollView>

      {/* Option Picker Modal */}
      {activePicker && (
        <Modal
          transparent
          animationType="fade"
          visible={!!activePicker}
          onRequestClose={() => setActivePicker(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setActivePicker(null)}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>{activePicker.title}</Text>
              <View style={styles.modalOptions}>
                {activePicker.options.map((opt) => {
                  const selected = opt === activePicker.current;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        activePicker.onSelect(opt);
                        setActivePicker(null);
                      }}
                      style={[
                        styles.modalOptionItem,
                        selected && styles.modalOptionItemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          selected && styles.modalOptionTextSelected,
                        ]}
                      >
                        {opt}
                      </Text>
                      {selected && (
                        <Svg
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={colors.alarm}
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <Polyline points="20 6 9 17 4 12" />
                        </Svg>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: 8,
  },
  screenContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  topStack: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: radii.control,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
    marginLeft: 8,
    letterSpacing: -0.3,
  },
  statusSubheader: {
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  pickerCard: {
    position: 'relative',
    borderRadius: radii.card,
    padding: 16,
    overflow: 'hidden',
  },
  sunIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
  },
  rollerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  rollerRowOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '75%',
    paddingVertical: 4,
  },
  colHour: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colMinute: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colPeriod: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollerTextDim2: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.secondary,
    opacity: 0.4,
  },
  rollerTextDim1: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.secondary,
    opacity: 0.7,
  },
  rollerPeriodDim1: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.secondary,
    opacity: 0.7,
    textTransform: 'lowercase',
  },
  activePillBar: {
    width: '100%',
    paddingVertical: 10,
    marginVertical: 4,
    backgroundColor: colors.surfaceLow,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 228, 221, 0.7)',
    alignItems: 'center',
  },
  activeRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '75%',
  },
  activeNumber: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
    textAlign: 'center',
  },
  activePeriod: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  repeatCard: {
    borderRadius: radii.card,
    padding: 16,
    gap: 14,
  },
  repeatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repeatSummaryText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.ink,
  },
  repeatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    padding: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.alarm,
    backgroundColor: colors.alarm,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: {
    backgroundColor: colors.dark,
  },
  dayPillText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.secondary,
  },
  dayPillTextSelected: {
    color: '#FFFFFF',
  },
  nameCard: {
    borderRadius: radii.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  nameInput: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.ink,
    padding: 0,
  },
  missionCard: {
    borderRadius: radii.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  missionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  missionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.alarmTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  missionBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.alarm,
  },
  settingsGroupCard: {
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pressedRow: {
    backgroundColor: colors.surfaceLow,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionRowTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.ink,
  },
  settingsRowValue: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.secondary,
  },
  wakeUpTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  memoCard: {
    borderRadius: radii.card,
    padding: 16,
    gap: 14,
  },
  memoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTrack: {
    width: 48,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: colors.dark,
  },
  switchTrackOff: {
    backgroundColor: colors.border,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  switchThumbOff: {
    alignSelf: 'flex-start',
  },
  memoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  memoInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.ink,
    padding: 0,
  },
  memoInputDisabled: {
    opacity: 0.5,
  },
  saveWrapper: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  saveButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#080808',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
  saveButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.75,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.ink,
    marginBottom: 16,
  },
  modalOptions: {
    gap: 6,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionItemSelected: {
    backgroundColor: colors.alarmTint,
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.ink,
  },
  modalOptionTextSelected: {
    color: colors.alarm,
    fontFamily: 'Inter_600SemiBold',
  },
});
