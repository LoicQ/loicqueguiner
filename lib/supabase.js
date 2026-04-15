// lib/supabase.js
// ---------------------------------------------------------------------------
// Supabase client factory
//
// Usage:
//   import { supabase } from '@/lib/supabase'
//
// Required environment variables (add to .env.local):
//   NEXT_PUBLIC_SUPABASE_URL   – your project URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY – your anon/public key
//
// Both vars are prefixed NEXT_PUBLIC_ so they're available in browser bundles.
// Never put your service-role key in a NEXT_PUBLIC_ variable.
// ---------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
  );
}

// A single shared client instance (safe to import from both Server and Client
// Components – Supabase JS v2 is isomorphic).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
