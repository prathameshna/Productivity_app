import React, { useState } from 'react';
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
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
  Rect,
} from 'react-native-svg';
import { colors, radii, spacing } from '@/theme/tokens';
import { updateAlarm } from './alarmState';

// ---------------------------------------------------------------------------
// Mission Option Data Definition
// ---------------------------------------------------------------------------
interface MissionOption {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  renderIcon: () => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Vector Icons Matching Reference UI Exact Shapes
// ---------------------------------------------------------------------------

function BackArrow() {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.ink}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1="19" y1="12" x2="5" y2="12" />
      <Polyline points="12 19 5 12 12 5" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C4C7C7"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="9 18 15 12 9 6" />
    </Svg>
  );
}

// 1. Math: Calculator (+, -, ×, =)
function MathIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      {/* Plus */}
      <Line x1="7.5" y1="8" x2="10.5" y2="8" />
      <Line x1="9" y1="6.5" x2="9" y2="9.5" />
      {/* Minus */}
      <Line x1="13.5" y1="8" x2="16.5" y2="8" />
      {/* Multiply */}
      <Line x1="7.7" y1="14.7" x2="10.3" y2="17.3" />
      <Line x1="10.3" y1="14.7" x2="7.7" y2="17.3" />
      {/* Equals */}
      <Line x1="13.5" y1="15" x2="16.5" y2="15" />
      <Line x1="13.5" y1="17.2" x2="16.5" y2="17.2" />
    </Svg>
  );
}

// 2. Object Scan: Camera
function CameraIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5L14.5 4z" />
      <Circle cx="12" cy="13" r="3.5" />
    </Svg>
  );
}

// 3. Push-Up: Dumbbell
function PushUpIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1="6.5" y1="6.5" x2="17.5" y2="17.5" />
      <Line x1="3" y1="9" x2="9" y2="3" />
      <Line x1="4.5" y1="10.5" x2="10.5" y2="4.5" />
      <Line x1="15" y1="21" x2="21" y2="15" />
      <Line x1="13.5" y1="19.5" x2="19.5" y2="13.5" />
    </Svg>
  );
}

// 4. Typing: Keyboard
function KeyboardIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <Line x1="6" y1="9.5" x2="6.01" y2="9.5" strokeWidth={2.2} />
      <Line x1="10" y1="9.5" x2="10.01" y2="9.5" strokeWidth={2.2} />
      <Line x1="14" y1="9.5" x2="14.01" y2="9.5" strokeWidth={2.2} />
      <Line x1="18" y1="9.5" x2="18.01" y2="9.5" strokeWidth={2.2} />
      <Line x1="6" y1="13" x2="6.01" y2="13" strokeWidth={2.2} />
      <Line x1="18" y1="13" x2="18.01" y2="13" strokeWidth={2.2} />
      <Line x1="9.5" y1="15.5" x2="14.5" y2="15.5" strokeWidth={1.8} />
    </Svg>
  );
}

// 5. Memory: 2x2 Grid Tiles
function MemoryGridIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <Rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <Rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <Rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </Svg>
  );
}

// 6. Trivia Quiz: Circle with Question Mark
function TriviaIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="12" cy="12" r="9" />
      <Path d="M9.8 9.5a2.4 2.4 0 0 1 4.4 1.2c0 1.2-1.4 1.8-1.7 2.6" />
      <Line x1="12" y1="16.5" x2="12.01" y2="16.5" strokeWidth={2.5} />
    </Svg>
  );
}

// 7. Shake: Phone with Vibration Waves
function ShakeIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect x="8" y="4" width="8" height="16" rx="2" />
      <Path d="M4.5 7.5a6.5 6.5 0 0 0 0 9" />
      <Path d="M19.5 7.5a6.5 6.5 0 0 1 0 9" />
      <Path d="M2 9.5a4 4 0 0 0 0 5" />
      <Path d="M22 9.5a4 4 0 0 1 0 5" />
    </Svg>
  );
}

// 8. Step: Walking Person
function StepIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
    </Svg>
  );
}

// 9. QR/Barcode Scan: Viewfinder Frame with Code
function QrScanIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="#FFFFFF">
      <Path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5zM22 7h-2V4h-3V2h5v5zm0 15v-5h-2v3h-3v2h5zM2 22h5v-2H4v-3H2v5zM2 2v5h2V4h3V2H2z" />
    </Svg>
  );
}

