import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET /api/grammar/examples?grammar_id=N — all examples for one pattern.
export function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const grammarId = parseInt(searchParams.get('grammar_id'), 10);
  if (!Number.isFinite(grammarId)) {
    return NextResponse.json({ error: 'grammar_id required' }, { status: 400 });
  }
  const rows = db
    .prepare(
      'SELECT id, example_jp, example_en, explanation FROM grammar_examples WHERE grammar_id = ? ORDER BY sort_order ASC, id ASC'
    )
    .all(grammarId);
  return NextResponse.json(rows);
}
