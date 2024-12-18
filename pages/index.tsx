// pages/index.tsx
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Event } from '../types';
import InstallPWA from '../components/InstallPWA';
import { supabase } from '../lib/supabase-client';
import ProtectedLayout from '../components/ProtectedLayout';
import SignOut from '../components/SignOut';
import { useUser } from '@supabase/auth-helpers-react';
import { getUserRole, canDeleteEvent, canCreateEvent } from '../lib/auth';


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
  const [pendingEventData, setPendingEventData] = useState<Partial<Event> | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const user = useUser();
  const userRole = getUserRole(user);

  // Add this useEffect for debugging
  useEffect(() => {
    console.log('Current user:', user);
    console.log('Determined role:', userRole);
  }, [user, userRole]);

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();

    // Add a small delay before setting up the subscription
    const subscriptionTimeout = setTimeout(() => {
      const channel = supabase
        .channel('events-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
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
        .subscribe((status, error) => {
          console.log('Subscription status:', status);
          if (error) {
            console.error('Subscription error:', error);
          }
        });

      return () => {
        console.log('Cleaning up subscription');
        channel.unsubscribe();
      };
    }, 1000); // 1 second delay

    return () => {
      clearTimeout(subscriptionTimeout);
    };
  }, []);

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

  const handleMapClick = async (lat: number, lng: number) => {
    if (!canCreateEvent(user)) {
      console.log('User does not have permission to create events');
      return;
    }

    if (pendingEventData && pendingEventData.title && pendingEventData.type) {
      const newEvent: Event = {
        title: pendingEventData.title,
        description: pendingEventData.description || '',
        type: pendingEventData.type,
        lat,
        lng,
        user_id: user?.id
      };

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
    });
    setShowForm(false); // Hide the form
  };

  // Add this function to handle event removal
  const handleRemoveEvent = async (id: string) => {
    try {
      console.log('Attempting to remove event:', id);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error removing event:', error);
        return;
      }
      
      // Event will be removed from state via real-time subscription
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  // Add this function to filter events
  const filteredEvents = events.filter(event => {
    if (eventFilter === 'all') return true;
    return event.type?.toLowerCase() === eventFilter.toLowerCase();
  });

  const createPopupContent = (event: Event) => (
    <div>
      <h3 className="font-bold">{event.title}</h3>
      <p>{event.description}</p>
      <p className="text-sm text-gray-500">Type: {event.type}</p>
      
      {/* Show actions based on role */}
      {canDeleteEvent(user, event.user_id!) && event.id && (
        <button 
          onClick={() => handleRemoveEvent(event.id!)}
          className="bg-red-500 text-white px-2 py-1 rounded mt-2"
        >
          🗑️ {userRole === 'admin' ? 'Admin Remove' : 'Remove'}
        </button>
      )}

      {/* Show role-specific messages */}
      {userRole === 'anonymous' && (
        <p className="text-sm text-gray-500 mt-2">
          Sign in with email to add or remove events
        </p>
      )}
    </div>
  );

  return (
    <div className="h-screen w-full relative">
      {/* Existing buttons - top right */}
      {!pendingEventData && userRole !== 'guest' && userRole !== 'anonymous' && (
        <div className="fixed top-4 right-4 z-50 flex gap-1 sm:gap-2">
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[52px]"
          >
            Add Event
          </button>
          <button 
            onClick={() => setShowNewsletter(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[52px]"
          >
            Newsletter
          </button>
          <div className="flex flex-col gap-1 sm:gap-2">
            <button 
              onClick={() => setShowBinCalendar(true)}
              className={`${
                getCurrentBinColor() === 'yellow' 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white px-2 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[52px]`}
            >
              <div className="flex flex-col items-center -mt-1">
                <span>📅 Bin Calendar</span>
                <span className="text-xs">({getCurrentBinColor().charAt(0).toUpperCase() + getCurrentBinColor().slice(1)} Bin Week)</span>
              </div>
            </button>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[52px]"
            >
              <option value="all">All Events</option>
              <option value="halloween">Halloween</option>
              <option value="garage sale">Garage Sales</option>
              <option value="business">Business</option>
              <option value="plants">Plants</option>
              <option value="produce">Produce</option>
            </select>
            <div className="mt-[50px]">
              <SignOut />
            </div>
          </div>
          <InstallPWA />
        </div>
      )}

      {/* For guest and anonymous users, show only the view controls */}
      {!pendingEventData && (userRole === 'guest' || userRole === 'anonymous') && (
        <div className="fixed top-4 right-4 z-50 flex gap-1 sm:gap-2">
          <div className="flex flex-col gap-1 sm:gap-2">
            <button 
              onClick={() => setShowBinCalendar(true)}
              className={`${
                getCurrentBinColor() === 'yellow' 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white px-2 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[52px]`}
            >
              <div className="flex flex-col items-center -mt-1">
                <span>📅 Bin Calendar</span>
                <span className="text-xs">({getCurrentBinColor().charAt(0).toUpperCase() + getCurrentBinColor().slice(1)} Bin Week)</span>
              </div>
            </button>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-lg h-[52px]"
            >
              <option value="all">All Events</option>
              <option value="halloween">Halloween</option>
              <option value="garage sale">Garage Sales</option>
              <option value="business">Business</option>
              <option value="plants">Plants</option>
              <option value="produce">Produce</option>
            </select>
            <SignOut />
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
          createPopupContent={createPopupContent}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
              setPendingEventData(null); // Clear pending data if form is closed
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
                <option value="Business">Business</option>
                <option value="Plants">Plants</option>
                <option value="Produce">Produce</option>
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

      {/* Optional: Show user role badge */}
      <div className="fixed top-2 left-2 px-2 py-1 rounded-full text-sm z-50 text-white"
           style={{
             backgroundColor: {
               admin: '#ef4444',      // red-500
               moderator: '#8b5cf6',  // purple-500
               authenticated: '#22c55e', // green-500
               anonymous: '#f59e0b',   // amber-500
               guest: '#6b7280'        // gray-500
             }[userRole]
           }}>
        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
      </div>
    </div>
  );
}

Home.getLayout = function getLayout(page: React.ReactElement) {
  return <ProtectedLayout>{page}</ProtectedLayout>
}
