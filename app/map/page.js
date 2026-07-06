// app/map/page.js
// ---------------------------------------------------------------------------
// /map – Interactive sightings map (Server Component)
//
// Reuses the same Supabase client + query pattern as app/page.js and
// app/dashboard/page.js: a single select('*') against the `birds` table.
// Privacy tiering (precise pin / approximate circle / omitted) based on
// rarity is computed client-side in MapView.
// ---------------------------------------------------------------------------

import { supabase } from '@/lib/supabase';
import MapView from './MapView';

export const revalidate = 60;

export const metadata = {
  title: 'Map · Bird Compendium',
  description: 'Sighting locations, with rarer birds shown at reduced precision.',
};

async function getBirds() {
  const { data, error } = await supabase
    .from('birds')
    .select('*')
    .order('date_first_seen', { ascending: false });

  if (error) {
    console.error('[getBirds] Supabase error:', error.message);
    return [];
  }

  return data ?? [];
}

export default async function MapPage() {
  const birds = await getBirds();

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.title}>Sightings Map</h1>
        <p style={styles.subtitle}>
          Precise pins for common sightings — rarer birds are shown at reduced
          precision or omitted entirely to protect their location.
        </p>
      </header>

      <MapView birds={birds} />
    </main>
  );
}

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
    color: '#1A1A1A',
    margin: 0,
  },
  subtitle: {
    marginTop: '0.25rem',
    color: '#6B6B6B',
    fontSize: '0.95rem',
  },
};
