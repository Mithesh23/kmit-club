import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://qvsrhfzdkjygjuwmfwmh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c";

const getAdminSupabaseClient = () => {
  const token = localStorage.getItem('club_auth_token');
  
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

export interface AttendanceEvent {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  duration_minutes: number;
  created_at: string;
  attendance_records?: AttendanceRecord[];
  club?: {
    name: string;
  };
}

export interface AttendanceRecord {
  id: string;
  attendance_event_id: string;
  roll_number: string;
  present: boolean;
  created_at: string;
}

// Fetch attendance events for a club
export const useAttendanceEvents = (clubId: string) => {
  return useQuery({
    queryKey: ['attendance-events', clubId],
    queryFn: async (): Promise<AttendanceEvent[]> => {
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('attendance_events')
        .select(`
          *,
          attendance_records(*)
        `)
        .eq('club_id', clubId)
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      return (data as unknown as AttendanceEvent[]) || [];
    },
    enabled: !!clubId,
  });
};

// Create attendance event
export const useCreateAttendanceEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: {
      club_id: string;
      title: string;
      description: string | null;
      event_date: string;
      event_time: string;
      duration_minutes: number;
    }) => {
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('attendance_events')
        .insert([event])
        .select()
        .single();
      
      if (error) throw error;
      return data as AttendanceEvent;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-events', variables.club_id] });
    },
  });
};

// Create attendance records (batch)
export const useCreateAttendanceRecords = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attendance_event_id, roll_numbers }: {
      attendance_event_id: string;
      roll_numbers: string[];
    }) => {
      const adminClient = getAdminSupabaseClient();
      
      const records = roll_numbers.map(roll_number => ({
        attendance_event_id,
        roll_number,
        present: true,
      }));

      const { data, error } = await adminClient
        .from('attendance_records')
        .insert(records)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-events'] });
    },
  });
};

// Delete attendance event
export const useDeleteAttendanceEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const adminClient = getAdminSupabaseClient();
      const { error } = await adminClient
        .from('attendance_events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-events'] });
    },
  });
};

// Fetch student's attended events
export const useStudentAttendance = (rollNumber: string) => {
  return useQuery({
    queryKey: ['student-attendance', rollNumber],
    queryFn: async (): Promise<AttendanceEvent[]> => {
      const token = localStorage.getItem('student_auth_token');
      
      const client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          storage: localStorage,
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        },
      });

      // First get attendance records for this student
      const { data: records, error: recordsError } = await client
        .from('attendance_records')
        .select('attendance_event_id')
        .eq('roll_number', rollNumber);
      
      if (recordsError) throw recordsError;
      if (!records || records.length === 0) return [];

      const eventIds = records.map(r => r.attendance_event_id);

      // Then get the attendance events
      const { data: events, error: eventsError } = await client
        .from('attendance_events')
        .select(`
          *,
          club:clubs(name)
        `)
        .in('id', eventIds)
        .order('event_date', { ascending: false });
      
      if (eventsError) throw eventsError;
      return (events as unknown as AttendanceEvent[]) || [];
    },
    enabled: !!rollNumber,
  });
};
