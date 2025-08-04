import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Club, ClubMember, Announcement, Event, ClubRegistration } from '@/types/club';

const getAuthHeaders = () => {
  const token = localStorage.getItem('club_auth_token');
  return token ? { Authorization: token } : {};
};

export const useAdminClub = (clubId: string) => {
  return useQuery({
    queryKey: ['adminClub', clubId],
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

export const useUpdateClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clubId, updates }: { clubId: string; updates: Partial<Club> }) => {
      const { data, error } = await supabase
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

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (announcement: Omit<Announcement, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
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
      const { error } = await supabase
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

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (member: Omit<ClubMember, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
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
      const { error } = await supabase
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

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Omit<Event, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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