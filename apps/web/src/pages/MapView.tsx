import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { GlassCard } from '../components/GlassCard';
import L from 'leaflet';
import './MapView.css';

// Fix Leaflet marker icons not showing up in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface Manhole {
  id: string;
  code: string;
  utility_type: string;
  status: string;
  lat: number;
  lng: number;
  photo_url?: string;
}

export function MapView() {
  const [manholes, setManholes] = useState<Manhole[]>([]);

  useEffect(() => {
    // Note: Backend might need to return lat/lng directly without GIS formatting
    api.get('/manholes/nearby?lat=0&lng=0&radius=999999999').then(res => {
      setManholes(res.data);
    }).catch(console.error);
  }, []);

  return (
    <div className="map-view-container">
      <header className="page-header">
        <div>
          <h1>Global Map View</h1>
          <p>Visualize all manholes geographically.</p>
        </div>
      </header>
      
      <GlassCard className="map-card">
        <MapContainer center={[51.505, -0.09]} zoom={13} className="leaflet-map">
          {/* Using a dark themed tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {manholes.map(m => {
            if (!m.lat || !m.lng) return null;
            return (
              <Marker key={m.id} position={[m.lat, m.lng]}>
                <Popup>
                  <div className="map-popup">
                    <h3>{m.code}</h3>
                    <p>Type: {m.utility_type}</p>
                    <p>Status: <span className={`status-${m.status}`}>{m.status}</span></p>
                    {m.photo_url && <img src={m.photo_url} alt="manhole" className="popup-img" />}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </GlassCard>
    </div>
  );
}
