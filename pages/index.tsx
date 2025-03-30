// pages/index.tsx
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Event, PendingEventData } from '../types/index';
import InstallPWA from '../components/InstallPWA';
import { supabase } from '../lib/supabase-client';
import ProtectedLayout from '../components/ProtectedLayout';
import SignOut from '../components/SignOut';
import { useUser } from '@supabase/auth-helpers-react';
import { getUserRole, canDeleteEvent, canCreateEvent, canEditEvent, AppRole } from '../lib/auth';


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
  const [showBinCalendar, setShowBinCalendar] = useState(false);
  const [pendingEventData, setPendingEventData] = useState<PendingEventData | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const user = useUser();
  const userRole = getUserRole(user);
  const canRoleCreate = canCreateEvent(user);
  const [userEventCount, setUserEventCount] = useState<number>(0);

  const showAddEventButton = canRoleCreate && (userRole !== 'user' || userEventCount < 3);

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();
    if (user && userRole === 'user') {
      fetchUserEventCount();
    } else {
      setUserEventCount(0);
    }

    // Set up real-time subscription
    const channel = supabase
      .channel('events-channel')
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen to all changes (insert, update, delete)
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('Change received!', payload);
          switch (payload.eventType) {
            case 'INSERT':
              setEvents(current => [...current, payload.new as Event]);
              break;
            case 'DELETE':
              setEvents(current => current.filter(event => event.id !== payload.old.id));
              break;
            case 'UPDATE':
              setEvents(current => 
                current.map(event => 
                  event.id === payload.new.id ? payload.new as Event : event
                )
              );
              break;
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*');
    
    if (error) {
      console.error('Error fetching events:', error);
      return;
    }
    
    if (data) {
      setEvents(data);
    }
  };

  const fetchUserEventCount = async () => {
    if (!user) return;
    const { count, error } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user event count:', error);
      setUserEventCount(0);
    } else {
      setUserEventCount(count ?? 0);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (pendingEventData && pendingEventData.title && pendingEventData.type) {
      console.log('Current user:', user);
      console.log('User ID:', user?.id);

      // Convert empty string date to null before saving
      const eventDateValue = pendingEventData.event_date === '' ? null : pendingEventData.event_date;
      const addressValue = pendingEventData.address === '' ? null : pendingEventData.address; // Handle optional address

      const newEvent: Event = {
        title: pendingEventData.title,
        description: pendingEventData.description,
        type: pendingEventData.type,
        lat,
        lng,
        address: addressValue,
        user_id: user?.id,
        event_date: eventDateValue
      };

      console.log('New event data:', newEvent);

      const { error, data } = await supabase
        .from('events')
        .insert([newEvent])
        .select();
      
      if (error) {
        console.error('Error adding event:', error);
        return;
      }
      
      console.log('Inserted event:', data);
      setPendingEventData(null);
      if (userRole === 'user') {
        fetchUserEventCount();
      }
    }
  };

  // Add this function to determine current bin color
  const getCurrentBinColor = () => {
    const today = new Date();
    // Starting from a known week (e.g., May 6, 2024 is yellow)
    const startDate = new Date(2024, 4, 6); // May 6, 2024
    const weeksDiff = Math.floor((today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return weeksDiff % 2 === 0 ? 'yellow' : 'green';
  };

  const handleFormSubmit = (formData: FormData) => {
    setPendingEventData({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      address: formData.get('address') as string, // Get address
      event_date: formData.get('event_date') as string
    });
    setShowForm(false); // Hide the form
    setEditingEvent(null); // Ensure editing state is cleared
  };

  // --- NEW Function to handle UPDATING an existing event ---
  const handleUpdateEvent = async (formData: FormData) => {
    if (!editingEvent || !editingEvent.id) return; // Should not happen if form is in edit mode

    // Convert empty string date to null before saving
    const eventDateValue = formData.get('event_date') as string;
    const addressValue = formData.get('address') as string; // Get address

    const updatedData: Partial<Event> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      address: addressValue === '' ? null : addressValue,
      event_date: eventDateValue === '' ? null : eventDateValue
    };

    const { error } = await supabase
      .from('events')
      .update(updatedData)
      .eq('id', editingEvent.id);

    if (error) {
      console.error('Error updating event:', error);
      // Optionally: show an error message to the user
    } else {
      console.log('Event updated successfully');
      // Close the form and clear editing state
      setShowForm(false);
      setEditingEvent(null);
      // Note: Real-time subscription should update the event list automatically
    }
  };

  // Function to open the form for editing
  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
    setPendingEventData(null); // Ensure we are not in pending placement mode
  };

  // Add this function to handle event removal
  const handleRemoveEvent = async (id: string) => {
    const eventToDelete = events.find(event => event.id === id);
    const wasOwnEvent = eventToDelete?.user_id === user?.id;

    try {
      console.log('Attempting to remove event:', id);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error removing event:', error);
      } else {
        if (userRole === 'user' && wasOwnEvent) {
          fetchUserEventCount();
        }
      }
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  // Add this function to filter events
  const filteredEvents = events.filter(event => {
    if (eventFilter === 'all') return true;
    return event.type?.toLowerCase() === eventFilter.toLowerCase();
  });

  // Helper function to format date
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Date not set';
    try {
      const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString; // Fallback to raw string
    }
  };

  // --- NEW Helper function to format timestamp --- 
  const formatTimestamp = (dateString: string | undefined | null): string => {
    if (!dateString) return ''; // Return empty if no timestamp
    try {
      const date = new Date(dateString);
      // Format for date and time
      return date.toLocaleString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: 'numeric', minute: '2-digit' 
      });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return dateString; // Fallback to raw string
    }
  };

  const createPopupContent = (event: Event): React.ReactNode => (
    <div>
      <h3 className="font-bold">{event.title}</h3>
      {event.event_date && (
        <p className="text-sm text-blue-600">{formatDate(event.event_date)}</p>
      )}
      {event.address && ( // Display address if available
        <p className="text-sm text-green-700"><span role="img" aria-label="address">📍</span> {event.address}</p>
      )}
      <p>{event.description}</p>
      <p className="text-sm text-gray-500">Type: {event.type}</p>
      
      {/* --- Display Timestamps --- */} 
      <div className="text-xs text-gray-400 mt-1">
        {event.created_at && ( 
          <span>Created: {formatTimestamp(event.created_at)}</span>
        )}
        {event.updated_at && event.created_at !== event.updated_at && ( // Show updated only if different from created
          <span className="ml-2">(Edited: {formatTimestamp(event.updated_at)})</span>
        )}
      </div>

      <div className="mt-2 flex gap-2"> {/* Container for buttons */}
        {/* Show Edit button if allowed */}
        {canEditEvent(user, event.user_id) && event.id && (
          <button
            onClick={() => handleEditClick(event)}
            className="bg-yellow-500 text-white px-2 py-1 rounded"
          >
            ✏️ Edit
          </button>
        )}

        {/* Show Delete button if allowed */}
        {canDeleteEvent(user, event.user_id) && event.id && (
          <button
            onClick={() => handleRemoveEvent(event.id!)}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            🗑️ {userRole === 'admin' || userRole === 'moderator' ? 'Moderator Remove' : 'Remove'}
          </button>
        )}
      </div>

      {/* Show role-specific messages */}
      {userRole === 'anonymous' && (
        <p className="text-sm text-gray-500 mt-2">
          Sign in with email or magic link to add or remove events
        </p>
      )}
    </div>
  );

  return (
    <div className="h-screen w-full relative">
      {/* --- Combined Button Area Logic --- */} 
      {!pendingEventData && userRole !== 'guest' && ( // Show for any logged-in user (anon, user, mod, admin)
        <div className="fixed top-4 right-4 z-50 flex gap-1 sm:gap-2">
          
          {/* Conditionally show AND ENABLE Add Event button */} 
          {canRoleCreate && (
            <button 
              onClick={() => setShowForm(true)}
              className={`bg-blue-500 text-white px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[42px] ${!showAddEventButton ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
              disabled={!showAddEventButton}
              title={userRole === 'user' && userEventCount >= 3 ? 'You have reached the maximum number of events (3)' : 'Add a new event'}
            >
              Add Event
            </button>
          )}

          {/* Conditionally show Newsletter button (e.g., for non-anonymous) */} 
          {userRole !== 'anonymous' && (
            <button 
              onClick={() => setShowNewsletter(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[42px]"
            >
              Newsletter
            </button>
          )}

          {/* Common controls for all logged-in users */} 
          <div className="flex flex-col gap-1 sm:gap-2">
            <button 
              onClick={() => setShowBinCalendar(true)}
              className={`${ 
                getCurrentBinColor() === 'yellow' 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[42px]`}
            >
              📅 Bin Calendar
            </button>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[42px]"
            >
              <option value="all">All Events</option>
              <option value="halloween">Halloween</option>
              <option value="garage sale">Garage Sales</option>
              <option value="business">Business</option>
              <option value="plants">Plants</option>
              <option value="produce">Produce</option>
            </select>
            {/* SignOut is needed for all logged-in types */} 
            <SignOut /> 
          </div>
          <InstallPWA />
        </div>
      )}

      {/* --- Controls for Guest Users (Logged Out) --- */}
      {!pendingEventData && userRole === 'guest' && ( 
        <div className="fixed top-4 right-4 z-50 flex gap-1 sm:gap-2">
          <div className="flex flex-col gap-1 sm:gap-2">
            <button 
              onClick={() => setShowBinCalendar(true)}
              className={`${ 
                getCurrentBinColor() === 'yellow' 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[42px]`}
            >
              📅 Bin Calendar
            </button>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[42px]"
            >
              <option value="all">All Events</option>
              <option value="halloween">Halloween</option>
              <option value="garage sale">Garage Sales</option>
              <option value="business">Business</option>
              <option value="plants">Plants</option>
              <option value="produce">Produce</option>
            </select>
          </div>
          <InstallPWA />
        </div>
      )}

      {/* Message with red cancel button when placing marker */}
      {pendingEventData && (
        <div className="fixed top-0 inset-x-0 z-50 flex justify-center">
          <div className="bg-blue-500 text-white px-8 py-4 rounded-b-lg shadow-xl text-lg font-bold flex items-center gap-4">
            <span>👆 Click anywhere on the map to place your event</span>
            <button 
              onClick={() => {
                setPendingEventData(null);
                setShowForm(false);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Map container */}
      <div className="h-[calc(100vh-100px)] w-full relative z-10">
        <MapWithNoSSR 
          events={filteredEvents} 
          onMapClick={handleMapClick}
          onRemoveEvent={handleRemoveEvent}
          isPendingEvent={!!pendingEventData}
          createPopupContent={createPopupContent as any}
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

      {/* --- MODIFIED Event Form Modal --- */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          onClick={(e) => {
            // Close only if clicking the backdrop
            if (e.target === e.currentTarget) {
              setShowForm(false);
              setEditingEvent(null); // Clear editing state on close
              setPendingEventData(null); // Clear pending state on close
            }
          }}
        >
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            {/* Dynamic Title */}
            <h2 className="text-xl font-bold mb-4">
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Call update or create based on mode
              if (editingEvent) {
                handleUpdateEvent(new FormData(e.currentTarget));
              } else {
                handleFormSubmit(new FormData(e.currentTarget));
              }
            }}>
              <input
                name="title"
                placeholder="Event Title"
                required
                // Pre-fill if editing
                defaultValue={editingEvent?.title || ''}
                className="block w-full mb-3 p-2 border rounded"
              />
              <textarea
                name="description"
                placeholder="Description"
                required
                // Pre-fill if editing
                defaultValue={editingEvent?.description || ''}
                className="block w-full mb-3 p-2 border rounded"
              />
              <input
                name="address"
                placeholder="Address (Optional)"
                defaultValue={editingEvent?.address || ''} // Pre-fill if editing
                className="block w-full mb-3 p-2 border rounded"
              />
              <select
                name="type"
                required
                // Pre-fill if editing
                defaultValue={editingEvent?.type || ''}
                className="block w-full mb-3 p-2 border rounded"
              >
                <option value="">Select Event Type</option>
                <option value="Halloween">Halloween</option>
                <option value="Garage Sale">Garage Sale</option>
                <option value="Business">Business</option>
                <option value="Plants">Plants</option>
                <option value="Produce">Produce</option>
              </select>
              <div className="mb-3">
                <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date (Optional)
                </label>
                <input
                  type="date"
                  id="event_date"
                  name="event_date"
                  // Pre-fill if editing (format YYYY-MM-DD)
                  defaultValue={editingEvent?.event_date || ''}
                  className="block w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvent(null); // Clear editing state on cancel
                    setPendingEventData(null); // Clear pending state on cancel
                  }}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {/* Dynamic Button Text */}
                  {editingEvent ? 'Update Event' : 'Next'}
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

      {/* --- Updated Role Badge --- */}
      <div className="fixed top-2 left-2 px-2 py-1 rounded-full text-sm z-50"
           style={{
             backgroundColor: {
               admin: '#ef4444',      // red-500
               moderator: '#a855f7',  // purple-500 (New)
               user: '#22c55e',       // green-500 (Was 'authenticated')
               anonymous: '#f59e0b',   // amber-500
               guest: '#6b7280'        // gray-500
             }[userRole]
           }}>
        {/* Capitalize the role name */} 
        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
      </div>
    </div>
  );
}

Home.getLayout = function getLayout(page: React.ReactElement) {
  return <ProtectedLayout>{page}</ProtectedLayout>
}
