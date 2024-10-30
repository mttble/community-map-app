import React, { useState } from 'react';
import Map from './Map';
import { Event } from '../types';

const ParentComponent = () => {
  const [events, setEvents] = useState<Event[]>([
    { 
      title: "Halloween House", 
      description: "Trick or treating welcome!", 
      type: "Halloween", 
      lat: -34.88, 
      lng: 138.56 
    },
    { 
      title: "Garage Sale", 
      description: "Saturday 8am-2pm", 
      type: "Garage Sale", 
      lat: -34.885, 
      lng: 138.57 
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newEventLocation, setNewEventLocation] = useState<{lat: number, lng: number} | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    setNewEventLocation({ lat, lng });
    setShowForm(true);
  };

  const handleSubmitEvent = (eventData: { title: string; description: string; type: string }) => {
    if (newEventLocation) {
      const newEvent: Event = {
        ...eventData,
        lat: newEventLocation.lat,
        lng: newEventLocation.lng
      };
      setEvents([...events, newEvent]);
      setShowForm(false);
      setNewEventLocation(null);
    }
  };

  const handleRemoveEvent = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index);
    setEvents(newEvents);
  };

  return (
    <div>
      <div className="h-[calc(100vh-100px)] w-full relative z-10">
        <Map 
          events={events} 
          onMapClick={handleMapClick}
          onRemoveEvent={handleRemoveEvent}
          isPendingEvent={!!newEventLocation}
        />
      </div>

      {showForm && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg z-20">
          <h3>Add New Event</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmitEvent({
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              type: formData.get('type') as string
            });
          }}>
            <input
              name="title"
              placeholder="Event Title"
              className="block w-full mb-2 p-2 border rounded"
            />
            <textarea
              name="description"
              placeholder="Description"
              className="block w-full mb-2 p-2 border rounded"
            />
            <select
              name="type"
              className="block w-full mb-2 p-2 border rounded"
            >
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
                Add Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ParentComponent;
