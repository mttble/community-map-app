// pages/index.tsx
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Event } from '../types';

// Dynamically import the map components with no SSR
const MapWithNoSSR = dynamic(
  () => import('../components/Map'),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
  }
);

export default function Home() {
  const [events, setEvents] = useState<Event[]>([
    { 
      title: "Event 1", 
      description: "Description 1", 
      type: "Type 1", 
      lat: -34.88, 
      lng: 138.56 
    }
  ]);

  const handleMapClick = (lat: number, lng: number) => {
    const newEvent: Event = {
      title: `Event ${events.length + 1}`,
      description: "New event description",
      type: "New Event",
      lat: lat,
      lng: lng
    };
    setEvents([...events, newEvent]);
  };

  return (
    <div className="h-screen w-full relative">
      {/* Map container with restricted height */}
      <div className="h-[calc(100vh-100px)] w-full relative z-10">
        <MapWithNoSSR events={events} onMapClick={handleMapClick} />
      </div>
    </div>
  );
}
