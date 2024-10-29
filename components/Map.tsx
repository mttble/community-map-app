import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-rotate'; // Ensure this is imported
import { useRef } from 'react';

const icon = L.icon({
  iconUrl: '/marker.png',
  iconRetinaUrl: '/markerbig.png',
  shadowUrl: '/shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

interface MapEventsProps {
  onClick: (lat: number, lng: number) => void;
}

function MapEvents({ onClick }: MapEventsProps) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Event {
  title: string;
  description: string;
  type: string;
  lat: number;
  lng: number;
}

function RotateControl() {
  const map = useMap();

  const handleRotate = (angle: number) => {
    const currentRotation = map.getRotation() || 0; // Default to 0 if no rotation
    map.setRotation(currentRotation + angle); // Update rotation
  };

  return (
    <div>
      <button onClick={() => handleRotate(90)}>Rotate 90°</button>
      <button onClick={() => handleRotate(-90)}>Rotate -90°</button>
    </div>
  );
}

interface MapProps {
  events: Event[];
  onMapClick: (lat: number, lng: number) => void;
}

export default function Map({ events, onMapClick }: MapProps) {
  const bounds = [
    [-35.0, 138.0],
    [-34.5, 139.0],
  ];

  return (
    <MapContainer
      center={[-34.888, 138.5597]}
      zoom={20}
      style={{ height: '100%', width: '100%' }}
      className="rounded-md shadow-lg"
      maxZoom={17.5}
      minZoom={16}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
    >
      <RotateControl />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapEvents onClick={onMapClick} />
      {events.map((event, index) => (
        <Marker 
          key={index} 
          position={[event.lat, event.lng]}
          icon={icon}
        >
          <Popup>
            <div>
              <h3 className="font-bold">{event.title}</h3>
              <p>{event.description}</p>
              <p className="text-sm text-gray-500">Type: {event.type}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
