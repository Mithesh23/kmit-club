import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminEvents, useCreateEvent } from '@/hooks/useAdminClubData';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { Calendar, Plus, Loader2, Camera, Link } from 'lucide-react';
import { format } from 'date-fns';

const SUPABASE_URL = "https://qvsrhfzdkjygjuwmfwmh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c";

// Create admin supabase client with token authentication
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

interface EventsManagerProps {
  clubId: string;
}

export const EventsManager = ({ clubId }: EventsManagerProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  
  const { data: events, isLoading, refetch } = useAdminEvents(clubId);
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    createEvent(
      {
        club_id: clubId,
        title: title.trim(),
        description: description.trim()
      },
      {
        onSuccess: () => {
          toast({
            title: "Event Created",
            description: "New event has been added successfully.",
          });
          setTitle('');
          setDescription('');
        },
        onError: (error: any) => {
          toast({
            title: "Creation Failed",
            description: error.message || "Failed to create event.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleAddImageUrl = async (eventId: string) => {
    const imageUrl = imageUrls[eventId]?.trim();
    
    if (!imageUrl) {
      toast({
        title: "Validation Error",
        description: "Please enter an image URL.",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      const adminClient = getAdminSupabaseClient();

      const { error: dbError } = await adminClient
        .from('event_images')
        .insert([{ event_id: eventId, image_url: imageUrl }]);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Image URL added successfully!",
      });
      
      setImageUrls({ ...imageUrls, [eventId]: '' });
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to add image URL.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Events Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Event */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-semibold">Add New Event</h4>
          <div className="space-y-2">
            <Label htmlFor="event-title">Event Title</Label>
            <Input
              id="event-title"
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-desc">Event Description</Label>
            <Textarea
              id="event-desc"
              placeholder="Event description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleCreate} disabled={isCreating} className="w-full">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </>
            )}
          </Button>
        </div>

        {/* Existing Events */}
        <div>
          <h4 className="font-semibold mb-3">Existing Events</h4>
          <ScrollArea className="h-64 border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : events && events.length > 0 ? (
              <div className="p-4 space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg space-y-3">
                    <div>
                      <h5 className="font-medium">{event.title}</h5>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(event.created_at), 'PPP')}
                      </p>
                    </div>
                    {event.event_images && event.event_images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {event.event_images.map((image) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.image_url}
                              alt="Event"
                              className="w-full h-16 object-cover rounded-md"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                              <Camera className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2 mt-2">
                      <Label htmlFor={`image-url-${event.id}`} className="text-xs">Image URL</Label>
                      <Input
                        id={`image-url-${event.id}`}
                        placeholder="https://example.com/image.jpg"
                        value={imageUrls[event.id] || ''}
                        onChange={(e) => setImageUrls({ ...imageUrls, [event.id]: e.target.value })}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddImageUrl(event.id)}
                        disabled={adding}
                        className="w-full"
                      >
                        {adding ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Link className="h-3 w-3 mr-1" />
                            Add Image URL
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No events yet.</p>
            )}
          </ScrollArea>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <Camera className="h-4 w-4 inline mr-1" />
            Add image URLs for events. Images will be displayed in the club page and detailed event views.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
