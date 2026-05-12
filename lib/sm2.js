/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality scale (mapped from UI buttons):
 *   Again = 1  (fail)
 *   Hard  = 3  (pass with difficulty)
 *   Good  = 4  (pass with hesitation)
 *   Easy  = 5  (perfect recall)
 *
 * Returns updated SRS card parameters.
 */

/**
 * @param {object} params
 * @param {number} params.easeFactor   - Current ease factor (default 2.5)
 * @param {number} params.interval     - Current interval in days (default 1)
 * @param {number} params.repetitions  - Number of times reviewed successfully in sequence
 * @param {number} params.quality      - Response quality 1–5
 * @returns {{ easeFactor: number, interval: number, repetitions: number, nextReviewDate: string }}
 */
export function sm2(params) {
  let { easeFactor, interval, repetitions, quality } = params;

  // Clamp quality to valid range
  quality = Math.max(1, Math.min(5, quality));

  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality === 1) { // 1 = again (fail)
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // All other ratings (3, 4, 5) are passes
    if (newRepetitions === 0) {
      newInterval = quality === 3 ? 1 : (quality === 4 ? 2 : 4);
    } else if (newRepetitions === 1) {
      newInterval = quality === 3 ? 3 : (quality === 4 ? 6 : 9);
    } else {
      const modifier = quality === 3 ? 0.8 : (quality === 4 ? 1.0 : 1.3);
      newInterval = Math.round(interval * easeFactor * modifier);
    }
    newRepetitions = repetitions + 1;
  }

  // Update ease factor (minimum 1.3 per SM-2 spec)
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor);

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);
  const nextReviewDate = nextDate.toISOString().split('T')[0];

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}

/**
 * Map UI button label to quality score
 * @param {'again'|'hard'|'good'|'easy'} label
 * @returns {number}
 */
export function qualityFromLabel(label) {
  const map = { again: 1, hard: 3, good: 4, easy: 5 };
  return map[label] ?? 4;
}
