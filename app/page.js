// app/page.js
// ---------------------------------------------------------------------------
// Birding Compendium – public home page (Server Component)
//
// Fetches all rows from the `birds` table and passes them to
// CompendiumClient, which handles the category/rarity filter dropdowns
// on the client without a round-trip.
//
// birds table columns used here:
//   id, common_name, scientific_name, family, category, rarity,
//   location, date_first_seen, notes, created_at
// ---------------------------------------------------------------------------

import { supabase } from '@/lib/supabase';
import CompendiumClient from './CompendiumClient';

// Revalidate every 60 s so new sightings appear without a full redeploy.
export const revalidate = 60;

export const metadata = {
  title: 'Bird Compendium',
  description: 'A personal log of bird sightings.',
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getBirds() {
  const { data, error } = await supabase
    .from('birds')
    .select('*')
    .order('date_first_seen', { ascending: false }); // correct column name

  if (error) {
    console.error('[getBirds] Supabase error:', error.message);
    return [];
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function Home() {
  const birds = await getBirds();

  const uniqueSpecies = new Set(birds.map((b) => b.common_name)).size;

  return (
    <main style={styles.main}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Bird Compendium</h1>
        <p style={styles.subtitle}>
          {birds.length} sighting{birds.length !== 1 ? 's' : ''} ·{' '}
          {uniqueSpecies} species
        </p>
      </header>

      {/* Client component handles filter dropdowns + card rendering */}
      <CompendiumClient birds={birds} />

      {/* Footer */}
      <footer style={styles.footer}>
        <a href="/log" style={styles.logLink}>+ Log a sighting</a>
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Styles (server-rendered shell only – card styles live in CompendiumClient)
// ---------------------------------------------------------------------------

const styles = {
  main: {
    maxWidth: '680px',
    margin: '0 auto',
    padding: '2rem 1rem',
    fontFamily: 'Georgia, serif',
  },
  header: {
    marginBottom: '1.5rem',
    borderBottom: '2px solid #2d6a4f',
    paddingBottom: '1rem',
  },
  title: {
    fontSize: '2rem',
    color: '#1b4332',
    margin: 0,
  },
  subtitle: {
    marginTop: '0.25rem',
    color: '#52796f',
    fontSize: '0.95rem',
  },
  footer: {
    marginTop: '3rem',
    textAlign: 'center',
  },
  logLink: {
    display: 'inline-block',
    padding: '0.6rem 1.4rem',
    background: '#2d6a4f',
    color: '#fff',
    borderRadius: '6px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '0.9rem',
    textDecoration: 'none',
  },
};
