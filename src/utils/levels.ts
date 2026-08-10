export interface LevelConfig {
  level: number;
  minPoints: number;
  title: string;
}

/**
 * Table of 17 progressive levels with custom titles and progressive point requirements
 */
export const LEVEL_THRESHOLDS: LevelConfig[] = [
  { level: 1, minPoints: 0, title: 'בחור כהלכה' },
  { level: 2, minPoints: 5000, title: 'בחור כהלכה' },
  { level: 3, minPoints: 15000, title: 'לומד שוקד' },
  { level: 4, minPoints: 30000, title: 'לומד שוקד' },
  { level: 5, minPoints: 55000, title: 'תלמיד חכם' },
  { level: 6, minPoints: 90000, title: 'תלמיד חכם' },
  { level: 7, minPoints: 140000, title: 'עילוי בתורה' },
  { level: 8, minPoints: 200000, title: 'עילוי בתורה' },
  { level: 9, minPoints: 280000, title: 'עילוי בתורה' },
  { level: 10, minPoints: 380000, title: 'שר התורה' },
  { level: 11, minPoints: 500000, title: 'רב' },
  { level: 12, minPoints: 650000, title: 'דיין' },
  { level: 13, minPoints: 850000, title: 'רב קהילה' },
  { level: 14, minPoints: 1100000, title: 'רב שכונה' },
  { level: 15, minPoints: 1450000, title: 'רב העיר' },
  { level: 16, minPoints: 1900000, title: 'רב ראשי' },
  { level: 17, minPoints: 2500000, title: 'אדמו"ר' },
];

export interface LevelDetails {
  level: number;
  title: string;
  currentMin: number;
  nextTarget: number | null;
  nextTitle: string | null;
  progressPercent: number;
}

/**
 * Get comprehensive level details from total user points
 */
export function getLevelDetails(points: number): LevelDetails {
  const pts = Math.max(0, points || 0);
  let currentConfig = LEVEL_THRESHOLDS[0];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pts >= LEVEL_THRESHOLDS[i].minPoints) {
      currentConfig = LEVEL_THRESHOLDS[i];
      break;
    }
  }

  const nextConfig = LEVEL_THRESHOLDS.find((l) => l.level === currentConfig.level + 1);

  if (!nextConfig) {
    return {
      level: currentConfig.level,
      title: currentConfig.title,
      currentMin: currentConfig.minPoints,
      nextTarget: null,
      nextTitle: null,
      progressPercent: 100,
    };
  }

  const pointsInCurrentLevel = pts - currentConfig.minPoints;
  const levelRange = nextConfig.minPoints - currentConfig.minPoints;
  const progressPercent = Math.min(100, Math.max(0, (pointsInCurrentLevel / levelRange) * 100));

  return {
    level: currentConfig.level,
    title: currentConfig.title,
    currentMin: currentConfig.minPoints,
    nextTarget: nextConfig.minPoints,
    nextTitle: nextConfig.title,
    progressPercent,
  };
}

/**
 * Get title for a specific level number
 */
export function getTitleForLevel(level: number): string {
  const match = LEVEL_THRESHOLDS.slice().reverse().find((l) => level >= l.level);
  return match ? match.title : 'בחור כהלכה';
}
