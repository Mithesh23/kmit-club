import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://qvsrhfzdkjygjuwmfwmh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c";

const getStudentSupabaseClient = () => {
  const token = localStorage.getItem('student_auth_token');
  
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { authorization: token } : {},
    },
  });
};

export const useStudentClubs = () => {
  return useQuery({
    queryKey: ['student-clubs'],
    queryFn: async () => {
      const client = getStudentSupabaseClient();
      
      const { data, error } = await client
        .from('club_registrations')
        .select(`
          id,
          club_id,
          club:clubs(
            id,
            name,
            short_description,
            logo_url
          )
        `)
        .eq('status', 'approved');

      if (error) throw error;
      return data;
    },
  });
};

export const useStudentAttendance = () => {
  return useQuery({
    queryKey: ['student-attendance'],
    queryFn: async () => {
      const client = getStudentSupabaseClient();
      
      const { data, error } = await client
        .from('club_reports')
        .select(`
          id,
          title,
          report_type,
          report_date,
          created_at,
          club:clubs(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
