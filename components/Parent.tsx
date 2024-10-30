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
    <div style={{ 
      height: '100dvh',
      width: '100%',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      <Map events={events} onMapClick={handleMapClick} />
    </div>
  );
};

export default ParentComponent;
