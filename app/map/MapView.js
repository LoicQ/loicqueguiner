// app/map/MapView.js
// ---------------------------------------------------------------------------
// Client-side orchestration for the /map page: classifies each bird into a
// privacy tier based on its rarity, computes a default center/zoom from the
// tiered data actually shown, and renders the Leaflet map (loaded client-side
// only, see the dynamic import below) plus a legend.
//
// Privacy tiers:
//   - sensitive flag true                    -> omitted entirely, regardless of rarity
//   - Common / Uncommon / unspecified rarity -> precise pin
//   - Scarce / Rare                          -> approximate ~8km circle
//   - Very Rare / Mega                       -> omitted entirely
// ---------------------------------------------------------------------------

'use client';

import dynamic from 'next/dynamic';

// Leaflet touches `window` at import time, so the map must load client-side
// only — never during SSR.
const SightingsMap = dynamic(() => import('./SightingsMap'), {
  ssr: false,
  loading: () => <div style={styles.mapLoading}>Loading map…</div>,
});

// Plattsburgh, NY — used only when there's no plottable data to center on.
const FALLBACK_CENTER = [44.6995, -73.4529];
const FALLBACK_ZOOM = 11;
const CLUSTER_ZOOM = 10;

function classifyRarity(rarity) {
  if (rarity === 'Scarce' || rarity === 'Rare') return 'approximate';
  if (rarity === 'Very Rare' || rarity === 'Mega') return 'omitted';
  // Common, Uncommon, and unspecified rarity are treated as non-sensitive.
  return 'precise';
}

export default function MapView({ birds }) {
  const mappable = birds.filter((b) => b.lat != null && b.lng != null);

  const sensitiveCount = mappable.filter((b) => b.sensitive).length;

  const plotted = mappable
    .filter((b) => !b.sensitive)
    .map((b) => ({ ...b, tier: classifyRarity(b.rarity) }))
    .filter((b) => b.tier !== 'omitted');

  const pins = plotted.filter((b) => b.tier === 'precise');
  const circles = plotted.filter((b) => b.tier === 'approximate');

  let center = FALLBACK_CENTER;
  let zoom = FALLBACK_ZOOM;

  if (plotted.length > 0) {
    const avgLat = plotted.reduce((sum, b) => sum + b.lat, 0) / plotted.length;
    const avgLng = plotted.reduce((sum, b) => sum + b.lng, 0) / plotted.length;
    center = [avgLat, avgLng];
    zoom = CLUSTER_ZOOM;
  }

  return (
    <>
      <div style={styles.mapWrapper}>
        <SightingsMap pins={pins} circles={circles} center={center} zoom={zoom} />
      </div>

      {sensitiveCount > 0 && (
        <p style={styles.sensitiveNote}>
          {sensitiveCount} sensitive sighting{sensitiveCount !== 1 ? 's' : ''} not
          shown, to protect vulnerable species
        </p>
      )}

      <div style={styles.legend}>
        <p style={styles.legendTitle}>Legend</p>
        <div style={styles.legendRow}>
          <span style={styles.legendPinSwatch}>📍</span>
          <span>Common / Uncommon — precise location</span>
        </div>
        <div style={styles.legendRow}>
          <span style={styles.legendCircleSwatch} />
          <span>Scarce / Rare — approximate area (~8 km)</span>
        </div>
        <div style={styles.legendRow}>
          <span style={styles.legendHiddenSwatch}>—</span>
          <span>Very Rare / Mega — not shown, to protect the sighting</span>
        </div>
        <div style={styles.legendRow}>
          <span style={styles.legendHiddenSwatch}>🔒</span>
          <span>Marked sensitive — never shown, regardless of rarity</span>
        </div>
      </div>
    </>
  );
}

const styles = {
  mapWrapper: {
    height: '480px',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #d1d5db',
    marginBottom: '1.25rem',
  },
  mapLoading: {
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: '0.9rem',
    background: '#f9fafb',
    fontFamily: 'Arial, sans-serif',
  },
  sensitiveNote: {
    marginTop: '-0.75rem',
    marginBottom: '1.25rem',
    fontSize: '0.85rem',
    color: '#6b7280',
    fontStyle: 'italic',
    fontFamily: 'Arial, sans-serif',
  },
  legend: {
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    background: '#f9fafb',
    maxWidth: '420px',
    fontSize: '0.85rem',
    color: '#374151',
    fontFamily: 'Arial, sans-serif',
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#1b4332',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.35rem',
  },
  legendPinSwatch: {
    fontSize: '1rem',
    width: '14px',
    textAlign: 'center',
  },
  legendCircleSwatch: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: 'rgba(245, 158, 11, 0.35)',
    border: '1px solid #b45309',
  },
  legendHiddenSwatch: {
    display: 'inline-block',
    width: '14px',
    textAlign: 'center',
    color: '#9ca3af',
  },
};
