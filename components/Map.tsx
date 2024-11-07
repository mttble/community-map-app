import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { Event } from '../types';

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

const icon2 = L.icon({
  iconUrl: '/location.png',
  iconRetinaUrl: '/location.png',
  iconSize: [64, 64],
  iconAnchor: [32, 32],
  popupAnchor: [0, -32],
  className: 'pulse'
});


interface MapEventsProps {
  onClick: (lat: number, lng: number) => void;
}

function MapEvents({ onClick }: MapEventsProps) {
  const [mousePosition, setMousePosition] = useState<L.LatLng | null>(null);
  
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
    mousemove: (e) => {
      setMousePosition(e.latlng);
    },
  });

  return mousePosition ? (
    <Marker 
      position={mousePosition} 
      icon={icon}
      opacity={0.5}
    >
      <Popup>Click to place event here</Popup>
    </Marker>
  ) : null;
}

interface MapProps {
  events: Event[];
  onMapClick: (lat: number, lng: number) => void;
  onRemoveEvent: (index: number) => void;
  isPendingEvent: boolean;
}

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate({
      watch: true,
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });

    map.on('locationfound', (e) => {
      setPosition(e.latlng);
      // Removed the map.flyTo() to stop auto-centering
    });

    return () => {
      map.stopLocate();
    };
  }, [map]);

  return position === null ? null : (
    <Marker position={position} icon={icon2}>
      <Popup>You are here!</Popup>
    </Marker>
  );
}

function CoordinatesDisplay() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  useMapEvents({
    click: (e) => {
      setPosition(e.latlng);
    }
  });

  if (!position) return (
    <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded-md shadow-md z-[1000]">
      Click map to get coordinates
    </div>
  );

  const coordString = `[${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}]`;

  return (
    <div 
      className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded-md shadow-md z-[1000]"
      style={{ pointerEvents: 'auto' }}
    >
      📍 {coordString}
    </div>
  );
}

function BookExchangeMarker() {
  const [iconSize, setIconSize] = useState(20);
  
  useMapEvents({
    zoom: (e) => {
      const zoom = e.target.getZoom();
      if (zoom <= 13) {
        setIconSize(32);      // Very zoomed out
      } else if (zoom <= 14) {
        setIconSize(28);      // Zoomed out
      } else if (zoom <= 15) {
        setIconSize(24);      // Medium-far
      } else if (zoom <= 16) {
        setIconSize(20);      // Medium
      } else if (zoom <= 17) {
        setIconSize(18);      // Medium-close
      } else {
        setIconSize(32);      // Very zoomed in
      }
    }
  });

  const dynamicBookExchangeIcon = L.icon({
    iconUrl: '/bookexchange.png',
    iconRetinaUrl: '/bookexchange.png',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize/2, iconSize],
    popupAnchor: [0, -iconSize],
  });

  return (
    <Marker 
      position={[-34.8901, 138.5579]} 
      icon={dynamicBookExchangeIcon}
    >
      <Popup>
        <div>
          <h3 className="font-bold">Community Book Exchange</h3>
          <p>Free book exchange - take a book, leave a book!</p>
        </div>
      </Popup>
    </Marker>
  );
}

export default function Map({ events, onMapClick, onRemoveEvent, isPendingEvent }: MapProps) {
  const centerPoint: [number, number] = [-34.888, 138.5597];
  const bounds: L.LatLngBoundsExpression = [
    [-34.905, 138.54],   // Southwest corner
    [-34.87, 138.58]     // Northeast corner
  ];

  // Define the boundary coordinates following the roads
  const boundaryCoords: L.LatLngExpression[] = [
    [-34.9013, 138.5664], // South Road & Port Road intersection
    [-34.8884, 138.5700], // South Road & Torrens Road intersection
    [-34.8767, 138.5508], // Torrens Road & Kilkenny Road intersection
    [-34.8891, 138.5482], // Kilkenny Road & Port Road intersection
    [-34.9013, 138.5664], // Back to start to complete the shape
  ];

  const boundaryStyle = {
    color: '#dc2626', // red-600
    weight: 3,
    opacity: 0.8,
  };

  const [zoom, setZoom] = useState(14.4);
  const [minZoom, setMinZoom] = useState(14.4);

  useEffect(() => {
    // Function to update zoom based on screen width
    const updateZoom = () => {
      if (window.innerWidth <= 768) { // Mobile breakpoint
        setZoom(12);  // Much more zoomed out for mobile
        setMinZoom(12);
      } else {
        setZoom(14.4);  // Original zoom for desktop
        setMinZoom(14.4);
      }
    };

    // Set initial zoom
    updateZoom();

    // Update zoom when window is resized
    window.addEventListener('resize', updateZoom);

    // Cleanup
    return () => window.removeEventListener('resize', updateZoom);
  }, []);

  return (
    <MapContainer
      center={centerPoint}
      zoom={zoom}
      style={{ 
        height: '100%', 
        width: '100%', 
        display: 'block',
        position: 'absolute'
      }}
      className="rounded-md shadow-lg"
      maxZoom={18}
      minZoom={minZoom}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      dragging={true}
      doubleClickZoom={false}
      scrollWheelZoom={true}
      attributionControl={true}
      zoomControl={true}
    >
      <CoordinatesDisplay />
      <Polyline positions={boundaryCoords} pathOptions={boundaryStyle} />
      {isPendingEvent && <MapEvents onClick={onMapClick} />}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
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
              <button
                onClick={() => onRemoveEvent(index)}
                className="mt-2 px-2 py-1 bg-red-500 text-white rounded text-sm"
              >
                Remove Event
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      <LocationMarker />
      <BookExchangeMarker />
    </MapContainer>
  );
}
