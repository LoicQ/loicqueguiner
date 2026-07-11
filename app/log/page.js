// app/log/page.js
// ---------------------------------------------------------------------------
// /log – Password-protected bird sighting entry form
//
// Designed for quick mobile use in the field.
//
// Flow:
//   1. User enters password → checked via POST /api/log { action: 'auth' }
//   2. On success, the sighting form appears.
//   3. Submitting the form calls POST /api/log { action: 'add', ... }
//   4. On success, the form resets and a confirmation is shown.
//
// The password is never stored permanently on the client – it lives only in
// React state for the lifetime of the page session.
// ---------------------------------------------------------------------------

'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';

// Leaflet touches `window` at import time, so the map must load client-side
// only — never during SSR.
const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => <div style={styles.mapLoading}>Loading map…</div>,
});

// ---------------------------------------------------------------------------
// Password gate
// ---------------------------------------------------------------------------

function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth', password }),
      });

      const data = await res.json();

      if (data.ok) {
        // Pass the password up so the add form can include it in writes.
        onUnlock(password);
      } else {
        setError('Incorrect password. Try again.');
        setPassword('');
      }
    } catch (err) {
      setError('Network error. Check your connection.');
      console.error('[PasswordGate]', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.centered}>
      <h1 style={styles.title}>Log a Sighting</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label} htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          placeholder="Enter log password"
          required
          autoFocus
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sighting form (shown after authentication)
// ---------------------------------------------------------------------------

// Dropdown options – update these lists if your DB uses different values.
const CATEGORY_OPTIONS = [
  'Passerine', 'Raptor', 'Vulture', 'Shorebird', 'Heron/Egret/Ibis',
  'Rail/Gallinule', 'Wildfowl', 'Seabird', 'Gamebird', 'Pigeon / Dove',
  'Owl', 'Kingfisher', 'Woodpecker', 'Hummingbird', 'Other',
];

const RARITY_OPTIONS = [
  'Common', 'Uncommon', 'Scarce', 'Rare', 'Very Rare', 'Mega',
];

const EMPTY_FORM = {
  common_name: '',
  scientific_name: '',
  family: '',
  category: '',
  rarity: '',
  location: '',
  lat: null,
  lng: null,
  date_first_seen: new Date().toISOString().split('T')[0], // default to today
  notes: '',
  sensitive: false,
};

