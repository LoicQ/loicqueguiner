// app/dashboard/page.js
// ---------------------------------------------------------------------------
// Dashboard – summary stats over the `birds` table (Server Component)
//
// Reuses the same Supabase client and query pattern as app/page.js: a single
// `select('*')` against the `birds` table, ordered by date_first_seen. All
// stats below are derived in-memory from that one result set.
// ---------------------------------------------------------------------------

import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export const metadata = {
  title: 'Dashboard · Bird Compendium',
  description: 'Summary stats for the bird sighting log.',
};

// ---------------------------------------------------------------------------
// Data fetching (same client + pattern as app/page.js)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Colour assignment
//
// Categorical hues are assigned by each category's fixed position in the
// same option list used on the /log entry form, not by rank in this data set
// — so a category's colour never shifts as counts change. Categories beyond
// the 8-hue palette fall back to a shared neutral grey.
// ---------------------------------------------------------------------------

const CANONICAL_CATEGORIES = [
  'Passerine', 'Raptor', 'Wader', 'Wildfowl', 'Seabird',
  'Gamebird', 'Pigeon / Dove', 'Owl', 'Woodpecker', 'Hummingbird', 'Other',
];

const CATEGORY_HUES = [
  '#2a78d6', '#1baf7a', '#eda100', '#008300',
  '#4a3aa7', '#e34948', '#e87ba4', '#eb6834',
];

const CATEGORY_FALLBACK_HUE = '#6b7280';

function categoryColor(category) {
  const idx = CANONICAL_CATEGORIES.indexOf(category);
  if (idx === -1 || idx >= CATEGORY_HUES.length) return CATEGORY_FALLBACK_HUE;
  return CATEGORY_HUES[idx];
}

