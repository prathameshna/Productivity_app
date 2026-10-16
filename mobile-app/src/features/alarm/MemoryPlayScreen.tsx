import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import Svg, { Line, Path, Polyline } from 'react-native-svg';
import { colors, radii, spacing } from '@/theme/tokens';
import { getAlarm } from './alarmState';
import {
  MEMORY_ACCENT,
  MEMORY_ERROR,
  MEMORY_FLAME,
  MEMORY_FLAME_MUTED,
  MEMORY_SUCCESS,
  MEMORY_TILE_IDLE,
  MemoryDifficulty,
  areTileSetsEqual,
  generatePattern,
  getDifficultyConfig,
  normalizeMemorySettings,
} from './memoryMission';

const FONT = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

const MAX_GRID_WIDTH = 300;

// ---------------------------------------------------------------------------
// Single State Machine Specification
// ---------------------------------------------------------------------------
export type GamePhase =
  | 'idle'
  | 'preview'
  | 'recall'
  | 'wrong-reveal'
  | 'correct'
  | 'complete';

type TileVisualState = 'idle' | 'lit' | 'selected' | 'wrong';

interface GameState {
  phase: GamePhase;
  round: number; // 1-based current question index
  pattern: number[]; // Target lit pattern (persists across retries of this round)
  selected: number[]; // Current user selections
  wasInterruptedInPreview: boolean;
}

type GameAction =
  | { type: 'START_ROUND'; round: number; pattern: number[] }
  | { type: 'START_PREVIEW' }
  | { type: 'START_RECALL' }
  | { type: 'TOGGLE_TILE'; index: number; maxTiles: number }
  | { type: 'CHECK_ANSWER' }
  | { type: 'CORRECT_ANSWER' }
  | { type: 'WRONG_ANSWER' }
  | { type: 'RETRY_RECALL' }
  | { type: 'COMPLETE_GAME' }
  | { type: 'APP_BACKGROUNDED' }
  | { type: 'APP_FOREGROUNDED' };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_ROUND':
      return {
        ...state,
        round: action.round,
        pattern: action.pattern,
        selected: [],
        phase: 'preview',
        wasInterruptedInPreview: false,
      };

    case 'START_PREVIEW':
      return {
        ...state,
        phase: 'preview',
        selected: [],
        wasInterruptedInPreview: false,
      };

    case 'START_RECALL':
      return {
        ...state,
        phase: 'recall',
        selected: [],
        wasInterruptedInPreview: false,
      };

    case 'TOGGLE_TILE': {
      if (state.phase !== 'recall') return state;
      const { index, maxTiles } = action;
      if (state.selected.includes(index)) {
        return {
          ...state,
          selected: state.selected.filter((i) => i !== index),
        };
      }
      if (state.selected.length >= maxTiles) {
        return state;
      }
      return {
        ...state,
        selected: [...state.selected, index],
      };
    }

    case 'CORRECT_ANSWER':
      return {
        ...state,
        phase: 'correct',
      };

    case 'WRONG_ANSWER':
      return {
        ...state,
        phase: 'wrong-reveal',
      };

    case 'RETRY_RECALL':
      // Return to recall with clean selection, preserving the same pattern
      return {
        ...state,
        phase: 'recall',
        selected: [],
      };

    case 'COMPLETE_GAME':
      return {
        ...state,
        phase: 'complete',
      };

    case 'APP_BACKGROUNDED':
      if (state.phase === 'preview') {
        return {
          ...state,
          wasInterruptedInPreview: true,
        };
      }
      return state;

    case 'APP_FOREGROUNDED':
      if (state.wasInterruptedInPreview && state.phase === 'preview') {
        return {
          ...state,
          wasInterruptedInPreview: false,
        };
      }
      return state;

    default:
      return state;
  }
}

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

function FlameIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"
      />
    </Svg>
  );
}

function CheckMarkIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={MEMORY_SUCCESS}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

function CrossIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={MEMORY_ERROR}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Grid Tile Component
// ---------------------------------------------------------------------------
const TILE_FILL: Record<TileVisualState, string> = {
  idle: MEMORY_TILE_IDLE,
  lit: MEMORY_ACCENT,
  selected: MEMORY_ACCENT,
  wrong: MEMORY_ERROR,
};

type GridTileProps = {
  index: number;
  size: number;
  state: TileVisualState;
  enabled: boolean;
  gridDim: number;
  onToggle: (index: number) => void;
};

