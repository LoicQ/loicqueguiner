// app/api/lookup/route.js
// ---------------------------------------------------------------------------
// POST /api/lookup  { common_name: string }
//   → calls the Anthropic Messages API (raw fetch, no SDK) using ANTHROPIC_API_KEY
//   → returns { ok: true, scientific_name: string|null, family: string|null }
//   → or      { ok: false, error: string }
//
// Runs server-side so ANTHROPIC_API_KEY is never exposed to the browser bundle.
//
// Required env var (add to .env.local):
//   ANTHROPIC_API_KEY=sk-ant-...
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';

export async function POST(request) {
  // -- Parse request --------------------------------------------------------
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const commonName = body.common_name?.trim();
  if (!commonName) {
    return NextResponse.json({ ok: false, error: 'common_name is required' }, { status: 400 });
  }

  // -- Guard: API key must be set ------------------------------------------
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[lookup] ANTHROPIC_API_KEY is not set');
    return NextResponse.json(
      { ok: false, error: 'Lookup service is not configured (missing API key).' },
      { status: 500 }
    );
  }

  // -- Call Anthropic Messages API (raw fetch) ------------------------------
  // Model: claude-sonnet-4-20250514
  // The system prompt constrains the output to strict JSON so we can parse it
  // without needing the SDK.
  let anthropicResponse;
  try {
    anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 128, // taxonomy answer is short
        system:
          'You are a bird taxonomy database. ' +
          'Given a common bird name, return ONLY a raw JSON object — no markdown, no backticks, no explanation. ' +
          'The object must have exactly two fields: ' +
          '"scientific_name" (string with Genus + species, or null if unknown) ' +
          'and "family" (taxonomic family name string, or null if unknown).',
        messages: [
          {
            role: 'user',
            content: `Common name: "${commonName}"`,
          },
        ],
      }),
    });
  } catch (networkErr) {
    console.error('[lookup] Network error calling Anthropic:', networkErr.message);
    return NextResponse.json(
      { ok: false, error: 'Could not reach lookup service. Check your connection.' },
      { status: 502 }
    );
  }

  // -- Handle non-200 from Anthropic ----------------------------------------
  if (!anthropicResponse.ok) {
    // Parse as JSON first (Anthropic always returns JSON error bodies);
    // fall back to raw text if that somehow fails.
    let errorBody;
    try {
      errorBody = await anthropicResponse.json();
    } catch {
      errorBody = await anthropicResponse.text().catch(() => '<unreadable>');
    }
    // Print the full body so it's visible in the Next.js terminal.
    console.error(
      `[lookup] Anthropic API error — status ${anthropicResponse.status}:`,
      JSON.stringify(errorBody, null, 2),
    );
    return NextResponse.json(
      { ok: false, error: `Lookup service error (${anthropicResponse.status})` },
      { status: 502 }
    );
  }

  // -- Parse the Anthropic response -----------------------------------------
  const anthropicData = await anthropicResponse.json();
  const rawText = anthropicData.content?.[0]?.text?.trim() ?? '';

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.error('[lookup] Failed to parse Anthropic JSON:', rawText);
    return NextResponse.json(
      { ok: false, error: 'Unexpected response from lookup service.' },
      { status: 500 }
    );
  }

  // -- Return the result ----------------------------------------------------
  return NextResponse.json({
    ok: true,
    scientific_name: parsed.scientific_name ?? null,
    family: parsed.family ?? null,
  });
}
