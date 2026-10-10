import { useState } from 'react';
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
import Svg, { Line, Polyline } from 'react-native-svg';
import { colors, radii, spacing } from '@/theme/tokens';

// ---------------------------------------------------------------------------
// Mission item data type
// ---------------------------------------------------------------------------
interface MissionItem {
  id: string;
  name: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Mission icon: 2x2 grid of hollow circles on an orange rounded square
// ---------------------------------------------------------------------------
function MemoryIcon() {
  return (
    <View style={styles.missionIconContainer}>
      <View style={styles.missionIconGrid}>
        <View style={styles.missionIconDot} />
        <View style={styles.missionIconDot} />
        <View style={styles.missionIconDot} />
        <View style={styles.missionIconDot} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Drag handle icon (two horizontal lines)
// ---------------------------------------------------------------------------
function DragHandle() {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.secondary}
      strokeWidth={2.2}
      strokeLinecap="round"
    >
      <Line x1="4" y1="9" x2="20" y2="9" />
      <Line x1="4" y1="15" x2="20" y2="15" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Chevron right icon
// ---------------------------------------------------------------------------
function ChevronRightIcon() {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.secondary}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="9 18 15 12 9 6" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Back arrow icon
// ---------------------------------------------------------------------------
function BackArrow() {
  return (
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
  );
}

// ---------------------------------------------------------------------------
// MissionScreen
// ---------------------------------------------------------------------------
export default function MissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [missionsEnabled, setMissionsEnabled] = useState(true);
  const [missions] = useState<MissionItem[]>([
    { id: 'memory', name: 'Memory', count: 5 },
  ]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Navigation Header */}
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <BackArrow />
            </Pressable>
            <Text style={styles.headerTitle}>Mission</Text>
          </View>

          {/* Content Stack */}
          <View style={styles.stack}>

            {/* Enable Missions Toggle Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Enable missions</Text>
              <Switch
                value={missionsEnabled}
                onValueChange={setMissionsEnabled}
                trackColor={{
                  false: '#D1D0CC',
                  true: '#FBBF24',
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D0CC"
                accessibilityLabel="Enable missions toggle"
              />
            </View>

            {/* Mission Items */}
            {missions.map((item) => (
              <Pressable
                key={item.id}
                accessibilityLabel={`${item.name} mission`}
                style={({ pressed }) => [
                  styles.card,
                  styles.missionItemCard,
                  pressed && styles.pressed,
                ]}
              >
                {/* Drag handle */}
                <View style={styles.dragHandle}>
                  <DragHandle />
                </View>

                {/* Type icon */}
                <MemoryIcon />

                {/* Mission details */}
                <View style={styles.missionDetails}>
                  <Text style={styles.missionName}>{item.name}</Text>
                  <Text style={styles.missionCount}>{item.count} times</Text>
                </View>

                {/* Chevron */}
                <View style={styles.chevron}>
                  <ChevronRightIcon />
                </View>
              </Pressable>
            ))}

            {/* Add Mission Dashed Button */}
            <Pressable
              accessibilityLabel="Add Mission"
              style={({ pressed }) => [
                styles.addMissionButton,
                pressed && styles.addMissionButtonPressed,
              ]}
            >
              <Text style={styles.addMissionLabel}>Add Mission</Text>
            </Pressable>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const MISSION_ORANGE = '#EA580C';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: 8,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: radii.control,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
    marginLeft: 12,
    letterSpacing: -0.4,
  },

  // Content stack gap
  stack: {
    gap: 12,
  },

  // Generic white card
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.2,
  },

  // Mission item card
  missionItemCard: {
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  },

  // Drag handle wrapper
  dragHandle: {
    opacity: 0.55,
    marginLeft: -2,
  },

  // Mission icon: orange rounded square with 2x2 circle grid
  missionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: MISSION_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: MISSION_ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  missionIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 27,
    height: 27,
    gap: 5,
  },
  missionIconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },

  // Mission text details
  missionDetails: {
    flex: 1,
    minWidth: 0,
  },
  missionName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  missionCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.secondary,
    marginTop: 2,
    lineHeight: 18,
  },

  // Chevron
  chevron: {
    opacity: 0.6,
    marginRight: -2,
  },

  // Add Mission dashed button
  addMissionButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C4C3BE',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMissionButtonPressed: {
    backgroundColor: '#F4F3F0',
  },
  addMissionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.secondary,
    letterSpacing: -0.1,
  },

  // Generic press feedback
  pressed: {
    opacity: 0.75,
  },
});
