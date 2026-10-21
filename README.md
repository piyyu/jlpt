# KOTOBA (言葉)

A modern, minimalist Japanese language learning application designed for JLPT N5 preparation. KOTOBA focuses on core vocabulary, kanji, and grammar through an optimized Spaced Repetition System (SRS) and interactive quizzes.

## Features

- **Optimized SRS**: Powered by the SM-2 algorithm (similar to Anki). Cards are scheduled at optimal intervals based on your performance to maximize long-term retention.
- **Collapsible Sidebar**: A clean, responsive navigation system that stays out of your way during study sessions.
- **Marked-list workflow**: Tick words, kanji, or grammar points to add them to your review deck. While any selections exist, review sessions drill only selected cards. Re-marking a card keeps its existing schedule; un-marking removes it from review and deletes its SRS history (the app asks for confirmation when the card already has review progress).
- **Vocabulary**: 1,271 words from the Minna no Nihongo N5 list (lessons 1–25 plus an added-words set), each with reading, romaji, meaning, level and study priority. One row of chips narrows the list to **Core (N5)** (default), **N4** or **Everything**; the lesson dropdown narrows it further and its per-lesson counts, the section headers and "Mark all" all follow the same filter. The lesson selection is kept in the URL (`?lessons=1,2`) and in localStorage, so it survives a reload or a trip to another page. Words you add by hand land in the **Added words** bucket (no lesson, no study priority, so they always show up), are highlighted and scrolled to when added, and can be removed again with the ✕ on their row.
- **Kanji**: 116 kanji with readings, meanings, example words, and animated stroke order.
- **Grammar**: 41 N5 patterns with example sentences, extra drill examples, and links to textbook explanations — fully wired into SRS review and quizzes.
- **Hiragana & Katakana**: Interactive kana charts with audio and typing drills.
- **Interactive Quiz**: Test your knowledge with multiple-choice questions for vocabulary, kanji, and grammar.
- **Native Audio**: High-quality text-to-speech for all vocabulary words to help with pronunciation.
- **Minimalist Dark Mode**: A sleek, high-contrast interface designed for long, distraction-free study sessions.

## Tech Stack

- **Frontend**: Next.js (App Router), Tailwind CSS, Lucide Icons
- **Database**: Better-SQLite3 (Local, fast, zero-config)
- **Algorithm**: Custom SM-2 Spaced Repetition implementation

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start your study session.

### Test Against a Copy

`lib/db.js` reads the database path from `JLPT_DB_PATH`, falling back to `jlpt.db`. To try scripts or migrations without touching real progress, point it at a copy:

```bash
cp jlpt.db /tmp/jlpt-test.db
JLPT_DB_PATH=/tmp/jlpt-test.db node scripts/check-local-date.mjs
```

## Database & Backups

`jlpt.db` holds your real study progress (selections, SRS cards, review history) and is **not** tracked by git. The schema is created automatically on first run, and upgrades are additive migrations (`ALTER TABLE … ADD COLUMN`, `CREATE INDEX IF NOT EXISTS`) — progress is never wiped. The one exception is the vocabulary table, which is rebuilt once when its shape changes (the `english` column became `meaning` and `level`/`study`/`lesson` were added); the rebuild carries the old rows over.

- **Back up** (while the app runs, don't just copy the file — SQLite WAL mode means a raw copy can be inconsistent):
  ```bash
  sqlite3 jlpt.db ".backup 'backups/jlpt-2026-10-15.db'"
  ```
- **Rebuild**: grammar reseeds from `data/grammar.csv` (41 grammar patterns + 410 grammar examples) — `node scripts/seed-grammar.mjs` upserts by pattern and rebuilds examples, preserving selections and SRS progress. Vocabulary reseeds from `data/kotoba_import.csv` — `npm run import:vocab` reads the CSV and inserts every row, skipping exact duplicates (same japanese + reading + meaning) and refreshing the level/study/lesson metadata of rows that are already there, so it is safe to run repeatedly. Add `-- --reset` to wipe the current word list and all vocabulary progress (marks, SM-2 cards, weak points, review log) before importing. Kanji has no seed script — treat backups as the only way back.

## Vocabulary Import

`data/kotoba_import.csv` holds the word list (`japanese, reading, romaji, meaning, level, study, source`). `source` is either `MnN I L<n>` (Minna no Nihongo lesson 1–25) or `Added (community N5 list)`; the lesson number is parsed into the `vocabulary.lesson` column, and added words get `lesson = NULL`.

```bash
npm run import:vocab                 # insert missing rows, refresh metadata
npm run import:vocab -- --reset      # wipe the old list + vocabulary progress first
```

The import is idempotent: run it as often as you like, the word count stays the same. The CSV holds 1273 rows; two of them are exact duplicates of another row (both appear in two different lessons), so 1271 words land in the database.

`data/kotoba_import.csv` is the single source of truth for the word list — it is the only copy kept in the repo, and the `source` column carries the lesson for each word, so the list can be grouped by lesson straight from that column.

## What Is Public and What Is Private

Everything under `data/` is content and is tracked by git: the vocabulary list (`kotoba_import.csv` + the per-lesson split), the kanji list (`kanji.csv`), grammar patterns and examples. Your **study progress is not** — it lives only in `jlpt.db` (marks, SM-2 cards, weak points, review log, quiz history), which is gitignored along with every copy of it (`*.db`, `*.db-wal`, `*.db-shm`, `*.backup-*`, `backups/`). Pushing this repo publishes the word lists and the code, never your progress.

## SRS Ratings Guide

When reviewing a card, choose the rating that best describes your recall:

- **Again (1)**: Total failure to recall. Resets the interval to 1 day and decreases the ease factor.
- **Hard (2)**: Recalled with great difficulty. The interval increases slowly.
- **Good (3)**: Recalled correctly with some hesitation. The standard SRS progression.
- **Easy (4)**: Perfect, instant recall. The interval increases significantly faster.

## Project Philosophy

KOTOBA is designed to be **lean and distraction-free**. By focusing exclusively on vocabulary, kanji, and grammar, it provides a dedicated environment for mastering the building blocks of the Japanese language.

## Credits

- Kanji stroke-order diagrams: [KanjiVG](https://kanjivg.tagaini.net) (bundled under `public/kanjivg`), licensed CC BY-SA 3.0.
