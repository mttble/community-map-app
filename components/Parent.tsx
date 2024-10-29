import React from 'react';
import Map from './Map'; // Adjust the import path as necessary

const ParentComponent = () => {
  const events = [
    { title: "Event 1", description: "Description 1", type: "Type 1", lat: -34.88, lng: 138.56 },
    // Add more events as necessary
  ];

  const handleMapClick = (lat: number, lng: number) => {
    console.log(`Map clicked at: ${lat}, ${lng}`);
    // Handle the click event here (e.g., update state, create a marker, etc.)
  };

  return (
    <div style={{ height: '100vh' }}>
      <Map events={events} onMapClick={handleMapClick} />
    </div>
  );
};

export default ParentComponent;