function GridTile({
  index,
  size,
  state,
  enabled,
  gridDim,
  onToggle,
}: GridTileProps) {
  const row = Math.floor(index / gridDim) + 1;
  const column = (index % gridDim) + 1;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tile row ${row}, column ${column}`}
      accessibilityState={{ selected: state === 'selected', disabled: !enabled }}
      disabled={!enabled}
      onPress={() => onToggle(index)}
      style={({ pressed }) => [
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: TILE_FILL[state],
          transform: [{ scale: pressed && enabled ? 0.93 : 1 }],
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// MemoryPlayScreen
// ---------------------------------------------------------------------------
export default function MemoryPlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ questions?: string; difficulty?: string }>();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // Reads from draft route params if present (from PREVIEW button), otherwise alarm store
  const settings = useMemo(() => {
    const alarm = getAlarm();
    const q = params.questions ? Number(params.questions) : alarm.memoryQuestions;
    const d = (params.difficulty as MemoryDifficulty) ?? alarm.memoryDifficulty;
    return normalizeMemorySettings(q, d);
  }, [params.questions, params.difficulty]);

  const config = getDifficultyConfig(settings.difficulty);

  // Single State Machine
  const [state, dispatch] = useReducer(gameReducer, {
    phase: 'idle',
    round: 1,
    pattern: [],
    selected: [],
    wasInterruptedInPreview: false,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerAnim = useRef(new Animated.Value(0)).current;

  // Clear timer safely on phase change or unmount
  const clearActiveTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearActiveTimer();
  }, [clearActiveTimer]);

  // Launch initial round on mount
  useEffect(() => {
    const initialPattern = generatePattern(settings.difficulty);
    dispatch({ type: 'START_ROUND', round: 1, pattern: initialPattern });
  }, [settings.difficulty]);

  // Phase transition side-effects
  useEffect(() => {
    clearActiveTimer();

    if (state.phase === 'preview') {
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'START_RECALL' });
      }, config.previewDurationMs);
    } else if (state.phase === 'wrong-reveal') {
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'RETRY_RECALL' });
      }, config.wrongRevealDurationMs);
    } else if (state.phase === 'correct') {
      timerRef.current = setTimeout(() => {
        if (state.round >= settings.questions) {
          dispatch({ type: 'COMPLETE_GAME' });
        } else {
          const nextPattern = generatePattern(settings.difficulty);
          dispatch({
            type: 'START_ROUND',
            round: state.round + 1,
            pattern: nextPattern,
          });
        }
      }, 700);
    }

    return () => clearActiveTimer();
  }, [
    state.phase,
    state.round,
    config.previewDurationMs,
    config.wrongRevealDurationMs,
    settings.questions,
    settings.difficulty,
    clearActiveTimer,
  ]);

  // Restart preview if app was backgrounded during preview
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        dispatch({ type: 'APP_BACKGROUNDED' });
        clearActiveTimer();
      } else {
        dispatch({ type: 'APP_FOREGROUNDED' });
        if (state.phase === 'preview') {
          // Restart preview duration on foreground
          clearActiveTimer();
          timerRef.current = setTimeout(() => {
            dispatch({ type: 'START_RECALL' });
          }, config.previewDurationMs);
        }
      }
    });

    return () => subscription.remove();
  }, [state.phase, config.previewDurationMs, clearActiveTimer]);

  // Banner entrance animation
  useEffect(() => {
    bannerAnim.setValue(0);
    if (
      state.phase === 'correct' ||
      state.phase === 'wrong-reveal' ||
      state.phase === 'complete'
    ) {
      Animated.timing(bannerAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [bannerAnim, state.phase]);

  // Tile toggle callback
  const handleToggleTile = useCallback(
    (index: number) => {
      if (state.phase !== 'recall') return;
      dispatch({
        type: 'TOGGLE_TILE',
        index,
        maxTiles: config.litCount,
      });
    },
    [state.phase, config.litCount],
  );

  // Submit and compare sets in any order
  const handleCheckAnswer = useCallback(() => {
    if (state.phase !== 'recall') return;
    if (state.selected.length !== config.litCount) return;

    if (areTileSetsEqual(state.selected, state.pattern)) {
      dispatch({ type: 'CORRECT_ANSWER' });
    } else {
      dispatch({ type: 'WRONG_ANSWER' });
    }
  }, [state.phase, state.selected, state.pattern, config.litCount]);

  // Auto-submit when selected count reaches the required lit count
  useEffect(() => {
    if (
      state.phase === 'recall' &&
      state.selected.length === config.litCount
    ) {
      handleCheckAnswer();
    }
  }, [state.phase, state.selected.length, config.litCount, handleCheckAnswer]);

  // Stop review: ends review and exits mission without marking complete
  const handleStopReview = useCallback(() => {
    clearActiveTimer();
    router.back();
  }, [clearActiveTimer, router]);

  if (!fontsLoaded) return null;

  // Grid sizing based on difficulty dimension (4x4, 5x5, 6x6, 7x7)
  const gridDim = config.gridDimension;
  const gridPadding = gridDim >= 6 ? 12 : 16;
  const tileGap = gridDim >= 6 ? 6 : 8;
  const gridWidth = Math.min(
    MAX_GRID_WIDTH,
    Math.max(0, width - spacing.page * 2 - gridPadding * 2 - 2),
  );
  const tileSize = Math.floor((gridWidth - tileGap * (gridDim - 1)) / gridDim);
  const actualGridWidth = tileSize * gridDim + tileGap * (gridDim - 1);

  const patternSet = new Set(state.pattern);
  const selectedSet = new Set(state.selected);

  const tileState = (index: number): TileVisualState => {
    if (state.phase === 'preview') {
      return patternSet.has(index) ? 'lit' : 'idle';
    }
    if (state.phase === 'recall') {
      return selectedSet.has(index) ? 'selected' : 'idle';
    }
    if (state.phase === 'wrong-reveal') {
      // Show correct pattern in amber, and wrong picks in red
      if (patternSet.has(index)) return 'lit';
      if (selectedSet.has(index)) return 'wrong';
      return 'idle';
    }
    if (state.phase === 'correct') {
      return patternSet.has(index) ? 'lit' : 'idle';
    }
    return 'idle';
  };

  const completedQuestions =
    state.phase === 'complete'
      ? settings.questions
      : state.phase === 'correct'
        ? state.round
        : state.round - 1;

  const statusTitle =
    state.phase === 'idle'
      ? 'Ready to play?'
      : state.phase === 'preview'
        ? 'Memorize the tiles'
        : state.phase === 'recall'
          ? 'Your turn'
          : state.phase === 'correct'
            ? 'Correct!'
            : state.phase === 'wrong-reveal'
              ? 'Not quite'
              : 'Mission complete';

  const statusSubtitle =
    state.phase === 'idle'
      ? `Recall the lit tiles on the ${gridDim}×${gridDim} grid.`
      : state.phase === 'preview'
        ? 'Watch closely…'
        : state.phase === 'recall'
          ? `Tap the ${config.litCount} tiles you saw.`
          : state.phase === 'correct'
            ? state.round >= settings.questions
              ? 'You cleared every question.'
              : `Question ${state.round} of ${settings.questions} cleared.`
            : state.phase === 'wrong-reveal'
              ? 'Amber tiles were the pattern; red tiles were wrong picks.'
              : `You completed ${settings.questions} questions on ${settings.difficulty}.`;

  const statusColor =
    state.phase === 'correct' || state.phase === 'complete'
      ? MEMORY_SUCCESS
      : state.phase === 'wrong-reveal'
        ? MEMORY_ERROR
        : colors.ink;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => {
            clearActiveTimer();
            router.back();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <BackArrow />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Memory
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        {/* Progress indicator: shows current question out of total */}
        <View style={styles.progressRow}>
          <View style={styles.streakPill}>
            {Array.from({ length: settings.questions }, (_, index) => (
              <FlameIcon
                key={index}
                color={index < completedQuestions ? MEMORY_FLAME : MEMORY_FLAME_MUTED}
                size={13}
              />
            ))}
          </View>
        </View>

        {/* Status banner */}
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[
            styles.statusBlock,
            {
              opacity: bannerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
              transform: [
                {
                  translateY: bannerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.statusTitleRow}>
            {(state.phase === 'correct' || state.phase === 'complete') && <CheckMarkIcon />}
            {state.phase === 'wrong-reveal' && <CrossIcon />}
            <Text style={[styles.statusTitle, { color: statusColor }]}>
              {statusTitle}
            </Text>
          </View>
          <Text style={styles.statusSubtitle}>{statusSubtitle}</Text>
          <Text style={styles.roundLabel}>
            Question {state.round} of {settings.questions} · {settings.difficulty} ({gridDim}×{gridDim})
          </Text>
        </Animated.View>

        {/* Memory Grid Card */}
        <View style={[styles.gridCard, { padding: gridPadding }]}>
          <View
            style={[
              styles.grid,
              {
                width: actualGridWidth,
                gap: tileGap,
              },
            ]}
          >
            {Array.from({ length: config.totalTiles }, (_, index) => (
              <GridTile
                key={index}
                index={index}
                size={tileSize}
                state={tileState(index)}
                enabled={state.phase === 'recall'}
                gridDim={gridDim}
                onToggle={handleToggleTile}
              />
            ))}
          </View>
        </View>

        {/* Selection hint during recall */}
        {state.phase === 'recall' && (
          <Text style={styles.selectionHint}>
            {state.selected.length} / {config.litCount} tiles selected
          </Text>
        )}

        {/* Footer Actions */}
        <View style={styles.footer}>
          {state.phase === 'wrong-reveal' ? (
            <View style={styles.dualActionsRow}>
              {/* Stop review button: exits without marking complete */}
              <Pressable
                accessibilityLabel="Stop review"
                accessibilityRole="button"
                onPress={handleStopReview}
                style={({ pressed }) => [
                  styles.stopReviewButton,
                  pressed && styles.stopReviewButtonPressed,
                ]}
              >
                <Text style={styles.stopReviewButtonText}>Stop review</Text>
              </Pressable>

              {/* Try again button: immediately returns to recall with same pattern */}
              <Pressable
                accessibilityLabel="Try again"
                accessibilityRole="button"
                onPress={() => {
                  clearActiveTimer();
                  dispatch({ type: 'RETRY_RECALL' });
                }}
                style={({ pressed }) => [
                  styles.tryAgainButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityLabel={
                state.phase === 'complete'
                  ? 'Done'
                  : state.phase === 'recall'
                    ? 'Check answer'
                    : 'Watch pattern'
              }
              accessibilityRole="button"
              accessibilityState={{
                disabled:
                  state.phase === 'preview' ||
                  (state.phase === 'recall' && state.selected.length !== config.litCount),
              }}
              disabled={
                state.phase === 'preview' ||
                (state.phase === 'recall' && state.selected.length !== config.litCount)
              }
              onPress={() => {
                if (state.phase === 'recall') {
                  handleCheckAnswer();
                } else if (state.phase === 'complete') {
                  clearActiveTimer();
                  router.back();
                }
              }}
              style={({ pressed }) => {
                const disabled =
                  state.phase === 'preview' ||
                  (state.phase === 'recall' && state.selected.length !== config.litCount);
                return [
                  styles.primaryButton,
                  disabled && styles.primaryButtonDisabled,
                  pressed && !disabled && styles.primaryButtonPressed,
                ];
              }}
            >
              <Text style={styles.primaryButtonText}>
                {state.phase === 'complete'
                  ? 'Done'
                  : state.phase === 'recall'
                    ? state.selected.length === config.litCount
                      ? 'Check answer'
                      : `Select ${config.litCount - state.selected.length} more`
                    : 'Watch pattern…'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles (preserving visual design tokens and geometry)
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: radii.control,
  },
  headerTitle: {
    fontFamily: FONT.bold,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.page,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressRow: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3EF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    gap: 6,
  },
  statusBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontFamily: FONT.bold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  statusSubtitle: {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  roundLabel: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
  },
  tile: {
    borderRadius: 8,
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectionHint: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: colors.secondary,
  },
  footer: {
    width: '100%',
    maxWidth: MAX_GRID_WIDTH + 32,
    paddingTop: 8,
  },
  dualActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  stopReviewButton: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopReviewButtonPressed: {
    backgroundColor: '#F0EFEB',
  },
  stopReviewButtonText: {
    fontFamily: FONT.bold,
    fontSize: 15,
    color: colors.ink,
  },
  tryAgainButton: {
    flex: 1,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171715',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButtonDisabled: {
    opacity: 0.35,
  },
  primaryButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    fontFamily: FONT.bold,
    fontSize: 16,
    color: colors.surface,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.75,
  },
});
