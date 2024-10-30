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
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<Omit<Event, 'lat' | 'lng'> | null>(null);

  const handleFormSubmit = (formData: FormData) => {
    // Save form data and wait for map click
    setPendingEvent({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
    });
    setShowForm(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (pendingEvent) {
      // Add the event with the clicked location
      setEvents([...events, { ...pendingEvent, lat, lng }]);
      setPendingEvent(null);
    }
  };

  const handleRemoveEvent = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index);
    setEvents(newEvents);
  };

  return (
    <div className="h-screen w-full relative">
      {/* Instructions when pending event */}
      {pendingEvent && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Click on the map to place your event
        </div>
      )}

      {/* Add Event Button - make sure z-index is high enough */}
      <button 
        onClick={() => setShowForm(true)}
        className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600"
      >
        Add Event
      </button>

      {/* Map container */}
      <div className="h-[calc(100vh-100px)] w-full relative z-10">
        <MapWithNoSSR 
          events={events} 
          onMapClick={handleMapClick}
          onRemoveEvent={handleRemoveEvent} 
          isPendingEvent={!!pendingEvent}
        />
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Event</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleFormSubmit(new FormData(e.currentTarget));
            }}>
              <input
                name="title"
                placeholder="Event Title"
                required
                className="block w-full mb-3 p-2 border rounded"
              />
              <textarea
                name="description"
                placeholder="Description"
                required
                className="block w-full mb-3 p-2 border rounded"
              />
              <select
                name="type"
                required
                className="block w-full mb-3 p-2 border rounded"
              >
                <option value="">Select Event Type</option>
                <option value="Halloween">Halloween</option>
                <option value="Garage Sale">Garage Sale</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