// Same rarity tiers + colours as the pill badges on the Compendium cards.
const RARITY_COLORS = {
  'Common':    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  'Uncommon':  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'Rare':      { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  'Very Rare': { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
};
const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Very Rare'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const birds = await getBirds();

  if (birds.length === 0) {
    return (
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
        </header>
        <p style={styles.empty}>No sightings yet. Head out and find some birds!</p>
      </main>
    );
  }

  // ---- Stat cards ----------------------------------------------------------
  const totalSightings = birds.length;
  const totalSpecies = new Set(birds.map((b) => b.common_name)).size;

  const withDates = birds.filter((b) => b.date_first_seen);
  const latest = withDates.length
    ? [...withDates].sort((a, b) => b.date_first_seen.localeCompare(a.date_first_seen))[0]
    : null;

  // ---- Category breakdown ---------------------------------------------------
  const categoryCounts = new Map();
  for (const b of birds) {
    if (!b.category) continue;
    categoryCounts.set(b.category, (categoryCounts.get(b.category) ?? 0) + 1);
  }
  const categoryBreakdown = [...categoryCounts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      pct: Math.round((count / totalSightings) * 100),
      color: categoryColor(category),
    }))
    .sort((a, b) => b.count - a.count);

  const topCategory = categoryBreakdown[0] ?? null;

  // ---- Rarity distribution ---------------------------------------------------
  const rarityCounts = new Map();
  for (const b of birds) {
    if (!b.rarity) continue;
    rarityCounts.set(b.rarity, (rarityCounts.get(b.rarity) ?? 0) + 1);
  }
  const rarityDistribution = RARITY_ORDER
    .filter((tier) => rarityCounts.has(tier))
    .map((tier) => ({ tier, count: rarityCounts.get(tier) }));

  // ---- Recent sightings (by when they were logged, not observed) ------------
  const recentlyLogged = [...birds]
    .filter((b) => b.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>
          {totalSightings} sighting{totalSightings !== 1 ? 's' : ''} · {totalSpecies} species
        </p>
      </header>

      {/* Stat cards */}
      <section style={styles.statGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Species</p>
          <p style={styles.statValue}>{totalSpecies}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Sightings</p>
          <p style={styles.statValue}>{totalSightings}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Latest Sighting</p>
          {latest ? (
            <>
              <p style={styles.statValueSmall}>{formatDateShort(latest.date_first_seen)}</p>
              <p style={styles.statSubtext}>{latest.common_name}</p>
            </>
          ) : (
            <p style={styles.statValueSmall}>—</p>
          )}
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Top Category</p>
          {topCategory ? (
            <>
              <p style={styles.statValueSmall}>{topCategory.category}</p>
              <p style={styles.statSubtext}>
                {topCategory.count} sighting{topCategory.count !== 1 ? 's' : ''}
              </p>
            </>
          ) : (
            <p style={styles.statValueSmall}>—</p>
          )}
        </div>
      </section>

      {/* Category breakdown */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Category Breakdown</h2>
        <div style={styles.barList}>
          {categoryBreakdown.map(({ category, count, pct, color }) => (
            <div key={category} style={styles.barRow}>
              <div style={styles.barLabelRow}>
                <span style={styles.barLabel}>
                  <span style={{ ...styles.swatch, background: color }} />
                  {category}
                </span>
                <span style={styles.barValue}>
                  {count} · {pct}%
                </span>
              </div>
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${Math.max(pct, 2)}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rarity distribution */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Rarity Distribution</h2>
        <div style={styles.rarityGrid}>
          {rarityDistribution.map(({ tier, count }) => {
            const rarityStyle = RARITY_COLORS[tier];
            return (
              <div key={tier} style={styles.rarityColumn}>
                <p style={styles.rarityCount}>{count}</p>
                <span
                  style={{
                    ...styles.rarityBadge,
                    background: rarityStyle.bg,
                    color: rarityStyle.text,
                    borderColor: rarityStyle.border,
                  }}
                >
                  {tier}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent sightings */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Recent Sightings</h2>
        <ul style={styles.recentList}>
          {recentlyLogged.map((b) => (
            <li key={b.id} style={styles.recentRow}>
              <span style={styles.recentName}>{b.common_name}</span>
              <span style={styles.recentMeta}>
                {formatDate(b.date_first_seen)}
                {b.location ? ` · ${b.location}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  main: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 1rem 3rem',
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
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: '3rem',
  },

  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    border: '1px solid #b7e4c7',
    borderRadius: '8px',
    padding: '1rem 1.25rem',
    background: '#f0fdf4',
  },
  statLabel: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#52796f',
    marginBottom: '0.4rem',
  },
  statValue: {
    fontSize: '1.9rem',
    fontWeight: 'bold',
    color: '#1b4332',
  },
  statValueSmall: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#1b4332',
  },
  statSubtext: {
    marginTop: '0.15rem',
    fontSize: '0.85rem',
    color: '#40916c',
  },

  card: {
    border: '1px solid #b7e4c7',
    borderRadius: '8px',
    padding: '1.25rem 1.5rem',
    background: '#f0fdf4',
    marginBottom: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.1rem',
    color: '#1b4332',
    margin: '0 0 1rem',
  },

  barList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  barRow: {},
  barLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.3rem',
    fontSize: '0.9rem',
  },
  barLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#1b4332',
    fontWeight: 'bold',
  },
  swatch: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    flexShrink: 0,
  },
  barValue: {
    color: '#52796f',
    fontFamily: 'Arial, sans-serif',
    fontVariantNumeric: 'tabular-nums',
  },
  barTrack: {
    height: '10px',
    borderRadius: '5px',
    background: '#e5e7eb',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '5px',
  },

  rarityGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  rarityColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.4rem',
  },
  rarityCount: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1b4332',
    fontFamily: 'Arial, sans-serif',
  },
  rarityBadge: {
    display: 'inline-block',
    padding: '0.2rem 0.65rem',
    fontSize: '0.8rem',
    border: '1px solid',
    borderRadius: '999px',
    fontFamily: 'Arial, sans-serif',
  },

  recentList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  recentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.5rem',
    fontSize: '0.9rem',
    borderBottom: '1px solid #d8f3dc',
    paddingBottom: '0.5rem',
  },
  recentName: {
    fontWeight: 'bold',
    color: '#1b4332',
  },
  recentMeta: {
    color: '#52796f',
    fontFamily: 'Arial, sans-serif',
    fontSize: '0.85rem',
  },
};
