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
import { ChevronRight, Trash2 } from 'lucide-react-native';
import { SurfaceCard } from '@/components/SurfaceCard';
import { colors, radii, spacing } from '@/theme/tokens';
import {
  calculateCountdownText,
  DAY_LABELS,
  deleteCurrentAlarm,
  formatRepeatDays,
  getAlarm,
  getActiveEditingAlarmId,
  saveCurrentAlarm,
  updateAlarm,
  useAlarm,
} from './alarmState';

export default function AlarmEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initial = getAlarm();
  const activeId = getActiveEditingAlarmId();

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
  // sound, vibration and snooze are read from the reactive store so the badge updates when their screens write to it
  const { sound, vibration, snooze } = useAlarm();
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
    saveCurrentAlarm({
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

  const handleDelete = () => {
    deleteCurrentAlarm();
    router.back();
  };

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
              {activeId && !activeId.startsWith('alarm-17') ? (
                <Pressable
                  accessibilityLabel="Delete alarm"
                  onPress={handleDelete}
                  style={({ pressed }) => [styles.deleteIconBtn, pressed && styles.pressed]}
                >
                  <Trash2 size={20} color={colors.secondary} />
                </Pressable>
              ) : (
                <View style={{ width: 36 }} />
              )}
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
                    onPress={() => router.push('/calendar')}
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
                onPress={() => router.push('/snooze')}
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
  },
  topStack: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLow,
  },
  deleteIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLow,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  pressedRow: {
    backgroundColor: colors.surfaceLow,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: colors.ink,
  },
  statusSubheader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.secondary,
  },
  pickerCard: {
    position: 'relative',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 210,
  },
  sunIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  rollerContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  rollerRowOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    width: '100%',
  },
  activePillBar: {
    width: '88%',
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.alarmTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  activeRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  colHour: {
    width: 70,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  colMinute: {
    width: 70,
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  colPeriod: {
    width: 50,
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  rollerTextDim2: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: colors.secondary,
    opacity: 0.25,
  },
  rollerTextDim1: {
    fontFamily: 'Inter_500Medium',
    fontSize: 22,
    color: colors.secondary,
    opacity: 0.5,
  },
  rollerPeriodDim1: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.secondary,
    opacity: 0.5,
  },
  activeNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    color: colors.alarm,
  },
  activePeriod: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: colors.alarm,
  },
  repeatCard: {
    padding: 16,
    gap: 14,
  },
  repeatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repeatSummaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.ink,
  },
  repeatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
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
    backgroundColor: colors.alarm,
  },
  dayPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.secondary,
  },
  dayPillTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  nameCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  nameInput: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  missionCard: {
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
    paddingVertical: 5,
    borderRadius: radii.control,
  },
  missionBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.alarm,
  },
  settingsGroupCard: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsRowValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.secondary,
  },
  sectionRowTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.ink,
  },
  wakeUpTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  memoCard: {
    padding: 16,
    gap: 12,
  },
  memoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: colors.alarm,
  },
  switchTrackOff: {
    backgroundColor: colors.border,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
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
    gap: 8,
    backgroundColor: colors.surfaceLow,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  memoInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  memoInputDisabled: {
    color: colors.secondary,
    opacity: 0.5,
  },
  saveWrapper: {
    marginTop: 24,
    width: '100%',
  },
  saveButton: {
    height: 52,
    borderRadius: radii.control,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    opacity: 0.88,
  },
  saveButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: colors.ink,
    marginBottom: 16,
  },
  modalOptions: {
    gap: 8,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLow,
  },
  modalOptionItemSelected: {
    backgroundColor: colors.alarmTint,
  },
  modalOptionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.ink,
  },
  modalOptionTextSelected: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.alarm,
  },
});
