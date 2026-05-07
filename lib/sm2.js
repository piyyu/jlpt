/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality scale (mapped from UI buttons):
 *   Again = 1  (complete blackout / wrong)
 *   Hard  = 2  (incorrect but recognizable)
 *   Good  = 3  (correct with hesitation)
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

  if (quality < 3) {
    // Failed response — reset repetition streak
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful response
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
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
  const map = { again: 1, hard: 2, good: 3, easy: 5 };
  return map[label] ?? 3;
}
