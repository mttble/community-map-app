import React, { useState } from 'react';
import Map from './Map';

interface Event {
  title: string;
  description: string;
  type: string;
  lat: number;
  lng: number;
}

const ParentComponent = () => {
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
    <div className="h-[calc(100vh-100px)] w-full relative z-10">
      <Map events={events} onMapClick={handleMapClick} />
    </div>
  );
};

export default ParentComponent;
