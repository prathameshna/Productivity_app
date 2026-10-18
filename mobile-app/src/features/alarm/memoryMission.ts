// ---------------------------------------------------------------------------
// Memory mission configuration shared by settings and challenge screens.
// Values are persisted on the editing alarm (see alarmState.ts) so they travel
// with the existing alarm lifecycle and storage layer.
// ---------------------------------------------------------------------------

export const MEMORY_DIFFICULTIES = [
  'Easy',
  'Normal',
  'Hard',
  'Very Hard',
] as const;
export type MemoryDifficulty = (typeof MEMORY_DIFFICULTIES)[number];

export const MIN_MEMORY_QUESTIONS = 1;
export const MAX_MEMORY_QUESTIONS = 6;
export const DEFAULT_MEMORY_QUESTIONS = 3;
export const DEFAULT_MEMORY_DIFFICULTY: MemoryDifficulty = 'Normal';

// Feature colors taken from the Memory Mission reference UI.
export const MEMORY_ACCENT = '#F3B328';
export const MEMORY_AMBER = '#F3B328'; // Warm amber for target pattern display
export const MEMORY_TILE_IDLE = '#E4E2DC';
export const MEMORY_FLAME = '#EE5D32';
export const MEMORY_FLAME_MUTED = '#D6D3CD';
export const MEMORY_SUCCESS = '#2F7D4F';
export const MEMORY_ERROR = '#BA1A1A';

export type DifficultyConfig = {
  label: MemoryDifficulty;
  gridDimension: number; // e.g. 4 for 4x4, 5 for 5x5, 6 for 6x6, 7 for 7x7
  totalTiles: number; // gridDimension * gridDimension
  litCount: number; // lit tiles per round
  previewDurationMs: number; // how long the pattern stays visible
  wrongRevealDurationMs: number; // how long the wrong answer reveal displays
  examplePattern: number[]; // static indices for settings card preview
};

const DIFFICULTY_CONFIG: Record<MemoryDifficulty, DifficultyConfig> = {
  Easy: {
    label: 'Easy',
    gridDimension: 4,
    totalTiles: 16,
    litCount: 4,
    previewDurationMs: 2000,
    wrongRevealDurationMs: 2200,
    examplePattern: [1, 6, 8, 14],
  },
  Normal: {
    label: 'Normal',
    gridDimension: 5,
    totalTiles: 25,
    litCount: 7,
    previewDurationMs: 1800,
    wrongRevealDurationMs: 2200,
    // Exact 7-tile pattern from the 5x5 reference UI screen
    examplePattern: [5, 12, 13, 15, 16, 19, 23],
  },
  Hard: {
    label: 'Hard',
    gridDimension: 6,
    totalTiles: 36,
    litCount: 10,
    previewDurationMs: 1600,
    wrongRevealDurationMs: 2200,
    examplePattern: [2, 7, 14, 15, 20, 22, 27, 28, 31, 34],
  },
  'Very Hard': {
    label: 'Very Hard',
    gridDimension: 7,
    totalTiles: 49,
    litCount: 14,
    previewDurationMs: 1500,
    wrongRevealDurationMs: 2200,
    examplePattern: [3, 8, 12, 16, 19, 22, 24, 30, 32, 38, 40, 43, 45, 47],
  },
};

export function getDifficultyConfig(difficulty: MemoryDifficulty): DifficultyConfig {
  return DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.Normal;
}

export function isMemoryDifficulty(value: unknown): value is MemoryDifficulty {
  return (
    typeof value === 'string' &&
    (MEMORY_DIFFICULTIES as readonly string[]).includes(value)
  );
}

export function clampMemoryQuestions(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MEMORY_QUESTIONS;
  return Math.min(
    MAX_MEMORY_QUESTIONS,
    Math.max(MIN_MEMORY_QUESTIONS, Math.round(value)),
  );
}

export type MemorySettings = {
  questions: number;
  difficulty: MemoryDifficulty;
};

// Reads persisted (possibly missing, legacy, or corrupt) alarm values safely.
// Old alarms with question counts above 6 are clamped down to 6.
export function normalizeMemorySettings(
  questions?: number,
  difficulty?: string,
): MemorySettings {
  return {
    questions:
      typeof questions === 'number'
        ? clampMemoryQuestions(questions)
        : DEFAULT_MEMORY_QUESTIONS,
    difficulty: isMemoryDifficulty(difficulty)
      ? difficulty
      : DEFAULT_MEMORY_DIFFICULTY,
  };
}

export function nextDifficulty(
  current: MemoryDifficulty,
  step: 1 | -1,
): MemoryDifficulty {
  const index = MEMORY_DIFFICULTIES.indexOf(current);
  const next = Math.min(
    MEMORY_DIFFICULTIES.length - 1,
    Math.max(0, (index === -1 ? 1 : index) + step),
  );
  return MEMORY_DIFFICULTIES[next];
}

// Generate unique pattern for a difficulty without duplicate indices.
// Optionally pass excludePattern to guarantee generating a different pattern on retry.
export function generatePattern(
  difficulty: MemoryDifficulty,
  excludePattern?: number[],
): number[] {
  const config = getDifficultyConfig(difficulty);
  const indexes = Array.from({ length: config.totalTiles }, (_, i) => i);

  const maxAttempts = excludePattern ? 15 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Fisher-Yates shuffle
    for (let i = indexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = indexes[i];
      indexes[i] = indexes[j];
      indexes[j] = temp;
    }

    const candidate = indexes.slice(0, config.litCount);
    if (!excludePattern || !areTileSetsEqual(candidate, excludePattern)) {
      return candidate;
    }
  }

  return indexes.slice(0, config.litCount);
}

// Set comparison: tests whether two index arrays contain the exact same elements
// regardless of selection order.
export function areTileSetsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((item) => setA.has(item));
}
