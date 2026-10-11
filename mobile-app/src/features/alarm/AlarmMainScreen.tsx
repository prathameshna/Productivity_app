import { useState } from 'react';
import {
  Image,
  Modal,
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
import Svg, { Path, Rect } from 'react-native-svg';
import {
  AlarmClock,
  CircleCheck,
  EllipsisVertical,
  House,
  Hourglass,
  Plus,
} from 'lucide-react-native';
import avatarImage from '@/assests/raw/avtar.png';
import { colors, spacing } from '@/theme/tokens';
import {
  calculateCountdownText,
  deleteDisabledAlarms,
  formatRepeatDays,
  getNextEnabledAlarm,
  setEditingAlarm,
  toggleAlarmEnabled,
  useAlarms,
} from './alarmState';
import { navItems } from '../dashboard/dashboardData';

const navIcons = {
  house: House,
  alarm: AlarmClock,
  'circle-check': CircleCheck,
  hourglass: Hourglass,
};

export default function AlarmMainScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alarms = useAlarms();
  const [activeTab, setActiveTab] = useState('Alarm');
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  const anyEnabled = alarms.some((a) => a.enabled);
  const nextAlarm = getNextEnabledAlarm(alarms);

  const countdownText = anyEnabled && nextAlarm
    ? calculateCountdownText(nextAlarm.hour, nextAlarm.minute, nextAlarm.period)
    : 'All alarms are off';

  const handleCardPress = (id: string) => {
    setEditingAlarm(id);
    router.push('/alarm-edit');
  };

  const handleAddPress = () => {
    setEditingAlarm();
    router.push('/alarm-edit');
  };

  const handleNavPress = (label: string) => {
    if (label === 'Home') {
      router.push('/');
      return;
    }
    setActiveTab(label);
  };

  const handleDeleteDisabledSelect = () => {
    setShowMenu(false);
    const disabledCount = alarms.filter((a) => !a.enabled).length;
    if (disabledCount === 0) {
      setInfoMessage('There are no disabled alarms to delete.');
      setShowInfoDialog(true);
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteDisabledAlarms();
    setShowConfirmDialog(false);
  };

  const disabledAlarmsCount = alarms.filter((a) => !a.enabled).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {showMenu && (
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setShowMenu(false)}
          />
        )}

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 160 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* BEGIN: AlarmSummaryCard */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryCountdown}>{countdownText}</Text>
            </View>

            <View style={styles.menuWrapper}>
              <Pressable
                accessibilityLabel="More options"
                onPress={() => setShowMenu((prev) => !prev)}
                style={({ pressed }) => [
                  styles.threeDotBtn,
                  pressed && styles.threeDotPressed,
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <EllipsisVertical size={20} color={colors.secondary} strokeWidth={2} />
              </Pressable>

              {showMenu && (
                <View style={styles.dropdownMenu}>
                  <Pressable
                    accessibilityLabel="Delete disabled alarms"
                    onPress={handleDeleteDisabledSelect}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      pressed && styles.dropdownItemPressed,
                    ]}
                  >
                    <Text style={styles.dropdownText}>Delete Disabled Alarms</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
          {/* END: AlarmSummaryCard */}

          {/* BEGIN: AlarmList */}
          <View style={styles.alarmList}>
            {alarms.map((alarm) => {
              const repeatLabel = formatRepeatDays(alarm.repeatDays);
              const minuteStr = alarm.minute.toString().padStart(2, '0');

              return (
                <Pressable
                  key={alarm.id}
                  onPress={() => handleCardPress(alarm.id)}
                  style={({ pressed }) => [
                    styles.alarmCard,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.cardContent}>
                    {/* Left details */}
                    <View style={styles.cardLeft}>
                      <Text style={styles.repeatText}>{repeatLabel}</Text>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{`${alarm.hour}:${minuteStr}`}</Text>
                        <Text style={styles.periodText}>{alarm.period.toLowerCase()}</Text>
                      </View>

                      {/* 2x2 Grid / Mission indicator */}
                      <View style={styles.missionIndicator}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill={colors.secondary}>
                          <Rect x="3" y="3" width="7" height="7" rx="1.5" />
                          <Rect x="14" y="3" width="7" height="7" rx="1.5" />
                          <Rect x="3" y="14" width="7" height="7" rx="1.5" />
                          <Rect x="14" y="14" width="7" height="7" rx="1.5" />
                        </Svg>
                      </View>
                    </View>

                    {/* Right custom toggle switch */}
                    <Pressable
                      accessibilityLabel={`Toggle ${alarm.hour}:${minuteStr} ${alarm.period} alarm`}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleAlarmEnabled(alarm.id);
                      }}
                      style={[
                        styles.toggleTrack,
                        alarm.enabled ? styles.toggleTrackOn : styles.toggleTrackOff,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleThumb,
                          alarm.enabled ? styles.toggleThumbOn : styles.toggleThumbOff,
                        ]}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {/* END: AlarmList */}
        </ScrollView>

        {/* BEGIN: FloatingActionButton */}
        <View
          style={[
            styles.fabWrapper,
            { bottom: Math.max(insets.bottom, 12) + 90 },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            accessibilityLabel="Add new alarm"
            onPress={handleAddPress}
            style={({ pressed }) => [
              styles.fabButton,
              pressed && styles.fabPressed,
            ]}
          >
            <Plus size={24} color={colors.ink} strokeWidth={2.8} />
          </Pressable>
        </View>
        {/* END: FloatingActionButton */}

        {/* BEGIN: BottomNavigationFooter */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <Svg pointerEvents="none" style={styles.footerSvg} viewBox="0 0 400 76" preserveAspectRatio="none">
            <Path d="M0 0H130C148 0 156 8 164 22C173 38 184 46 200 46C216 46 227 38 236 22C244 8 252 0 270 0H400V76H0V0Z" fill={colors.surface} />
            <Path d="M0 0H130C148 0 156 8 164 22C173 38 184 46 200 46C216 46 227 38 236 22C244 8 252 0 270 0H400" stroke={colors.border} strokeWidth={1} fill="none" />
          </Svg>

          <View style={styles.navGroup}>
            {navItems.slice(0, 2).map((item) => (
              <NavItem
                key={item.label}
                item={item}
                active={activeTab === item.label}
                onPress={handleNavPress}
              />
            ))}
          </View>

          <Pressable
            accessibilityLabel="Cadence Voice Assistant"
            style={({ pressed }) => [styles.aiButton, pressed && styles.pressed]}
          >
            <Image source={avatarImage} style={styles.aiAvatar} resizeMode="contain" />
          </Pressable>

          <View style={styles.navGroup}>
            {navItems.slice(2).map((item) => (
              <NavItem
                key={item.label}
                item={item}
                active={activeTab === item.label}
                onPress={handleNavPress}
              />
            ))}
          </View>
        </View>
        {/* END: BottomNavigationFooter */}

        {/* Confirmation Dialog */}
        <Modal
          visible={showConfirmDialog}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmDialog(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowConfirmDialog(false)}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Delete Disabled Alarms</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete {disabledAlarmsCount} disabled alarm{disabledAlarmsCount > 1 ? 's' : ''}? Enabled alarms will remain unchanged.
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  accessibilityLabel="Cancel"
                  onPress={() => setShowConfirmDialog(false)}
                  style={({ pressed }) => [
                    styles.modalCancelBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Delete"
                  onPress={handleConfirmDelete}
                  style={({ pressed }) => [
                    styles.modalDeleteBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Info Dialog */}
        <Modal
          visible={showInfoDialog}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfoDialog(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowInfoDialog(false)}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Delete Disabled Alarms</Text>
              <Text style={styles.modalMessage}>{infoMessage}</Text>

              <View style={styles.modalActions}>
                <Pressable
                  accessibilityLabel="OK"
                  onPress={() => setShowInfoDialog(false)}
                  style={({ pressed }) => [
                    styles.modalOkBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.modalOkText}>OK</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function NavItem({
  item,
  active,
  onPress,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  onPress: (label: string) => void;
}) {
  const Icon = navIcons[item.icon];
  return (
    <Pressable onPress={() => onPress(item.label)} style={styles.navItem}>
      <Icon
        size={24}
        color={active ? colors.ink : colors.secondary}
        strokeWidth={active ? 2.5 : 2}
      />
      <Text style={active ? [styles.navLabel, styles.navActive] : styles.navLabel}>{item.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: 16,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: 40,
  },
  summaryContent: {
    flex: 1,
    paddingRight: 12,
  },
  summaryCountdown: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  menuWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threeDotBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  threeDotPressed: {
    opacity: 0.5,
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 34,
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dropdownItemPressed: {
    backgroundColor: colors.surfaceLow,
  },
  dropdownText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  alarmList: {
    gap: 12,
  },
  alarmCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'column',
  },
  repeatText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.secondary,
    letterSpacing: 0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 2,
  },
  timeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  periodText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: colors.ink,
  },
  missionIndicator: {
    marginTop: 8,
    opacity: 0.75,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: '#FFD026',
  },
  toggleTrackOff: {
    backgroundColor: colors.border,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.ink,
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  fabWrapper: {
    position: 'absolute',
    right: 20,
    zIndex: 30,
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFD026',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD026',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  pressed: {
    opacity: 0.75,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 4,
    paddingHorizontal: 6,
  },
  footerSvg: {
    position: 'absolute',
    top: 5,
    left: 6,
    right: 5,
    width: '100%',
    height: 74,
  },
  aiButton: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -46,
    zIndex: 5,
  },
  aiAvatar: {
    width: 126,
    height: 113,
    borderRadius: 57,
  },
  navGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    height: 76,
  },
  navItem: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navLabel: {
    color: colors.secondary,
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 14,
  },
  navActive: {
    color: colors.ink,
    fontFamily: 'Inter_600SemiBold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  modalMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 22,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.surfaceLow,
  },
  modalCancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.ink,
  },
  modalDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#DC2626',
  },
  modalDeleteText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalOkBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.ink,
  },
  modalOkText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
