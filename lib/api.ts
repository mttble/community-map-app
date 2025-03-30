import { supabase } from './supabase-client';
import type { Event } from '../types';

// Use JWT token for authenticated requests
const getAuthHeader = async () => {
  const session = await supabase.auth.getSession();
  return session?.data?.session?.access_token
    ? { Authorization: `Bearer ${session.data.session.access_token}` }
    : {};
};

// Fetch events through the API
export async function fetchEvents(): Promise<Event[]> {
  const headers = await getAuthHeader();
  const response = await fetch('/api/events', { headers });
  
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  
  return response.json();
}

// Create a new event
export async function createEvent(event: Omit<Event, 'id'>): Promise<Event> {
  const headers = {
    ...(await getAuthHeader()),
    'Content-Type': 'application/json',
  };
  
  const response = await fetch('/api/events', {
    method: 'POST',
    headers,
    body: JSON.stringify(event),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create event');
  }
  
  const data = await response.json();
  return data[0];
}

// Update an event
export async function updateEvent(event: Event): Promise<Event> {
  const headers = {
    ...(await getAuthHeader()),
    'Content-Type': 'application/json',
  };
  
  const response = await fetch('/api/events', {
    method: 'PUT',
    headers,
    body: JSON.stringify(event),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update event');
  }
  
  return response.json();
}

// Delete an event
export async function deleteEvent(id: string): Promise<void> {
  const headers = await getAuthHeader();
  
  const response = await fetch(`/api/events?id=${id}`, {
    method: 'DELETE',
    headers,
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete event');
  }
} 