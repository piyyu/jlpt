# KOTOBA (言葉)

A modern, minimalist Japanese language learning application designed for JLPT N5 preparation. KOTOBA focuses on core vocabulary and kanji through an optimized Spaced Repetition System (SRS) and interactive quizzes.

## Features

- **Optimized SRS**: Powered by the SM-2 algorithm (similar to Anki). Cards are scheduled at optimal intervals based on your performance to maximize long-term retention.
- **Collapsible Sidebar**: A clean, responsive navigation system that stays out of your way during study sessions.
- **Selections System**: Manually select specific words or kanji to create a custom study deck for focused practice.
- **Vocabulary & Kanji**: Over 800 vocabulary words and 100+ kanji, each with detailed readings, meanings, and example sentences.
- **Interactive Quiz**: Test your knowledge with multiple-choice questions for both vocabulary and kanji.
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

## SRS Ratings Guide

When reviewing a card, choose the rating that best describes your recall:

- **Again (1)**: Total failure to recall. Resets the interval to 1 day and decreases the ease factor.
- **Hard (2)**: Recalled with great difficulty. The interval increases slowly.
- **Good (3)**: Recalled correctly with some hesitation. The standard SRS progression.
- **Easy (4)**: Perfect, instant recall. The interval increases significantly faster.

## Project Philosophy

KOTOBA is designed to be **lean and distraction-free**. By focusing exclusively on vocabulary and kanji, it provides a dedicated environment for mastering the building blocks of the Japanese language.
