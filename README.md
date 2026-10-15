# KOTOBA (言葉)

A modern, minimalist Japanese language learning application designed for JLPT N5 preparation. KOTOBA focuses on core vocabulary, kanji, and grammar through an optimized Spaced Repetition System (SRS) and interactive quizzes.

## Features

- **Optimized SRS**: Powered by the SM-2 algorithm (similar to Anki). Cards are scheduled at optimal intervals based on your performance to maximize long-term retention.
- **Collapsible Sidebar**: A clean, responsive navigation system that stays out of your way during study sessions.
- **Marked-list workflow**: Tick words, kanji, or grammar points to add them to your review deck. While any selections exist, review sessions drill only selected cards. Re-marking a card keeps its existing schedule; un-marking removes it from review and deletes its SRS history (the app asks for confirmation when the card already has review progress).
- **Vocabulary**: 1016 words, each with readings, meanings, and example sentences. You can also add your own words from the vocabulary page — new words are marked for review automatically.
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

`jlpt.db` holds your real study progress (selections, SRS cards, review history) and is **not** tracked by git. The schema is created automatically on first run, and upgrades are additive migrations only (`ALTER TABLE … ADD COLUMN`, `CREATE INDEX IF NOT EXISTS`) — progress is never wiped.

- **Back up** (while the app runs, don't just copy the file — SQLite WAL mode means a raw copy can be inconsistent):
  ```bash
  sqlite3 jlpt.db ".backup 'backups/jlpt-2026-10-15.db'"
  ```
- **Rebuild**: content tables reseed from `data/*.csv` (1016 vocabulary, 116 kanji, 41 grammar patterns + 410 grammar examples). Grammar can be re-imported safely at any time — `node scripts/seed-grammar.mjs` upserts `data/grammar.csv` by pattern and rebuilds examples, preserving selections and SRS progress. There is currently no seed script for vocabulary/kanji in the repo (the old wipe-and-reload script was removed), so treat backups as the only way back.

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
