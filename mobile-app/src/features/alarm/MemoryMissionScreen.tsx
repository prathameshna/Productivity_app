import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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
import Svg, { Line, Path, Polyline } from 'react-native-svg';
import { radii, spacing } from '@/theme/tokens';
import { useAlarm, updateAlarm } from './alarmState';
import {
  MEMORY_DIFFICULTIES,
  MemoryDifficulty,
  MIN_MEMORY_QUESTIONS,
  MAX_MEMORY_QUESTIONS,
  getDifficultyConfig,
  nextDifficulty,
  normalizeMemorySettings,
} from './memoryMission';

// ---------------------------------------------------------------------------
// Vector Icons
// ---------------------------------------------------------------------------

function BackArrow() {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#171715"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1="19" y1="12" x2="5" y2="12" />
      <Polyline points="12 19 5 12 12 5" />
    </Svg>
  );
}

function FlameIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={color} stroke="none">
      <Path d="M12 2c-.6 1.8-2 3.8-3.4 5.3C6.7 9.4 5 12 5 15c0 3.9 3.1 7 7 7s7-3.1 7-7c0-4.2-3.3-7.5-5.3-9.9C13 4.2 12.3 3 12 2zm.5 16.5c-2.2 0-4-1.8-4-4 0-1.5 1-2.9 2-4 .5 1.2 1.3 2 2.5 2.5.8.3 1.5 1 1.5 2 0 1.9-1.3 3.5-2 3.5z" />
    </Svg>
  );
}

function MinusIcon() {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#171715"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#171715"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  );
}

function ChevronLeftIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#171715"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="15 18 9 12 15 6" />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#171715"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="9 18 15 12 9 6" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// MemoryMissionScreen (Settings Screen)
// ---------------------------------------------------------------------------
export default function MemoryMissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const alarm = useAlarm();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Local settings state initialized from the saved alarm configuration
  const initialSettings = normalizeMemorySettings(
    alarm.memoryQuestions,
    alarm.memoryDifficulty,
  );
  const [questions, setQuestions] = useState<number>(initialSettings.questions);
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>(initialSettings.difficulty);

  // Stepper handlers clamped between 1 and 6
  const handleDecreaseQuestions = () => {
    if (questions > MIN_MEMORY_QUESTIONS) {
      setQuestions((prev) => Math.max(MIN_MEMORY_QUESTIONS, prev - 1));
    }
  };

  const handleIncreaseQuestions = () => {
    if (questions < MAX_MEMORY_QUESTIONS) {
      setQuestions((prev) => Math.min(MAX_MEMORY_QUESTIONS, prev + 1));
    }
  };

  // Carousel handlers cycling through Easy -> Normal -> Hard -> Very Hard
  const handlePrevDifficulty = () => {
    setDifficulty((prev) => nextDifficulty(prev, -1));
  };

  const handleNextDifficulty = () => {
    setDifficulty((prev) => nextDifficulty(prev, 1));
  };

  // Launch the challenge game screen with the current draft settings
  const handlePreview = () => {
    router.push({
      pathname: '/memory-play',
      params: {
        questions: String(questions),
        difficulty,
      },
    });
  };

  // Persist only on Save
  const handleSave = () => {
    updateAlarm({
      mission: 'Memory',
      memoryQuestions: questions,
      memoryDifficulty: difficulty,
    });
    router.back();
  };

  if (!fontsLoaded) return null;

  // Derive grid dimensions and example pattern from config in memoryMission.ts
  const config = getDifficultyConfig(difficulty);
  const gridDim = config.gridDimension;
  const totalTiles = config.totalTiles;
  const examplePatternSet = new Set(config.examplePattern);

  // Dynamic grid card metrics
  const gridPadding = gridDim >= 6 ? 6 : 0;
  const gap = gridDim >= 6 ? 6 : 8;
  const maxGridSize = Math.max(0, screenWidth - 82);
  const gridSize = Math.min(216, maxGridSize);
  const tileSize = Math.floor(
    (gridSize - gridPadding * 2 - (gridDim - 1) * gap) / gridDim,
  );
  const actualGridSize =
    tileSize * gridDim + gap * (gridDim - 1) + gridPadding * 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screenWrapper}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Navigation Header */}
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="Go back"
                accessibilityRole="button"
                onPress={() => router.back()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  pressed && styles.pressed,
                ]}
              >
                <BackArrow />
              </Pressable>

              <Text style={styles.headerTitle}>Memory</Text>

              <Pressable
                accessibilityLabel="Preview memory challenge"
                accessibilityRole="button"
                onPress={handlePreview}
                style={({ pressed }) => [
                  styles.previewButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.previewButtonText}>PREVIEW</Text>
              </Pressable>
            </View>

            {/* Example Preview Hero Card */}
            <View style={styles.heroCard}>
              {/* Streak / Flames Pill (3 lit, 2 muted as in reference UI) */}
              <View style={styles.flamePill}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <FlameIcon
                    key={i}
                    color={i < 3 ? '#EE5D32' : '#DBD9D3'}
                  />
                ))}
              </View>

              {/* Subtitle */}
              <Text style={styles.cardSubtitle}>EXAMPLE</Text>

              {/* Memory Tile Grid (Derived entirely from difficulty config) */}
              <View
                style={[
                  styles.gridContainer,
                  {
                    width: actualGridSize,
                    height: actualGridSize,
                    padding: gridPadding,
                    gap,
                  },
                ]}
              >
                {Array.from({ length: totalTiles }).map((_, index) => {
                  const isLit = examplePatternSet.has(index);

                  return (
                    <View
                      key={index}
                      style={[
                        styles.tile,
                        {
                          width: tileSize,
                          height: tileSize,
                        },
                        isLit && styles.tileLit,
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            {/* Settings Controls Section */}
            <View style={styles.controlsSection}>
              {/* Control 1: Number of Questions */}
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Number of Questions</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    accessibilityLabel="Decrease question count"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: questions <= MIN_MEMORY_QUESTIONS }}
                    disabled={questions <= MIN_MEMORY_QUESTIONS}
                    onPress={handleDecreaseQuestions}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      questions <= MIN_MEMORY_QUESTIONS && styles.buttonDisabled,
                      pressed && questions > MIN_MEMORY_QUESTIONS && styles.pressed,
                    ]}
                  >
                    <MinusIcon />
                  </Pressable>

                  <Text style={styles.questionNumberText}>{questions}</Text>

                  <Pressable
                    accessibilityLabel="Increase question count"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: questions >= MAX_MEMORY_QUESTIONS }}
                    disabled={questions >= MAX_MEMORY_QUESTIONS}
                    onPress={handleIncreaseQuestions}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      questions >= MAX_MEMORY_QUESTIONS && styles.buttonDisabled,
                      pressed && questions < MAX_MEMORY_QUESTIONS && styles.pressed,
                    ]}
                  >
                    <PlusIcon />
                  </Pressable>
                </View>
              </View>

              {/* Control 2: Difficulty Level */}
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Difficulty Level</Text>
                <View style={styles.difficultyRow}>
                  <Pressable
                    accessibilityLabel="Previous difficulty"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: difficulty === MEMORY_DIFFICULTIES[0] }}
                    disabled={difficulty === MEMORY_DIFFICULTIES[0]}
                    onPress={handlePrevDifficulty}
                    style={({ pressed }) => [
                      styles.caretButton,
                      difficulty === MEMORY_DIFFICULTIES[0] && styles.buttonDisabled,
                      pressed && difficulty !== MEMORY_DIFFICULTIES[0] && styles.pressed,
                    ]}
                  >
                    <ChevronLeftIcon />
                  </Pressable>

                  <Text style={styles.difficultyText}>{difficulty}</Text>

                  <Pressable
                    accessibilityLabel="Next difficulty"
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: difficulty === MEMORY_DIFFICULTIES[MEMORY_DIFFICULTIES.length - 1],
                    }}
                    disabled={difficulty === MEMORY_DIFFICULTIES[MEMORY_DIFFICULTIES.length - 1]}
                    onPress={handleNextDifficulty}
                    style={({ pressed }) => [
                      styles.caretButton,
                      difficulty === MEMORY_DIFFICULTIES[MEMORY_DIFFICULTIES.length - 1] &&
                        styles.buttonDisabled,
                      pressed &&
                        difficulty !== MEMORY_DIFFICULTIES[MEMORY_DIFFICULTIES.length - 1] &&
                        styles.pressed,
                    ]}
                  >
                    <ChevronRightIcon />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Bottom Action: Save Button */}
            <View style={styles.bottomSection}>
              <Pressable
                accessibilityLabel="Save memory mission settings"
                accessibilityRole="button"
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.saveButtonPressed,
                ]}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>

              {/* iOS Home Indicator Spacer */}
              <View style={styles.homeIndicator} />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles (preserved exact layout, tokens, and aesthetics)
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#171715',
    letterSpacing: -0.2,
  },
  previewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'transparent',
  },
  previewButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#171715',
    letterSpacing: 0.8,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECEAE4',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  flamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3EF',
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#6F706A',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 16,
    textTransform: 'uppercase',
  },

  // Memory Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
  },
  tile: {
    backgroundColor: '#E4E2DC',
    borderRadius: 8,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tileLit: {
    backgroundColor: '#F3B328', // Warm Amber tone matching reference
  },

  // Settings Controls
  controlsSection: {
    marginTop: 32,
    marginBottom: 24,
    gap: 28,
  },
  controlGroup: {
    alignItems: 'center',
    gap: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#6F706A',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
    paddingHorizontal: 8,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAE4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  questionNumberText: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: '#171715',
    letterSpacing: -0.5,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
    paddingHorizontal: 8,
  },
  caretButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyText: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#171715',
    letterSpacing: -0.3,
  },
  buttonDisabled: {
    opacity: 0.3,
  },

  // Bottom Section
  bottomSection: {
    marginTop: 8,
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#171715',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  saveButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  homeIndicator: {
    width: 128,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DBD9D3',
    opacity: 0.6,
    marginTop: 4,
  },

  pressed: {
    opacity: 0.75,
  },
});
