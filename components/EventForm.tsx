import React from 'react';
import { Event } from '../types';

interface EventFormProps {
  coordinates: [number, number];
  onSubmit: (event: Event) => void;
  onClose: () => void;
}

export default function EventForm({ coordinates, onSubmit, onClose }: EventFormProps) {
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newEvent: Event = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      lat: coordinates[0],
      lng: coordinates[1]
    };

    await onSubmit(newEvent);
    onClose();
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <input
        name="title"
        type="text"
        placeholder="Event Title"
        required
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        name="description"
        type="text"
        placeholder="Description"
        className="w-full p-2 mb-2 border rounded"
      />
      <select
        name="type"
        required
        className="w-full p-2 mb-4 border rounded"
      >
        <option value="">Select Type</option>
        <option value="event">Event</option>
        <option value="alert">Alert</option>
        <option value="info">Info</option>
      </select>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Add Event
        </button>
      </div>
    </form>
  );
} 