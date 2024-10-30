import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-rotate'; // Ensure this is imported
import { useRef, useState, useEffect } from 'react';

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

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate({
      watch: true,           // Keep watching location
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });

    map.on('locationfound', (e) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });

    return () => {
      map.stopLocate();
    };
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here!</Popup>
    </Marker>
  );
}

export default function Map({ events, onMapClick }: MapProps) {
  const centerPoint = [-34.888, 138.5597];
  const bounds: L.LatLngBoundsExpression = [
    [-34.905, 138.54],   // Southwest corner
    [-34.87, 138.58]     // Northeast corner
  ];

  return (
    <MapContainer
      center={centerPoint}
      zoom={18}
      style={{ 
        height: '100%', 
        width: '100%', 
        display: 'block',
        position: 'absolute'
      }}
      className="rounded-md shadow-lg"
      maxZoom={18}       // Maximum reliable zoom for OpenStreetMap
      minZoom={16}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      dragging={true}
      doubleClickZoom={false}
      scrollWheelZoom={true}
      attributionControl={true}
      zoomControl={true}
    >
      <LocationMarker />
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
