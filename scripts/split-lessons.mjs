// Export: splits data/kotoba_import.csv into one file per Minna no Nihongo
// lesson, plus the added-words file, so the list can be browsed lesson by
// lesson on GitHub.
//
// The master CSV stays the source of truth — `npm run import:vocab` reads it.
//
// Run: npm run export:lessons
import Papa from 'papaparse';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = path.join(root, 'data/kotoba_import.csv');
const outDir = path.join(root, 'data/lessons');

const raw = fs.readFileSync(srcPath, 'utf8').replace(/^\uFEFF/, '');
const { data, errors } = Papa.parse(raw, { header: true, skipEmptyLines: true });
if (errors.length) {
  console.error('CSV parse errors:', errors);
  process.exit(1);
}

const lessonOf = (source) => {
  const m = /MnN\s+[IVX]+\s+L(\d+)/i.exec(source || '');
  return m ? parseInt(m[1], 10) : null;
};

const groups = new Map();
for (const row of data) {
  const lesson = lessonOf(row.source);
  const key = lesson === null ? 'added' : String(lesson).padStart(2, '0');
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

// Keep the master column order so each file is a drop-in subset.
const fields = Object.keys(data[0] || {});

fs.mkdirSync(outDir, { recursive: true });
// Remove files from earlier runs so a renamed/deleted lesson cannot linger.
for (const file of fs.readdirSync(outDir)) {
  if (file.endsWith('.csv')) fs.unlinkSync(path.join(outDir, file));
}

let total = 0;
const written = [];
for (const key of [...groups.keys()].sort((a, b) => {
  if (a === 'added') return 1;
  if (b === 'added') return -1;
  return Number(a) - Number(b);
})) {
  const rows = groups.get(key);
  const name = key === 'added' ? 'added' : `lesson-${key}`;
  const csv = Papa.unparse({ fields, data: rows }, { newline: '\n' });
  fs.writeFileSync(path.join(outDir, `${name}.csv`), csv, 'utf8');
  written.push(`${name}.csv (${rows.length})`);
  total += rows.length;
}

console.log(`Lesson export: wrote ${written.length} files to data/lessons/`);
for (const w of written) console.log(`  ${w}`);
console.log(`  total rows: ${total} (master CSV has ${data.length})`);
