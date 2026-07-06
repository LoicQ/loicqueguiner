// app/log/LocationPicker.js
// ---------------------------------------------------------------------------
// Small embedded Leaflet map used by the /log form to let the user drop a
// pin for the sighting's coordinates. Loaded client-side only (see the
// dynamic import with ssr:false in page.js) since Leaflet touches `window`.
// ---------------------------------------------------------------------------

'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

// Plattsburgh, NY
const DEFAULT_CENTER = [44.6995, -73.4529];
const DEFAULT_ZOOM = 12;

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, onChange }) {
  const position = lat != null && lng != null ? [lat, lng] : null;
  const center = position ?? DEFAULT_CENTER;

  return (
    <div
      style={{
        height: '220px',
        width: '100%',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid #d1d5db',
      }}
    >
      <MapContainer center={center} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        {position && <Marker position={position} icon={markerIcon} />}
      </MapContainer>
    </div>
  );
}
