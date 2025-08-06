import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { Club, ClubMember, Announcement, Event, ClubRegistration } from '@/types/club';

const SUPABASE_URL = "https://qvsrhfzdkjygjuwmfwmh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c";

// Create a custom supabase client for admin operations with token authentication
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

export const useAdminClub = (clubId: string) => {
  return useQuery({
    queryKey: ['adminClub', clubId],
    queryFn: async (): Promise<Club | null> => {
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clubId
  });
};

export const useUpdateClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clubId, updates }: { clubId: string; updates: Partial<Club> }) => {
      const token = localStorage.getItem('club_auth_token');
      if (!token) throw new Error('No authentication token found');
      
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('clubs')
        .update(updates)
        .eq('id', clubId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminClub', data.id] });
      queryClient.invalidateQueries({ queryKey: ['club', data.id] });
    }
  });
};

export const useAdminAnnouncements = (clubId: string) => {
  return useQuery({
    queryKey: ['adminAnnouncements', clubId],
    queryFn: async (): Promise<Announcement[]> => {
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('announcements')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (announcement: Omit<Announcement, 'id' | 'created_at'>) => {
      const token = localStorage.getItem('club_auth_token');
      if (!token) throw new Error('No authentication token found');
      
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('announcements')
        .insert([announcement])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements', data.club_id] });
      queryClient.invalidateQueries({ queryKey: ['announcements', data.club_id] });
    }
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('club_auth_token');
      if (!token) throw new Error('No authentication token found');
      
      const adminClient = getAdminSupabaseClient();
      const { error } = await adminClient
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    }
  });
};

export const useAdminMembers = (clubId: string) => {
  return useQuery({
    queryKey: ['adminMembers', clubId],
    queryFn: async (): Promise<ClubMember[]> => {
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('club_members')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (member: Omit<ClubMember, 'id' | 'created_at'>) => {
      const token = localStorage.getItem('club_auth_token');
      if (!token) throw new Error('No authentication token found');
      
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('club_members')
        .insert([member])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminMembers', data.club_id] });
      queryClient.invalidateQueries({ queryKey: ['clubMembers', data.club_id] });
    }
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('club_auth_token');
      if (!token) throw new Error('No authentication token found');
      
      const adminClient = getAdminSupabaseClient();
      const { error } = await adminClient
        .from('club_members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      queryClient.invalidateQueries({ queryKey: ['clubMembers'] });
    }
  });
};

export const useAdminEvents = (clubId: string) => {
  return useQuery({
    queryKey: ['adminEvents', clubId],
    queryFn: async (): Promise<Event[]> => {
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('events')
        .select(`
          *,
          event_images(*)
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Omit<Event, 'id' | 'created_at'>) => {
      const token = localStorage.getItem('club_auth_token');
      if (!token) throw new Error('No authentication token found');
      
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('events')
        .insert([event])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents', data.club_id] });
      queryClient.invalidateQueries({ queryKey: ['events', data.club_id] });
    }
  });
};

export const useAdminRegistrations = (clubId: string) => {
  return useQuery({
    queryKey: ['adminRegistrations', clubId],
    queryFn: async (): Promise<ClubRegistration[]> => {
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('club_registrations')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId
  });
};