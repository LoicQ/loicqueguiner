// app/CompendiumClient.js
// ---------------------------------------------------------------------------
// Client component for the compendium page.
// Receives the full birds array from the Server Component and handles
// client-side filtering by category and rarity without a round-trip.
// ---------------------------------------------------------------------------

'use client';

import { useState, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr) {
  if (!dateStr) return '—';
  // Parse as local date to avoid UTC off-by-one shifts on date-only strings.
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Colour coding for rarity badges.
const RARITY_COLORS = {
  'Common':    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  'Uncommon':  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'Scarce':    { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  'Rare':      { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  'Very Rare': { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  'Mega':      { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
};

// ---------------------------------------------------------------------------
// BirdCard
// ---------------------------------------------------------------------------

function BirdCard({ bird }) {
  const rarityStyle = RARITY_COLORS[bird.rarity] ?? null;

  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.commonName}>{bird.common_name}</span>
        {bird.scientific_name && (
          <em style={styles.scientificName}>{bird.scientific_name}</em>
        )}
      </div>

      {/* Badges row */}
      <div style={styles.badges}>
        {bird.category && (
          <span style={styles.categoryBadge}>{bird.category}</span>
        )}
        {bird.rarity && rarityStyle && (
          <span style={{
            ...styles.rarityBadge,
            background: rarityStyle.bg,
            color: rarityStyle.text,
            borderColor: rarityStyle.border,
          }}>
            {bird.rarity}
          </span>
        )}
        {bird.family && (
          <span style={styles.familyBadge}>{bird.family}</span>
        )}
      </div>

      <div style={styles.meta}>
        {bird.date_first_seen && (
          <span style={styles.metaItem}>📅 {formatDate(bird.date_first_seen)}</span>
        )}
        {bird.location && (
          <span style={styles.metaItem}>📍 {bird.location}</span>
        )}
      </div>

      {bird.notes && <p style={styles.notes}>{bird.notes}</p>}
    </article>
  );
}

// ---------------------------------------------------------------------------
// CompendiumClient
// ---------------------------------------------------------------------------

export default function CompendiumClient({ birds }) {
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRarity, setFilterRarity] = useState('');

  // Derive unique values from the actual data for the filter dropdowns.
  const categories = useMemo(() => {
    const vals = [...new Set(birds.map((b) => b.category).filter(Boolean))].sort();
    return vals;
  }, [birds]);

  const rarities = useMemo(() => {
    // Preserve meaningful order rather than alphabetical.
    const order = ['Common', 'Uncommon', 'Scarce', 'Rare', 'Very Rare', 'Mega'];
    const inData = new Set(birds.map((b) => b.rarity).filter(Boolean));
    return order.filter((r) => inData.has(r));
  }, [birds]);

  // Apply active filters.
  const filtered = useMemo(() => {
    return birds.filter((b) => {
      if (filterCategory && b.category !== filterCategory) return false;
      if (filterRarity && b.rarity !== filterRarity) return false;
      return true;
    });
  }, [birds, filterCategory, filterRarity]);

  const uniqueSpecies = new Set(filtered.map((b) => b.common_name)).size;
  const isFiltered = filterCategory || filterRarity;

  return (
    <>
      {/* Filter bar – only shown when there's data to filter */}
      {birds.length > 0 && (categories.length > 0 || rarities.length > 0) && (
        <div style={styles.filterBar}>
          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={styles.filterSelect}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {rarities.length > 0 && (
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              style={styles.filterSelect}
              aria-label="Filter by rarity"
            >
              <option value="">All rarities</option>
              {rarities.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}

          {isFiltered && (
            <button
              onClick={() => { setFilterCategory(''); setFilterRarity(''); }}
              style={styles.clearButton}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Result count when filtered */}
      {isFiltered && (
        <p style={styles.filterCount}>
          Showing {filtered.length} sighting{filtered.length !== 1 ? 's' : ''} ·{' '}
          {uniqueSpecies} species
        </p>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <p style={styles.empty}>
          {isFiltered ? 'No sightings match these filters.' : 'No sightings yet. Head out and find some birds!'}
        </p>
      ) : (
        <section style={styles.grid}>
          {filtered.map((bird) => (
            <BirdCard key={bird.id} bird={bird} />
          ))}
        </section>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1.25rem',
    alignItems: 'center',
  },
  filterSelect: {
    padding: '0.4rem 0.6rem',
    fontSize: '0.85rem',
    border: '1px solid #b7e4c7',
    borderRadius: '6px',
    background: '#f0fdf4',
    color: '#1b4332',
    cursor: 'pointer',
  },
  clearButton: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#6b7280',
    cursor: 'pointer',
  },
  filterCount: {
    fontSize: '0.85rem',
    color: '#52796f',
    marginBottom: '0.75rem',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  card: {
    border: '1px solid #b7e4c7',
    borderRadius: '8px',
    padding: '1rem 1.25rem',
    background: '#f0fdf4',
  },
  cardHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  commonName: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: '#1b4332',
  },
  scientificName: {
    color: '#52796f',
    fontSize: '0.9rem',
  },
  badges: {
    marginTop: '0.4rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    fontSize: '0.75rem',
    background: '#e5e7eb',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '999px',
  },
  rarityBadge: {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    fontSize: '0.75rem',
    border: '1px solid',
    borderRadius: '999px',
  },
  familyBadge: {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    fontSize: '0.75rem',
    background: '#f3f4f6',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: '999px',
    fontStyle: 'italic',
  },
  meta: {
    marginTop: '0.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  metaItem: {
    fontSize: '0.85rem',
    color: '#40916c',
  },
  notes: {
    marginTop: '0.6rem',
    fontSize: '0.9rem',
    color: '#374151',
    lineHeight: 1.5,
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: '3rem',
  },
};