// Footer Hourglass
function HourglassIcon() {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64655F"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M5 22h14" />
      <Path d="M5 2h14" />
      <Path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <Path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Missions Dataset
// ---------------------------------------------------------------------------
const MISSIONS_LIST: MissionOption[] = [
  {
    id: 'math',
    title: 'Math',
    subtitle: 'Solve equations to turn off',
    color: '#5E5CE6',
    renderIcon: () => <MathIcon />,
  },
  {
    id: 'object-scan',
    title: 'Object Scan',
    subtitle: 'Photograph assigned household object',
    color: '#00A389',
    renderIcon: () => <CameraIcon />,
  },
  {
    id: 'push-up',
    title: 'Push-Up',
    subtitle: 'Bodyweight reps detected via camera',
    color: '#F26419',
    renderIcon: () => <PushUpIcon />,
  },
  {
    id: 'typing',
    title: 'Typing',
    subtitle: 'Type motivating daily affirmations',
    color: '#34C759',
    renderIcon: () => <KeyboardIcon />,
  },
  {
    id: 'memory',
    title: 'Memory',
    subtitle: 'Pattern tile recall challenge',
    color: '#FF9500',
    renderIcon: () => <MemoryGridIcon />,
  },
  {
    id: 'trivia-quiz',
    title: 'Trivia Quiz',
    subtitle: 'Answer general knowledge queries',
    color: '#0091FF',
    renderIcon: () => <TriviaIcon />,
  },
  {
    id: 'shake',
    title: 'Shake',
    subtitle: 'Shake phone vigorously for 30s',
    color: '#E5A100',
    renderIcon: () => <ShakeIcon />,
  },
  {
    id: 'step',
    title: 'Step',
    subtitle: 'Walk a target step count out of bed',
    color: '#E03177',
    renderIcon: () => <StepIcon />,
  },
  {
    id: 'qr-barcode-scan',
    title: 'QR/Barcode Scan',
    subtitle: 'Scan toothpaste or coffee barcode',
    color: '#8E44AD',
    renderIcon: () => <QrScanIcon />,
  },
];

// ---------------------------------------------------------------------------
// MissionSelectionScreen Component
// ---------------------------------------------------------------------------
export default function MissionSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!fontsLoaded) return null;

  const handleSelectMission = (mission: MissionOption) => {
    setSelectedId(mission.id);
    if (mission.id === 'memory') {
      // Memory has its own configuration screen: replace this picker so the
      // back gesture from it returns to the Mission list instead of the picker.
      router.replace('/memory');
      return;
    }
    // Connect existing mission selection to the alarm draft state
    updateAlarm({ mission: mission.title });
    // Seamless return to Mission List
    setTimeout(() => {
      router.back();
    }, 120);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <BackArrow />
          </Pressable>
          <Text style={styles.headerTitle}>Mission Selection</Text>
        </View>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Unified Card Container for all Missions */}
          <View style={styles.cardContainer}>
            {MISSIONS_LIST.map((item, index) => {
              const isLast = index === MISSIONS_LIST.length - 1;
              const isSelected = selectedId === item.id;

              return (
                <Pressable
                  key={item.id}
                  accessibilityLabel={`${item.title} mission`}
                  accessibilityRole="button"
                  onPress={() => handleSelectMission(item)}
                  style={({ pressed }) => [
                    styles.missionRow,
                    !isLast && styles.missionRowBorder,
                    (pressed || isSelected) && styles.missionRowPressed,
                  ]}
                >
                  <View style={styles.rowLeft}>
                    {/* Mission Icon Badge */}
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: item.color },
                      ]}
                    >
                      {item.renderIcon()}
                    </View>

                    {/* Mission Details */}
                    <View style={styles.textContainer}>
                      <Text style={styles.missionTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.missionSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  {/* Right Chevron */}
                  <View style={styles.chevronWrapper}>
                    <ChevronRight />
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Bottom Delight / Footer Prompt */}
          <View style={styles.footer}>
            <View style={styles.hourglassCircle}>
              <HourglassIcon />
            </View>
            <Text style={styles.footerText}>
              More missions are in the works
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background, // '#FAF9F6'
  },

  // Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page, // 20
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  backButtonPressed: {
    backgroundColor: colors.surfaceContainer,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.ink,
    marginLeft: 6,
    letterSpacing: -0.2,
  },
  headerRightSpacer: {
    width: 44,
    height: 44,
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: spacing.page, // 20
    paddingTop: 16,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },

  // Unified Single Card Container
  cardContainer: {
    backgroundColor: colors.surface, // '#FFFFFF'
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0EFEB',
    overflow: 'hidden',
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },

  // Mission Row Item
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  missionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F1ED',
  },
  missionRowPressed: {
    backgroundColor: '#F7F6F3',
  },

  // Row Left (Icon + Text)
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 14,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  missionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#171715',
    letterSpacing: -0.2,
  },
  missionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6F706A',
    marginTop: 2,
    lineHeight: 16,
  },

  // Row Right (Chevron)
  chevronWrapper: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Bottom Delight / Footer Prompt
  footer: {
    marginTop: 36,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    opacity: 0.85,
  },
  hourglassCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer, // '#EFEEEB'
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6F706A',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
