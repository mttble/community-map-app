export interface Event {
  id?: string;
  title: string;
  description: string;
  type: string;
  lat: number;
  lng: number;
  created_at?: string;
} 