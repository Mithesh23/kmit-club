import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { Award, Loader2, Plus, Users, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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

interface CertificatesManagerProps {
  clubId: string;
}

interface EventAttendee {
  id: string;
  roll_number: string;
  student_name: string;
  student_email: string;
  is_present: boolean;
}

interface Certificate {
  id: string;
  certificate_number: string;
  certificate_title: string;
  description: string | null;
  roll_number: string;
  student_name: string;
  student_email: string;
  issued_at: string;
  event: {
    title: string;
  } | null;
}

export const CertificatesManager = ({ clubId }: CertificatesManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [certificateTitle, setCertificateTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch events for this club
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['club-events', clubId],
    queryFn: async () => {
      const client = getAdminSupabaseClient();
      const { data, error } = await client
        .from('events')
        .select('id, title, event_date')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch attendees for selected event (only those who attended)
  const { data: attendees, isLoading: attendeesLoading } = useQuery({
    queryKey: ['event-attendees', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const client = getAdminSupabaseClient();
      const { data, error } = await client
        .from('event_attendance')
        .select('id, roll_number, student_name, student_email, is_present')
        .eq('event_id', selectedEvent)
        .eq('is_present', true);
      
      if (error) throw error;
      return data as EventAttendee[];
    },
    enabled: !!selectedEvent,
  });

  // Fetch existing certificates for this club
  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ['club-certificates', clubId],
    queryFn: async () => {
      const client = getAdminSupabaseClient();
      const { data, error } = await client
        .from('certificates')
        .select(`
          id,
          certificate_number,
          certificate_title,
          description,
          roll_number,
          student_name,
          student_email,
          issued_at,
          event:events(title)
        `)
        .eq('club_id', clubId)
        .order('issued_at', { ascending: false });
      
      if (error) throw error;
      return data as Certificate[];
    },
  });

  // Issue certificates mutation
  const issueCertificates = useMutation({
    mutationFn: async () => {
      if (!selectedEvent || !certificateTitle || selectedAttendees.length === 0) {
        throw new Error('Please fill all required fields and select at least one attendee');
      }

      const client = getAdminSupabaseClient();
      const selectedAttendeesData = attendees?.filter(a => selectedAttendees.includes(a.id)) || [];
      
      const certificatesToInsert = selectedAttendeesData.map(attendee => ({
        club_id: clubId,
        event_id: selectedEvent,
        roll_number: attendee.roll_number,
        student_name: attendee.student_name,
        student_email: attendee.student_email,
        certificate_title: certificateTitle,
        description: description || null,
      }));

      const { error } = await client
        .from('certificates')
        .insert(certificatesToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Certificates Issued",
        description: `Successfully issued ${selectedAttendees.length} certificate(s).`,
      });
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['club-certificates', clubId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed",
        description: error.message || "Failed to issue certificates.",
        variant: "destructive",
      });
    },
  });

  // Delete certificate mutation
  const deleteCertificate = useMutation({
    mutationFn: async (certificateId: string) => {
      const client = getAdminSupabaseClient();
      const { error } = await client
        .from('certificates')
        .delete()
        .eq('id', certificateId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Certificate Deleted",
        description: "Certificate has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['club-certificates', clubId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed",
        description: error.message || "Failed to delete certificate.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedEvent('');
    setCertificateTitle('');
    setDescription('');
    setSelectedAttendees([]);
  };

  const toggleAttendee = (id: string) => {
    setSelectedAttendees(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const selectAllAttendees = () => {
    if (attendees) {
      setSelectedAttendees(attendees.map(a => a.id));
    }
  };

  const downloadCertificatesList = () => {
    if (!certificates || certificates.length === 0) return;

    const headers = ['Certificate Number', 'Title', 'Student Name', 'Roll Number', 'Email', 'Event', 'Issued Date'];
    const rows = certificates.map(cert => [
      cert.certificate_number,
      cert.certificate_title,
      cert.student_name,
      cert.roll_number,
      cert.student_email,
      cert.event?.title || 'N/A',
      format(new Date(cert.issued_at), 'PP')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certificates Manager
          </CardTitle>
          <div className="flex gap-2">
            {certificates && certificates.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadCertificatesList}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Issue Certificates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Issue Certificates from Event
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Select Event */}
                  <div className="space-y-2">
                    <Label>Select Event</Label>
                    <Select value={selectedEvent} onValueChange={(value) => {
                      setSelectedEvent(value);
                      setSelectedAttendees([]);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventsLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : events && events.length > 0 ? (
                          events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title} {event.event_date && `(${format(new Date(event.event_date), 'PP')})`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No events found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Certificate Title */}
                  <div className="space-y-2">
                    <Label>Certificate Title</Label>
                    <Input
                      placeholder="e.g., Certificate of Participation"
                      value={certificateTitle}
                      onChange={(e) => setCertificateTitle(e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Additional details about the certificate..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* Select Attendees */}
                  {selectedEvent && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Select Attendees ({selectedAttendees.length} selected)</Label>
                        <Button variant="ghost" size="sm" onClick={selectAllAttendees}>
                          Select All
                        </Button>
                      </div>
                      {attendeesLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : attendees && attendees.length > 0 ? (
                        <ScrollArea className="h-48 border rounded-lg p-2">
                          <div className="space-y-2">
                            {attendees.map((attendee) => (
                              <div
                                key={attendee.id}
                                className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                                onClick={() => toggleAttendee(attendee.id)}
                              >
                                <Checkbox
                                  checked={selectedAttendees.includes(attendee.id)}
                                  onCheckedChange={() => toggleAttendee(attendee.id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{attendee.student_name}</p>
                                  <p className="text-xs text-muted-foreground">{attendee.roll_number}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No attendees marked present for this event</p>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => issueCertificates.mutate()}
                    disabled={issueCertificates.isPending || !selectedEvent || !certificateTitle || selectedAttendees.length === 0}
                    className="w-full"
                  >
                    {issueCertificates.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Issuing...
                      </>
                    ) : (
                      <>
                        <Award className="h-4 w-4 mr-2" />
                        Issue {selectedAttendees.length} Certificate(s)
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {certificatesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : certificates && certificates.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell className="font-mono text-xs">
                      <Badge variant="outline">{cert.certificate_number}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{cert.certificate_title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{cert.student_name}</p>
                        <p className="text-xs text-muted-foreground">{cert.roll_number}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{cert.event?.title || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(cert.issued_at), 'PP')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteCertificate.mutate(cert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="text-center py-12">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h4 className="font-semibold mb-2">No Certificates Issued</h4>
            <p className="text-muted-foreground text-sm">
              Issue certificates to students who attended your events.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
