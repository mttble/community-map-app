// pages/index.tsx
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Event } from '../types';
import InstallPWA from '../components/InstallPWA';


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
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<Omit<Event, 'lat' | 'lng'> | null>(null);
  const [showBinCalendar, setShowBinCalendar] = useState(false);

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

  // Add this function to determine current bin color
  const getCurrentBinColor = () => {
    const today = new Date();
    // Starting from a known week (e.g., May 6, 2024 is yellow)
    const startDate = new Date(2024, 4, 6); // May 6, 2024
    const weeksDiff = Math.floor((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return weeksDiff % 2 === 0 ? 'yellow' : 'green';
  };

  return (
    <div className="h-screen w-full relative">
      {/* Instructions when pending event */}
      {pendingEvent && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Click on the map to place your event
        </div>
      )}

      {/* Updated Buttons Container */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={() => setShowNewsletter(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-600"
        >
          Newsletter
        </button>
        <button 
          onClick={() => setShowBinCalendar(true)}
          className={`${
            getCurrentBinColor() === 'yellow' 
              ? 'bg-yellow-500 hover:bg-yellow-600' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white px-4 py-2 rounded-lg shadow-lg`}
        >
          📅 Bin Calendar
        </button>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600"
        >
          Add Event
        </button>
      </div>

      {/* Map container */}
      <div className="h-[calc(100vh-100px)] w-full relative z-10">
        <MapWithNoSSR 
          events={events} 
          onMapClick={handleMapClick}
          onRemoveEvent={handleRemoveEvent} 
          isPendingEvent={!!pendingEvent}
        />
      </div>

      {/* Newsletter Modal */}
      {showNewsletter && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewsletter(false);
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Community Newsletter</h2>
              <button 
                onClick={() => setShowNewsletter(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* PDF/Document Viewer */}
            <div className="aspect-[8.5/11] w-full bg-gray-50 rounded-lg">
              <object
                data="/testdoc.pdf"
                type="application/pdf"
                className="w-full h-full rounded-lg"
              >
                <iframe
                  src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(window.location.origin + '/testdoc.pdf')}`}
                  className="w-full h-full rounded-lg"
                  title="Community Newsletter"
                />
              </object>
            </div>
            
            {/* Optional: Download button */}
            <div className="mt-4 flex justify-end">
              <a 
                href="/testdoc.pdf" 
                download="community-newsletter.pdf"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Download Newsletter
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
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

      {/* Bin Calendar Modal */}
      {showBinCalendar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBinCalendar(false);
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Bin Collection Calendar</h2>
              <button 
                onClick={() => setShowBinCalendar(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* PDF/Document Viewer */}
            <div className="aspect-[8.5/11] w-full bg-gray-50 rounded-lg">
              <object
                data="/binweek.pdf"
                type="application/pdf"
                className="w-full h-full rounded-lg"
              >
                <iframe
                  src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(window.location.origin + '/binweek.pdf')}`}
                  className="w-full h-full rounded-lg"
                  title="Bin Collection Calendar"
                />
              </object>
            </div>
            
            {/* Download button */}
            <div className="mt-4 flex justify-end">
              <a 
                href="/binweek.pdf" 
                download="bin-collection-calendar.pdf"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Download Calendar
              </a>
            </div>
          </div>
        </div>
      )}
      <InstallPWA />
    </div>
  );
}
