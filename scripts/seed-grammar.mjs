// Seed: imports data/grammar.csv into grammar_points.
// Upsert by pattern — preserves user selections and SRS progress.
// Run: node scripts/seed-grammar.mjs
import getDb from '../lib/db.js';
import Papa from 'papaparse';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const csv = fs.readFileSync(path.join(root, 'data/grammar.csv'), 'utf8');
const { data, errors } = Papa.parse(csv, { header: true, skipEmptyLines: true });
if (errors.length) {
  console.error('CSV parse errors:', errors);
  process.exit(1);
}

const db = getDb(); // runs initSchema (CREATE TABLE IF NOT EXISTS) first
const update = db.prepare(`
  UPDATE grammar_points
  SET structure = @structure, meaning = @meaning, category = @category,
      example_jp = @example_jp, example_en = @example_en,
      example_romaji = @example_romaji, source_url = @source_url,
      sort_order = @sort_order
  WHERE pattern = @pattern
`);
const insert = db.prepare(`
  INSERT INTO grammar_points (pattern, structure, meaning, category, example_jp, example_en, example_romaji, source_url, sort_order)
  VALUES (@pattern, @structure, @meaning, @category, @example_jp, @example_en, @example_romaji, @source_url, @sort_order)
`);
let updated = 0;
let inserted = 0;
const tx = db.transaction((rows) => {
  for (const r of rows) {
    const row = {
      pattern: r.pattern?.trim(),
      structure: r.structure?.trim() || null,
      meaning: r.meaning?.trim(),
      category: r.category?.trim() || 'Other',
      example_jp: r.example_jp?.trim() || null,
      example_en: r.example_en?.trim() || null,
      example_romaji: r.example_romaji?.trim() || null,
      source_url: r.source_url?.trim() || null,
      sort_order: parseInt(r.sort_order, 10) || 1000,
    };
    if (!row.pattern || !row.meaning) {
      console.warn('Skipping row with missing pattern/meaning:', r);
      continue;
    }
    if (update.run(row).changes > 0) updated++;
    else {
      insert.run(row);
      inserted++;
    }
  }
});
tx(data);
console.log(`Grammar seed: ${updated} updated, ${inserted} inserted.`);

// Examples: standalone table, no user data references it — wipe and re-insert.
const exCsv = fs.readFileSync(path.join(root, 'data/grammar_examples.csv'), 'utf8');
const exParsed = Papa.parse(exCsv, { header: true, skipEmptyLines: true });
if (exParsed.errors.length) {
  console.error('Examples CSV parse errors:', exParsed.errors);
  process.exit(1);
}
const idOf = (pattern) =>
  db.prepare('SELECT id FROM grammar_points WHERE pattern = ?').get(pattern)?.id ?? null;
db.prepare('DELETE FROM grammar_examples').run();
const exInsert = db.prepare(`
  INSERT INTO grammar_examples (grammar_id, example_jp, example_en, explanation, sort_order)
  VALUES (@grammar_id, @example_jp, @example_en, @explanation, @sort_order)
`);
let exCount = 0;
const exTx = db.transaction((rows) => {
  for (const r of rows) {
    const gid = idOf(r.pattern?.trim());
    if (!gid) {
      console.warn('No grammar point for pattern:', r.pattern);
      continue;
    }
    exInsert.run({
      grammar_id: gid,
      example_jp: r.example_jp?.trim(),
      example_en: r.example_en?.trim() || null,
      explanation: r.explanation?.trim() || null,
      sort_order: parseInt(r.sort_order, 10) || 1000,
    });
    exCount++;
  }
});
exTx(exParsed.data);
console.log(`Examples seed: ${exCount} inserted.`);
