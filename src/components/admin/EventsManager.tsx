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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAdminEvents, useCreateEvent } from '@/hooks/useAdminClubData';
import { useEventRegistrations } from '@/hooks/useEventRegistrations';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, CalendarIcon, Plus, Loader2, Camera, Link, Users, Lock, LockOpen, Download, Mail, QrCode, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn, transformImageUrl } from '@/lib/utils';
import { QRScannerDialog } from './QRScannerDialog';
import { EventAttendanceDialog } from './EventAttendanceDialog';

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
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedEventForScan, setSelectedEventForScan] = useState<{ id: string; title: string } | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState<string | null>(null);
  
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
        description: description.trim(),
        event_date: eventDate ? eventDate.toISOString() : null
      },
      {
        onSuccess: async (newEvent) => {
          toast({
            title: "Event Created",
            description: "New event has been added successfully. Sending notifications...",
          });
          setTitle('');
          setDescription('');
          setEventDate(undefined);

          // Send new event email notifications to club members and mentors
          try {
            const { data, error } = await supabase.functions.invoke('send-new-event-email', {
              body: {
                eventId: newEvent.id,
                clubId: clubId,
              },
            });

            if (error) {
              console.error('Error sending new event emails:', error);
              toast({
                title: "Email Notification Failed",
                description: "Event created but failed to send email notifications.",
                variant: "destructive",
              });
              return;
            }

            if (data?.summary) {
              const { sent, retried, failed, members, mentors } = data.summary;
              const successCount = sent + retried;
              
              toast({
                title: "Notifications Sent",
                description: `${successCount} emails sent (${members} members, ${mentors} mentors). ${failed > 0 ? `${failed} failed.` : ''}`,
              });
            }
          } catch (emailError: any) {
            console.error('Error sending new event emails:', emailError);
            toast({
              title: "Email Notification Error",
              description: "Event created but email notifications encountered an error.",
              variant: "destructive",
            });
          }
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
          <div className="space-y-2">
            <Label>Event Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !eventDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, "PPP") : <span>Pick event date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Existing Events</h4>
            <Button
              size="icon"
              className="rounded-full bg-green-600 hover:bg-green-700 text-white h-10 w-10"
              onClick={() => {
                if (events && events.length > 0) {
                  setSelectedEventForScan({ id: events[0].id, title: events[0].title });
                  setScannerOpen(true);
                }
              }}
              disabled={!events || events.length === 0}
              title="Scan QR Code"
            >
              <QrCode className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="h-[600px] border rounded-lg">
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
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        {event.event_date && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Event: {format(new Date(event.event_date), 'PPP')}
                          </span>
                        )}
                        <span>Created: {format(new Date(event.created_at), 'PPP')}</span>
                      </div>
                    </div>
                    
                    {/* Registration Controls */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={event.registration_open ? 'destructive' : 'default'}
                        onClick={() => toggleRegistration(event.id, event.registration_open ?? true)}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAttendanceOpen(event.id)}
                      >
                        <ClipboardCheck className="h-3 w-3 mr-1" />
                        View Attendance
                      </Button>
                      <EventRegistrationsDialog eventId={event.id} eventTitle={event.title} clubId={clubId} />
                    </div>
                    
                    {/* Event Attendance Dialog */}
                    <EventAttendanceDialog
                      open={attendanceOpen === event.id}
                      onOpenChange={(open) => setAttendanceOpen(open ? event.id : null)}
                      eventId={event.id}
                      eventTitle={event.title}
                    />

                    {event.event_images && event.event_images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {event.event_images.map((image) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={transformImageUrl(image.image_url)}
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

        {/* Global QR Scanner Dialog */}
        <QRScannerDialog
          open={scannerOpen}
          onOpenChange={(open) => {
            setScannerOpen(open);
            if (!open) setSelectedEventForScan(null);
          }}
          eventId={selectedEventForScan?.id || ''}
          eventTitle={selectedEventForScan?.title || ''}
          events={events || []}
          onEventChange={(event) => setSelectedEventForScan(event)}
        />
      </CardContent>
    </Card>
  );
};

// Event Registrations Dialog Component
const EventRegistrationsDialog = ({ eventId, eventTitle, clubId }: { eventId: string; eventTitle: string; clubId: string }) => {
  const { data: registrations, isLoading } = useEventRegistrations(eventId);
  const { toast } = useToast();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const downloadRegistrations = () => {
    if (!registrations || registrations.length === 0) {
      toast({
        title: "No Data",
        description: "There are no registrations to download.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ['Name', 'Email', 'Roll Number', 'Branch', 'Year', 'Registration Date'];
    const rows = registrations.map(reg => [
      reg.student_name,
      reg.student_email,
      reg.roll_number,
      reg.branch,
      reg.year,
      format(new Date(reg.created_at), 'PP')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_registrations.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: "Registration data is being downloaded as CSV.",
    });
  };

  const sendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both subject and message.",
        variant: "destructive",
      });
      return;
    }

    if (!registrations || registrations.length === 0) {
      toast({
        title: "No Recipients",
        description: "There are no registrations to send emails to.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      const token = localStorage.getItem('club_auth_token');
      
      const { data, error } = await supabase.functions.invoke('send-event-update-email', {
        body: {
          eventId,
          subject: emailSubject.trim(),
          message: emailMessage.trim(),
        },
        headers: {
          Authorization: token || '',
        },
      });

      if (error) throw error;

      if (data?.summary) {
        const { sent, retried, failed, total } = data.summary;
        const successCount = sent + retried;
        
        if (failed > 0) {
          toast({
            title: "Email Notification Summary",
            description: `${successCount} of ${total} emails sent successfully. ${failed} failed.`,
            variant: failed === total ? "destructive" : "default",
          });
        } else if (total === 0) {
          toast({
            title: "No Registrations",
            description: "No registered students to send emails to.",
          });
        } else {
          toast({
            title: "All Emails Sent Successfully",
            description: `${successCount} emails sent to registered students.`,
          });
        }
      } else {
        toast({
          title: "Emails Sent",
          description: `Emails sent to registered students.`,
        });
      }

      setEmailDialogOpen(false);
      setEmailSubject('');
      setEmailMessage('');
    } catch (error: any) {
      console.error('Error sending bulk emails:', error);
      toast({
        title: "Failed to Send Emails",
        description: error.message || "An error occurred while sending emails.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Users className="h-3 w-3 mr-1" />
          View Registrations ({registrations?.length || 0})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-xl font-display">
              Registrations for {eventTitle}
            </DialogTitle>
            <div className="flex gap-2">
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={isLoading || !registrations || registrations.length === 0}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Send Email to All Registrants</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium">Recipients: {registrations?.length || 0} students</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-subject">Email Subject</Label>
                      <Input
                        id="email-subject"
                        placeholder="e.g., Important Event Update"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        disabled={isSendingEmail}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-message">Message</Label>
                      <Textarea
                        id="email-message"
                        placeholder="Write your message to all registered students..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        rows={8}
                        disabled={isSendingEmail}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEmailDialogOpen(false)}
                        disabled={isSendingEmail}
                      >
                        Cancel
                      </Button>
                      <Button onClick={sendBulkEmail} disabled={isSendingEmail}>
                        {isSendingEmail ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send to {registrations?.length || 0} Students
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadRegistrations}
                disabled={isLoading || !registrations || registrations.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
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
