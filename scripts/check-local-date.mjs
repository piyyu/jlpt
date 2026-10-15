// Verifies local-time date helpers.
// Run: TZ=Asia/Kolkata node scripts/check-local-date.mjs
import { todayLocal, addDaysLocal } from '../lib/date.js';

const cases = [
  // 2026-10-14T20:00:00Z is 2026-10-15 01:30 in Asia/Kolkata: UTC day math
  // (toISOString) says 10-14, local calendar says 10-15.
  [todayLocal(new Date('2026-10-14T20:00:00Z')), '2026-10-15', 'IST evening maps to next local day'],
  [addDaysLocal(1, new Date('2026-10-14T20:00:00Z')), '2026-10-16', 'addDaysLocal(+1)'],
  [addDaysLocal(-7, new Date('2026-10-14T20:00:00Z')), '2026-10-08', 'addDaysLocal(-7)'],
];

let failed = 0;
for (const [got, want, label] of cases) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: got ${got}, want ${want}`);
}
console.log(`TZ=${process.env.TZ || '(unset)'}`);
process.exit(failed ? 1 : 0);
