import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Club, ClubMember, Announcement, Event, ClubRegistration } from '@/types/club';

export const useClubs = (includeInactive = false) => {
  return useQuery({
    queryKey: ['clubs', includeInactive],
    queryFn: async (): Promise<Club[]> => {
      let query = supabase
        .from('clubs')
        .select('*')
        .order('name');
      
      // By default, only fetch active clubs for public views
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

export const useClub = (clubId: string) => {
  return useQuery({
    queryKey: ['club', clubId],
    queryFn: async (): Promise<Club | null> => {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

export const useClubMembers = (clubId: string) => {
  return useQuery({
    queryKey: ['clubMembers', clubId],
    queryFn: async (): Promise<ClubMember[]> => {
      const { data, error } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnnouncements = (clubId: string) => {
  return useQuery({
    queryKey: ['announcements', clubId],
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clubId,
    staleTime: 2 * 60 * 1000, // Cache announcements for 2 minutes
  });
};

export const useEvents = (clubId: string) => {
  return useQuery({
    queryKey: ['events', clubId],
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await supabase
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
    enabled: !!clubId,
    staleTime: 2 * 60 * 1000, // Cache events for 2 minutes
  });
};

export const useRegisterForClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (registration: Omit<ClubRegistration, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('club_registrations')
        .insert([registration])
        .select('id')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate registrations cache
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    // Retry logic for network failures
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};
