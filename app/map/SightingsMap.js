// app/map/SightingsMap.js
// ---------------------------------------------------------------------------
// The actual Leaflet map for /map. Only ever loaded client-side (see the
// dynamic import in MapView.js) since Leaflet touches `window`.
//
// Precise sightings render as a marker with a popup (species, date,
// location). Approximate sightings render as an unclickable shaded circle
// only — no popup — so no identifying detail is attached to the fuzzed area.
// ---------------------------------------------------------------------------

'use client';

import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default Leaflet marker icons reference relative paths that break under
// bundlers; point them at the copies in /public/leaflet instead.
const markerIcon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const APPROXIMATE_RADIUS_METERS = 8000;

function formatDate(dateStr) {
  if (!dateStr) return null;
  // Parse as local date to avoid UTC off-by-one shifts on date-only strings.
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function SightingsMap({ pins, circles, center, zoom }) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {pins.map((bird) => (
        <Marker key={bird.id} position={[bird.lat, bird.lng]} icon={markerIcon}>
          <Popup>
            <strong>{bird.common_name}</strong>
            {formatDate(bird.date_first_seen) && <><br />{formatDate(bird.date_first_seen)}</>}
            {bird.location && <><br />{bird.location}</>}
          </Popup>
        </Marker>
      ))}

      {circles.map((bird) => (
        <Circle
          key={bird.id}
          center={[bird.lat, bird.lng]}
          radius={APPROXIMATE_RADIUS_METERS}
          pathOptions={{ color: '#b45309', fillColor: '#f59e0b', fillOpacity: 0.25, weight: 1 }}
        />
      ))}
    </MapContainer>
  );
}
