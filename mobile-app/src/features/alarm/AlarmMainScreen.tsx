import { useState } from 'react';
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  AlarmClock,
  CircleCheck,
  House,
  Hourglass,
  MoreVertical,
  Plus,
  Power,
} from 'lucide-react-native';
import { CadenceMark } from '@/components/CadenceMark';
import { colors, radii, spacing } from '@/theme/tokens';
import {
  calculateCountdownText,
  disableAllAlarms,
  formatRepeatDays,
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
  const [showOptions, setShowOptions] = useState(false);
  const [activeTab, setActiveTab] = useState('Alarm');

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  const anyEnabled = alarms.some((a) => a.enabled);
  const firstEnabled = alarms.find((a) => a.enabled);

  const statusText = anyEnabled && firstEnabled
    ? calculateCountdownText(firstEnabled.hour, firstEnabled.minute, firstEnabled.period)
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 120 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* BEGIN: Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>SuperAlarm</Text>

            <View style={styles.optionsWrapper}>
              <Pressable
                accessibilityLabel="More options"
                onPress={() => setShowOptions(!showOptions)}
                style={({ pressed }) => [
                  styles.moreBtn,
                  pressed && styles.pressed,
                ]}
              >
                <MoreVertical size={22} color={colors.ink} />
              </Pressable>

              {/* Options Dropdown Menu */}
              {showOptions && (
                <View style={styles.dropdownMenu}>
                  <Pressable
                    onPress={() => {
                      disableAllAlarms();
                      setShowOptions(false);
                    }}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      pressed && styles.dropdownItemPressed,
                    ]}
                  >
                    <Power size={18} color={colors.secondary} />
                    <Text style={styles.dropdownText}>Disable alarms</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
          {/* END: Header */}

          {/* BEGIN: StatusHeading */}
          <View style={styles.statusSection}>
            <Text style={styles.statusHeading}>{statusText}</Text>
          </View>
          {/* END: StatusHeading */}

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
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill={colors.secondary}>
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
        <View style={styles.fabWrapper} pointerEvents="box-none">
          <Pressable
            accessibilityLabel="Add new alarm"
            onPress={handleAddPress}
            style={({ pressed }) => [
              styles.fabButton,
              pressed && styles.fabPressed,
            ]}
          >
            <Plus size={32} color={colors.ink} strokeWidth={2.8} />
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

          <Pressable accessibilityLabel="Cadence Voice Assistant" style={({ pressed }) => [styles.aiButton, pressed && styles.pressed]}>
            <CadenceMark size={54} />
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
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 24,
    zIndex: 40,
  },
  brandTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  optionsWrapper: {
    position: 'relative',
  },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 48,
    width: 180,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 50,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownItemPressed: {
    backgroundColor: colors.surfaceLow,
  },
  dropdownText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.ink,
  },
  statusSection: {
    marginTop: 4,
    marginBottom: 28,
  },
  statusHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  alarmList: {
    gap: 16,
  },
  alarmCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
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
    fontSize: 13,
    color: colors.secondary,
    letterSpacing: 0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  timeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    color: colors.ink,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  periodText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.ink,
  },
  missionIndicator: {
    marginTop: 12,
    opacity: 0.75,
  },
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 4,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: '#FFD026',
  },
  toggleTrackOff: {
    backgroundColor: colors.border,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    bottom: 96,
    right: 24,
    zIndex: 30,
  },
  fabButton: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#FFD026',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD026',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
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
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 76,
  },
  aiButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: '#080808',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
    zIndex: 5,
  },
  navGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    height: 76,
  },
  navItem: {
    width: 58,
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
});
