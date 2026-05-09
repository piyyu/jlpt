# KOTOBA

A modern, local-first Japanese language learning application designed to help you prepare for the JLPT N5. It features a Spaced Repetition System (SRS) powered by the widely used SM-2 algorithm (similar to Anki), interactive quiz modes, and comprehensive content covering vocabulary, kanji, grammar, and more!

## Features

- **Spaced Repetition System (SRS)**: Optimize your study sessions. Cards are scheduled at optimal intervals based on your past performance to ensure long-term retention.
- **Targeted Practice (Selections)**: Manually lock specific vocabulary or kanji elements into your "Selections" list to filter your reviews into a concentrated, custom deck.
- **Quiz Modes & Mock Tests**: Test your knowledge across different topics with multiple-choice questions or challenge yourself with a mock exam.
- **Audio Support**: Hear the native pronunciation of vocabulary words directly in the app.
- **Comprehensive Content**:
  - Hiragana & Katakana
  - N5 Vocabulary & Kanji
  - Particles & Grammar
  - Reading & Listening Practice

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework (App Router)
- [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) - Lightweight, fast local database architecture
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [Lucide React](https://lucide.dev/) - Beautiful iconography

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize the Database
Before running the app for the first time, populate the local SQLite database (`jlpt.db`) from the raw dataset files located in the `data/` folder.
```bash
npm run seed
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to automatically jump into your studies.

## Project Structure

- `/app` - Core application logic containing Next.js pages and API routes
- `/components` - Reusable UI widgets (Quiz cards, Audio buttons, Navigation, etc.)
- `/data` - Raw CSV dataset files representing the study material
- `/lib` - Application utility functions (DB connection logic, SM-2 Spaced Repetition algorithm, Romaji conversion, etc.)
- `/scripts` - Automation scripts for managing, seeding, and migrating database definitions