function SightingForm({ password }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ---- Existing sightings (edit mode) ------------------------------------
  const [sightings, setSightings] = useState([]);
  const [sightingsStatus, setSightingsStatus] = useState('idle'); // 'idle' | 'loading' | 'loaded' | 'error'
  const [editingId, setEditingId] = useState(null); // null = creating a new sighting

  async function fetchSightings() {
    setSightingsStatus('loading');
    const { data, error } = await supabase
      .from('birds')
      .select('*')
      .order('date_first_seen', { ascending: false });

    if (error) {
      console.error('[fetchSightings]', error.message);
      setSightingsStatus('error');
      return;
    }

    setSightings(data ?? []);
    setSightingsStatus('loaded');
  }

  useEffect(() => {
    // Load the existing-sightings list once on mount for the edit picker below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSightings();
  }, []);

  function startEdit(bird) {
    setForm({
      common_name: bird.common_name ?? '',
      scientific_name: bird.scientific_name ?? '',
      family: bird.family ?? '',
      category: bird.category ?? '',
      rarity: bird.rarity ?? '',
      location: bird.location ?? '',
      lat: bird.lat ?? null,
      lng: bird.lng ?? null,
      date_first_seen: bird.date_first_seen ?? '',
      notes: bird.notes ?? '',
      sensitive: bird.sensitive ?? false,
    });
    setEditingId(bird.id);
    setStatus('idle');
    setErrorMsg('');
    setLookupStatus('idle');
    setLookupResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setStatus('idle');
    setErrorMsg('');
  }

  // ---- AI lookup state ---------------------------------------------------
  // lookupStatus: 'idle' | 'loading' | 'ready' | 'error'
  const [lookupStatus, setLookupStatus] = useState('idle');
  const [lookupResult, setLookupResult] = useState(null); // { scientific_name, family }
  const [lookupError, setLookupError] = useState('');

  async function handleLookup() {
    const name = form.common_name.trim();
    if (!name) return;

    setLookupStatus('loading');
    setLookupResult(null);
    setLookupError('');

    try {
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ common_name: name }),
      });

      const data = await res.json();

      if (data.ok) {
        setLookupResult(data);
        setLookupStatus('ready');
      } else {
        setLookupError(data.error ?? 'Lookup failed.');
        setLookupStatus('error');
      }
    } catch (err) {
      setLookupError('Network error during lookup.');
      setLookupStatus('error');
      console.error('[handleLookup]', err);
    }
  }

  // Accept the AI suggestion: fill scientific_name and/or family if not blank.
  function acceptLookup() {
    setForm((prev) => ({
      ...prev,
      scientific_name: lookupResult.scientific_name ?? prev.scientific_name,
      family: lookupResult.family ?? prev.family,
    }));
    setLookupStatus('idle');
    setLookupResult(null);
  }

  function dismissLookup() {
    setLookupStatus('idle');
    setLookupResult(null);
  }
  // ------------------------------------------------------------------------

  function handleChange(e) {
    // If the user edits the common name after a successful lookup, reset it.
    if (e.target.name === 'common_name' && lookupStatus !== 'idle') {
      setLookupStatus('idle');
      setLookupResult(null);
    }
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleLocationPick(lat, lng) {
    setForm((prev) => ({ ...prev, lat, lng }));
  }

  function handleSensitiveChange(e) {
    setForm((prev) => ({ ...prev, sensitive: e.target.checked }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    const isEditing = Boolean(editingId);
    const payload = isEditing
      ? { action: 'update', password, id: editingId, bird: form }
      : { action: 'add', password, bird: form };

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.ok) {
        setStatus('success');
        setSuccessMessage(isEditing ? 'Sighting updated!' : 'Sighting saved! Add another below.');
        // Reset form for the next sighting, keeping today's date.
        setForm(EMPTY_FORM);
        setEditingId(null);
        fetchSightings();
      } else {
        setStatus('error');
        setErrorMsg(data.error ?? 'Unknown error from server.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Network error. Check your connection.');
      console.error('[SightingForm]', err);
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{editingId ? 'Edit Sighting' : 'New Sighting'}</h1>
      <a href="/" style={styles.backLink}>← Compendium</a>

      <section style={styles.sightingsSection}>
        <h2 style={styles.sightingsHeading}>Existing Sightings</h2>
        {sightingsStatus === 'loading' && (
          <p style={styles.sightingsHint}>Loading…</p>
        )}
        {sightingsStatus === 'error' && (
          <p style={styles.lookupErrorMsg}>⚠ Could not load existing sightings.</p>
        )}
        {sightingsStatus === 'loaded' && sightings.length === 0 && (
          <p style={styles.sightingsHint}>No sightings yet.</p>
        )}
        {sightings.length > 0 && (
          <ul style={styles.sightingsList}>
            {sightings.map((bird) => (
              <li
                key={bird.id}
                style={{
                  ...styles.sightingRow,
                  ...(bird.id === editingId ? styles.sightingRowActive : {}),
                }}
              >
                <div style={styles.sightingInfo}>
                  <span style={styles.sightingName}>{bird.common_name}</span>
                  <span style={styles.sightingMeta}>
                    {bird.date_first_seen ?? '—'}
                    {bird.location ? ` · ${bird.location}` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(bird)}
                  style={styles.editButton}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {status === 'success' && (
        <div style={styles.successBanner}>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Required */}
        <label style={styles.label} htmlFor="common_name">
          Common name <span style={styles.required}>*</span>
        </label>
        {/* Row: text input + AI look-up button */}
        <div style={styles.lookupRow}>
          <input
            id="common_name"
            name="common_name"
            type="text"
            value={form.common_name}
            onChange={handleChange}
            style={{ ...styles.input, flex: 1, marginBottom: 0 }}
            placeholder="e.g. Black-capped Chickadee"
            required
            autoFocus
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={!form.common_name.trim() || lookupStatus === 'loading'}
            style={{
              ...styles.lookupButton,
              opacity: !form.common_name.trim() ? 0.5 : 1,
            }}
            title="Use AI to fill in scientific name and family"
          >
            {lookupStatus === 'loading' ? '…' : '🔍 Look up'}
          </button>
        </div>

        {/* AI lookup preview */}
        {lookupStatus === 'ready' && lookupResult && (
          <div style={styles.lookupPreview}>
            <p style={styles.lookupPreviewTitle}>AI suggestion</p>
            {lookupResult.scientific_name && (
              <p style={styles.lookupPreviewLine}>
                <strong>Scientific:</strong> <em>{lookupResult.scientific_name}</em>
              </p>
            )}
            {lookupResult.family && (
              <p style={styles.lookupPreviewLine}>
                <strong>Family:</strong> {lookupResult.family}
              </p>
            )}
            {!lookupResult.scientific_name && !lookupResult.family && (
              <p style={styles.lookupPreviewLine}>Species not recognised.</p>
            )}
            <div style={styles.lookupActions}>
              <button type="button" onClick={acceptLookup} style={styles.acceptButton}>
                Accept
              </button>
              <button type="button" onClick={dismissLookup} style={styles.dismissButton}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {lookupStatus === 'error' && (
          <p style={styles.lookupErrorMsg}>⚠ {lookupError}</p>
        )}

        {/* Optional fields */}
        <label style={styles.label} htmlFor="scientific_name">
          Scientific name
        </label>
        <input
          id="scientific_name"
          name="scientific_name"
          type="text"
          value={form.scientific_name}
          onChange={handleChange}
          style={styles.input}
          placeholder="e.g. Poecile atricapillus"
        />

        <label style={styles.label} htmlFor="family">
          Family
        </label>
        <input
          id="family"
          name="family"
          type="text"
          value={form.family}
          onChange={handleChange}
          style={styles.input}
          placeholder="e.g. Paridae"
        />

        <label style={styles.label} htmlFor="category">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">— select —</option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <label style={styles.label} htmlFor="rarity">
          Rarity
        </label>
        <select
          id="rarity"
          name="rarity"
          value={form.rarity}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">— select —</option>
          {RARITY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <label style={styles.label} htmlFor="date_first_seen">
          Date first seen
        </label>
        <input
          id="date_first_seen"
          name="date_first_seen"
          type="date"
          value={form.date_first_seen}
          onChange={handleChange}
          style={styles.input}
        />

        <label style={styles.label} htmlFor="location">
          Location
        </label>
        <input
          id="location"
          name="location"
          type="text"
          value={form.location}
          onChange={handleChange}
          style={styles.input}
          placeholder="e.g. Central Park, NY"
        />

        <label style={styles.label}>Pin location on map</label>
        <LocationPicker
          key={editingId ?? 'new'}
          lat={form.lat}
          lng={form.lng}
          onChange={handleLocationPick}
        />
        <input type="hidden" name="lat" value={form.lat ?? ''} readOnly />
        <input type="hidden" name="lng" value={form.lng ?? ''} readOnly />

        <div style={styles.checkboxRow}>
          <input
            id="sensitive"
            name="sensitive"
            type="checkbox"
            checked={form.sensitive}
            onChange={handleSensitiveChange}
            style={styles.checkbox}
          />
          <label style={styles.checkboxLabel} htmlFor="sensitive">
            Sensitive location — omit from public map
          </label>
        </div>
        <p style={styles.checkboxHelp}>
          Use for owls, raptor nests, or any species/site vulnerable to
          disturbance if the location is shared.
        </p>

        <label style={styles.label} htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          style={{ ...styles.input, ...styles.textarea }}
          placeholder="Behaviour, plumage, conditions…"
          rows={4}
        />

        {status === 'error' && (
          <p style={styles.error}>{errorMsg}</p>
        )}

        <div style={styles.formActions}>
          <button
            type="submit"
            style={{ ...styles.button, marginTop: 0 }}
            disabled={status === 'saving'}
          >
            {status === 'saving' ? 'Saving…' : editingId ? 'Save Changes' : 'Save Sighting'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} style={styles.cancelEditButton}>
              Cancel edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page – orchestrates gate → form
// ---------------------------------------------------------------------------

export default function LogPage() {
  // null = not yet authenticated; string = the verified password
  const [password, setPassword] = useState(null);

  if (password === null) {
    return <PasswordGate onUnlock={(pw) => setPassword(pw)} />;
  }

  return <SightingForm password={password} />;
}

// ---------------------------------------------------------------------------
// Inline styles (mobile-first, easy to read and debug)
// ---------------------------------------------------------------------------

const styles = {
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1.5rem',
    fontFamily: 'Arial, sans-serif',
  },
  container: {
    maxWidth: '480px',
    margin: '0 auto',
    padding: '1.5rem 1rem 3rem',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    fontSize: '1.6rem',
    color: '#1b4332',
    marginBottom: '0.25rem',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: '1.25rem',
    fontSize: '0.85rem',
    color: '#40916c',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    width: '100%',
    maxWidth: '400px',
  },
  label: {
    marginTop: '0.75rem',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#374151',
  },
  required: {
    color: '#dc2626',
  },
  input: {
    padding: '0.6rem 0.75rem',
    fontSize: '1rem',        // 16 px avoids iOS auto-zoom
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    width: '100%',
    background: '#fff',
    color: '#111',
  },
  textarea: {
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  checkbox: {
    marginTop: '0.2rem',
    flexShrink: 0,
    width: '16px',
    height: '16px',
  },
  checkboxLabel: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#374151',
  },
  checkboxHelp: {
    marginTop: '0.25rem',
    marginLeft: '1.5rem',
    fontSize: '0.78rem',
    color: '#6b7280',
    lineHeight: 1.4,
  },
  mapLoading: {
    height: '220px',
    width: '100%',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: '0.85rem',
    background: '#f9fafb',
  },

  // -- Existing sightings / edit mode --------------------------------------
  sightingsSection: {
    marginBottom: '1.5rem',
  },
  sightingsHeading: {
    fontSize: '1rem',
    color: '#1b4332',
    marginBottom: '0.5rem',
  },
  sightingsHint: {
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  sightingsList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    maxHeight: '260px',
    overflowY: 'auto',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '0.5rem',
  },
  sightingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.5rem',
    borderRadius: '5px',
  },
  sightingRowActive: {
    background: '#eff6ff',
  },
  sightingInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  sightingName: {
    fontWeight: 'bold',
    color: '#1b4332',
    fontSize: '0.9rem',
  },
  sightingMeta: {
    color: '#6b7280',
    fontSize: '0.8rem',
  },
  editButton: {
    flexShrink: 0,
    padding: '0.3rem 0.75rem',
    fontSize: '0.8rem',
    background: '#1d4ed8',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  formActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1.25rem',
  },
  cancelEditButton: {
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    background: 'none',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  button: {
    marginTop: '1.25rem',
    padding: '0.75rem',
    fontSize: '1rem',
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  error: {
    color: '#dc2626',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
  },
  successBanner: {
    background: '#d1fae5',
    border: '1px solid #6ee7b7',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    color: '#065f46',
    fontSize: '0.9rem',
  },

  // -- AI lookup -----------------------------------------------------------
  lookupRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  lookupButton: {
    flexShrink: 0,
    padding: '0.6rem 0.75rem',
    fontSize: '0.85rem',
    background: '#1d4ed8',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  lookupPreview: {
    marginTop: '0.5rem',
    padding: '0.75rem 1rem',
    background: '#eff6ff',
    border: '1px solid #93c5fd',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#1e3a5f',
  },
  lookupPreviewTitle: {
    fontWeight: 'bold',
    marginBottom: '0.35rem',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#1d4ed8',
  },
  lookupPreviewLine: {
    margin: '0.2rem 0',
  },
  lookupActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.6rem',
  },
  acceptButton: {
    padding: '0.35rem 0.8rem',
    fontSize: '0.85rem',
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  dismissButton: {
    padding: '0.35rem 0.8rem',
    fontSize: '0.85rem',
    background: 'none',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  lookupErrorMsg: {
    marginTop: '0.4rem',
    fontSize: '0.82rem',
    color: '#b91c1c',
  },
};
