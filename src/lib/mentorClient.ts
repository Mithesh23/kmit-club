import { supabase } from '@/integrations/supabase/client';

/**
 * Creates a supabase client instance with mentor auth token in headers
 * This is needed for RPC calls that check get_current_mentor_session()
 */
export const getMentorClient = () => {
  const token = localStorage.getItem('mentor_auth_token');
  
  if (!token) {
    console.warn('No mentor auth token found');
    return supabase;
  }
  
  // Set the authorization header globally for all subsequent requests
  // @ts-ignore - accessing internal client
  supabase.rest.headers['Authorization'] = `Bearer ${token}`;
  
  return supabase;
};

/**
 * Helper to make mentor RPC calls with proper auth headers
 */
export const mentorRpc = async <T = any>(
  functionName: string,
  params: Record<string, any>
): Promise<{ data: T | null; error: any }> => {
  const token = localStorage.getItem('mentor_auth_token');
  
  if (!token) {
    return { 
      data: null, 
      error: { message: 'Not authenticated as mentor' } 
    };
  }

  // Use fetch directly with proper headers
  const url = `https://qvsrhfzdkjygjuwmfwmh.supabase.co/rest/v1/rpc/${functionName}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        data: null, 
        error: { message: errorData.message || errorData.error || 'RPC call failed' } 
      };
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (err: any) {
    return { 
      data: null, 
      error: { message: err.message || 'Network error' } 
    };
  }
};
