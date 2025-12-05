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
    }
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
    enabled: !!clubId
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
    enabled: !!clubId
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
    enabled: !!clubId
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
    enabled: !!clubId
  });
};

export const useRegisterForClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (registration: Omit<ClubRegistration, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('club_registrations')
        .insert([registration]);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    }
  });
};