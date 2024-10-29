// pages/index.tsx
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map components with no SSR
const MapWithNoSSR = dynamic(
  () => import('../components/Map'),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
  }
);

interface Event {
  title: string;
  description: string;
  type: 'garage-sale' | 'halloween';
  lat: number | null;
  lng: number | null;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState<Event>({
    title: '',
    description: '',
    type: 'garage-sale',
    lat: null,
    lng: null,
  });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const handleMapClick = (lat: number, lng: number) => {
    if (showForm) {
      setNewEvent(prev => ({
        ...prev,
        lat,
        lng
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.lat || !newEvent.lng) {
      setError('Please click on the map to set a location');
      return;
    }
    if (!newEvent.title) {
      setError('Please enter a title');
      return;
    }

    setEvents([...events, newEvent]);
    setNewEvent({
      title: '',
      description: '',
      type: 'garage-sale',
      lat: null,
      lng: null,
    });
    setShowForm(false);
    setError('');
  };

  return (
    <div className="h-screen w-full relative">
      {/* Form container with higher z-index and absolute positioning */}
      <div className={`absolute top-20 left-4 z-20 w-80 ${showForm ? '' : ''}`}>
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Community Events Map</h2>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="w-full mb-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            {showForm ? 'Cancel' : 'Add New Event'}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Event Title"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({...prev, title: e.target.value}))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({...prev, description: e.target.value}))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent(prev => ({...prev, type: e.target.value as 'garage-sale' | 'halloween'}))} 
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="garage-sale">Garage Sale</option>
                <option value="halloween">Halloween Event</option>
              </select>
              
              {newEvent.lat && newEvent.lng && (
                <div className="text-sm text-gray-500">
                  Location selected: ({newEvent.lat.toFixed(4)}, {newEvent.lng.toFixed(4)})
                </div>
              )}
              
              <button 
                type="submit" 
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
              >
                Add Event
              </button>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Map container with restricted height */}
      <div className="h-[calc(100vh-100px)] w-full relative z-10">
        <MapWithNoSSR events={events} onMapClick={handleMapClick} />
      </div>
    </div>
  );
}
