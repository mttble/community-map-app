import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Extract the user token if available
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (req.method === 'GET') {
    // Fetch events
    const { data, error } = await supabase
      .from('events')
      .select('*');
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  }
  
  if (req.method === 'POST') {
    // Insert a new event
    const { data, error } = await supabase
      .from('events')
      .insert([req.body])
      .select();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(201).json(data);
  }
  
  if (req.method === 'PUT') {
    const { id, ...eventData } = req.body;
    
    // Update an event
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  }
  
  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    // Delete an event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ success: true });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
} 