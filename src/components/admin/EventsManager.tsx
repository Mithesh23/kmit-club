import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAdminEvents, useCreateEvent } from '@/hooks/useAdminClubData';
import { useEventRegistrations } from '@/hooks/useEventRegistrations';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { Calendar, Plus, Loader2, Camera, Link, Users, Lock, LockOpen } from 'lucide-react';
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

  const toggleRegistration = async (eventId: string, currentStatus: boolean) => {
    try {
      const adminClient = getAdminSupabaseClient();
      
      const { error } = await adminClient
        .from('events')
        .update({ registration_open: !currentStatus })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Registration ${!currentStatus ? 'opened' : 'closed'} successfully!`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to update registration status.",
        variant: "destructive",
      });
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
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{event.title}</h5>
                        <Badge variant={event.registration_open ? 'default' : 'secondary'}>
                          {event.registration_open ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(event.created_at), 'PPP')}
                      </p>
                    </div>
                    
                    {/* Registration Controls */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={event.registration_open ? 'destructive' : 'default'}
                        onClick={() => toggleRegistration(event.id, event.registration_open ?? true)}
                        className="flex-1"
                      >
                        {event.registration_open ? (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Close Registration
                          </>
                        ) : (
                          <>
                            <LockOpen className="h-3 w-3 mr-1" />
                            Open Registration
                          </>
                        )}
                      </Button>
                      <EventRegistrationsDialog eventId={event.id} eventTitle={event.title} />
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

// Event Registrations Dialog Component
const EventRegistrationsDialog = ({ eventId, eventTitle }: { eventId: string; eventTitle: string }) => {
  const { data: registrations, isLoading } = useEventRegistrations(eventId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex-1">
          <Users className="h-3 w-3 mr-1" />
          View Registrations ({registrations?.length || 0})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            Registrations for {eventTitle}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : registrations && registrations.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.student_name}</TableCell>
                      <TableCell>{registration.student_email}</TableCell>
                      <TableCell>{registration.roll_number}</TableCell>
                      <TableCell>{registration.branch}</TableCell>
                      <TableCell>{registration.year}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(registration.created_at), 'PP')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h4 className="font-semibold text-lg mb-2">No Registrations Yet</h4>
              <p className="text-muted-foreground">Student registrations will appear here</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
