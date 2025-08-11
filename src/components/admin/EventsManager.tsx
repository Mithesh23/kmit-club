import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminEvents, useCreateEvent } from '@/hooks/useAdminClubData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Plus, Loader2, Camera, Upload, X } from 'lucide-react';
import { format } from 'date-fns';

interface EventsManagerProps {
  clubId: string;
}

export const EventsManager = ({ clubId }: EventsManagerProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: events, isLoading } = useAdminEvents(clubId);
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

  const handleImageUpload = async (eventId: string, file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('event_images')
        .insert([{ event_id: eventId, image_url: publicUrl }]);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setSelectedEventId(null);
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEventId(event.id);
                        fileInputRef.current?.click();
                      }}
                      disabled={uploading}
                      className="w-full mt-2"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Add Images
                    </Button>
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
            Image upload functionality for events will be available in the next update.
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            if (e.target.files && selectedEventId) {
              for (const file of Array.from(e.target.files)) {
                await handleImageUpload(selectedEventId, file);
              }
            }
          }}
        />
      </CardContent>
    </Card>
  );
};
