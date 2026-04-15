// app/api/log/route.js
// ---------------------------------------------------------------------------
// API routes for the /log page
//
// POST /api/log  { action: 'auth', password }
//   → verifies the password against LOG_PASSWORD env var
//   → returns { ok: true } or { ok: false }
//
// POST /api/log  { action: 'add', bird: { ... } }
//   → inserts a new row into the `birds` table
//   → requires a valid password in the same payload for security
//
// LOG_PASSWORD is a server-only env var (no NEXT_PUBLIC_ prefix), so it is
// never exposed to the browser bundle.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action } = body;

  // ------------------------------------------------------------------
  // action: 'auth' – check if the supplied password is correct
  // ------------------------------------------------------------------
  if (action === 'auth') {
    const correct = body.password === process.env.LOG_PASSWORD;
    // Always return the same response shape; only the `ok` flag differs.
    return NextResponse.json({ ok: correct });
  }

  // ------------------------------------------------------------------
  // action: 'add' – insert a new bird sighting
  // ------------------------------------------------------------------
  if (action === 'add') {
    // Re-validate password on every write so the client can't skip auth.
    if (body.password !== process.env.LOG_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bird } = body;

    // Minimal server-side validation.
    if (!bird?.common_name?.trim()) {
      return NextResponse.json(
        { error: 'common_name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('birds')
      .insert({
        common_name: bird.common_name.trim(),
        scientific_name: bird.scientific_name?.trim() || null,
        family: bird.family?.trim() || null,
        category: bird.category || null,
        rarity: bird.rarity || null,
        location: bird.location?.trim() || null,
        date_first_seen: bird.date_first_seen || null, // actual column name in DB
        notes: bird.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/log] Supabase insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, bird: data });
  }

  // Unknown action
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
