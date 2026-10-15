/**
 * Local-time date helpers.
 *
 * Review dates (next_review_date, streaks, daily goals) are compared as
 * YYYY-MM-DD calendar days. Using UTC (e.g. toISOString().split('T')[0])
 * rolls the day over at the wrong hour for non-UTC timezones (05:30 IST),
 * so always build day strings from local time instead.
 */

/**
 * @param {Date} [date] - defaults to now
 * @returns {string} YYYY-MM-DD in local time
 */
export function todayLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {number} days - offset from the given date (may be negative)
 * @param {Date} [date] - defaults to now
 * @returns {string} YYYY-MM-DD in local time
 */
export function addDaysLocal(days, date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return todayLocal(d);
}
