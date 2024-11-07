import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { Event } from '../types';
import { useUser } from '@supabase/auth-helpers-react';

// Define multiple icons for different event types
const icons = {
  default: L.icon({
    iconUrl: '/marker.png',
    iconRetinaUrl: '/markerbig.png',
    shadowUrl: '/shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  }),
  halloween: L.icon({
    iconUrl: '/halloween-marker.png',
    iconRetinaUrl: '/halloween-marker.png',
    iconSize: [55, 45],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  garageSale: L.icon({
    iconUrl: '/garage-sale-marker.png',
    iconRetinaUrl: '/garage-sale-marker.png',
    shadowUrl: '/shadow.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowSize: [41, 41]
  }),
  business: L.icon({
    iconUrl: '/business-marker.png',
    iconRetinaUrl: '/business-marker.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  plants: L.icon({
    iconUrl: '/plants-marker.png',
    iconRetinaUrl: '/plants-marker.png',
    iconSize: [32, 40],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  produce: L.icon({
    iconUrl: '/produce-marker.png',
    iconRetinaUrl: '/produce-marker.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
};

// Helper function to get the appropriate icon
const getEventIcon = (eventType?: string) => {
  console.log('Event type received:', eventType);
  
  switch (eventType?.toLowerCase()) {
    case 'halloween':
      return icons.halloween;
    case 'garage sale':
      return icons.garageSale;
    case 'business':
      return icons.business;
    case 'plants':
      return icons.plants;
    case 'produce':
      return icons.produce;
    default:
      console.log('Using default icon for type:', eventType);
      return icons.default;
  }
};

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
      icon={icons.default}
      opacity={0.5}
    >
      <Popup>Click to place event here</Popup>
    </Marker>
  ) : null;
}

interface MapProps {
  events: Event[];
  onMapClick: (lat: number, lng: number) => void;
  onRemoveEvent: (id: string) => Promise<void>;
  isPendingEvent: boolean;
  createPopupContent: (event: Event) => React.ReactNode;
  children?: React.ReactNode;
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
    <Marker position={position} icon={icons.default}>
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

/* eslint-disable @typescript-eslint/no-unused-vars */
export default function Map({ 
  events, 
  onMapClick, 
  onRemoveEvent,  // Used in createPopupContent
  isPendingEvent, 
  createPopupContent, 
  children 
}: MapProps) {
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

  const user = useUser();
  const isAuthenticated = !!user;

  useEffect(() => {
    console.log('Current user:', user);
    console.log('Is guest:', isAuthenticated);
  }, [user, isAuthenticated]);

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
      attributionControl={false}
      zoomControl={false}
    >
      <CoordinatesDisplay />
      <Polyline positions={boundaryCoords} pathOptions={boundaryStyle} />
      {isPendingEvent && <MapEvents onClick={onMapClick} />}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        className="custom-attribution"
      />
      <AttributionControl
        position="bottomright"
        prefix={false}
      />
      {events.map((event, index) => (
        <Marker 
          key={event.id || index}
          position={[event.lat, event.lng]}
          icon={getEventIcon(event.type)}
        >
          <Popup>
            {createPopupContent(event)}
          </Popup>
        </Marker>
      ))}
      <LocationMarker />
      <BookExchangeMarker />
      {children}
    </MapContainer>
  );
}
/* eslint-enable @typescript-eslint/no-unused-vars */
