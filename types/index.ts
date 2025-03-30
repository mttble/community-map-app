export interface Event {
  id?: string;
  title: string;
  description: string;
  type: string;
  lat: number;
  lng: number;
  address: string | null;
  created_at?: string | null;
  user_id?: string | undefined;
  event_date: string | null;
  updated_at?: string | null;
}

export interface PendingEventData {
  title: string;
  description: string;
  type: string;
  address: string | null;
  event_date: string | null;
} 