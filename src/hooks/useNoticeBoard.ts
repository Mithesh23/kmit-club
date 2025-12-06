import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, isAfter, parseISO } from 'date-fns';

export interface NoticeItem {
  id: string;
  type: 'announcement' | 'event';
  title: string;
  content: string;
  clubId: string;
  clubName: string;
  clubLogo: string | null;
  createdAt: string;
  eventDate?: string | null;
  eventId?: string;
  isNew: boolean;
}

export const useNoticeBoard = () => {
  return useQuery({
    queryKey: ['noticeBoard'],
    queryFn: async (): Promise<NoticeItem[]> => {
      const now = new Date();
      const threeDaysAgo = addDays(now, -3);

      // Fetch announcements with club info
      const { data: announcements, error: annError } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          club_id,
          clubs (
            id,
            name,
            logo_url
          )
        `)
        .gte('created_at', threeDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (annError) throw annError;

      // Fetch events with club info (events that haven't ended yet)
      const { data: events, error: evtError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          event_date,
          created_at,
          club_id,
          clubs (
            id,
            name,
            logo_url
          )
        `)
        .gte('event_date', now.toISOString())
        .order('event_date', { ascending: true });

      if (evtError) throw evtError;

      // Also fetch KMIT events (from mentors)
      const { data: kmitEvents, error: kmitError } = await supabase
        .from('kmit_events')
        .select('*')
        .gte('date', now.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (kmitError) throw kmitError;

      const oneDayAgo = addDays(now, -1);

      // Transform announcements
      const announcementItems: NoticeItem[] = (announcements || []).map((ann: any) => ({
        id: ann.id,
        type: 'announcement' as const,
        title: ann.title,
        content: ann.content,
        clubId: ann.club_id,
        clubName: ann.clubs?.name || 'Unknown Club',
        clubLogo: ann.clubs?.logo_url || null,
        createdAt: ann.created_at,
        isNew: isAfter(parseISO(ann.created_at), oneDayAgo),
      }));

      // Transform club events
      const eventItems: NoticeItem[] = (events || []).map((evt: any) => ({
        id: evt.id,
        type: 'event' as const,
        title: evt.title,
        content: evt.description,
        clubId: evt.club_id,
        clubName: evt.clubs?.name || 'Unknown Club',
        clubLogo: evt.clubs?.logo_url || null,
        createdAt: evt.created_at,
        eventDate: evt.event_date,
        eventId: evt.id,
        isNew: isAfter(parseISO(evt.created_at), oneDayAgo),
      }));

      // Transform KMIT events (from mentor/principal)
      const kmitEventItems: NoticeItem[] = (kmitEvents || []).map((evt: any) => ({
        id: `kmit-${evt.id}`,
        type: 'event' as const,
        title: evt.name,
        content: evt.description || '',
        clubId: 'kmit',
        clubName: 'Principal KMIT',
        clubLogo: null,
        createdAt: evt.created_at,
        eventDate: evt.date,
        eventId: String(evt.id),
        isNew: evt.created_at ? isAfter(parseISO(evt.created_at), oneDayAgo) : false,
      }));

      // Combine and sort by creation date (newest first)
      const allNotices = [...announcementItems, ...eventItems, ...kmitEventItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return allNotices;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useHasNewNotices = () => {
  const { data: notices } = useNoticeBoard();
  return notices?.some(notice => notice.isNew) ?? false;
};
