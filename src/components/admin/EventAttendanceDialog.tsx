import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Download, Users, Loader2, CheckCircle2, Clock, Award, Send, Mail, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

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

interface EventAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  clubId: string;
}

interface AttendanceRecord {
  id: string;
  student_name: string;
  student_email: string;
  roll_number: string;
  is_present: boolean;
  scanned_at: string | null;
  created_at: string;
}

export function EventAttendanceDialog({ open, onOpenChange, eventId, eventTitle, clubId }: EventAttendanceDialogProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [certificatePermission, setCertificatePermission] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [isIssuingCertificates, setIsIssuingCertificates] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && eventId) {
      fetchAttendance();
      fetchCertificatePermission();
      fetchRequestStatus();
    }
  }, [open, eventId]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select('*')
        .eq('event_id', eventId)
        .order('scanned_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCertificatePermission = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('certificate_permission')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setCertificatePermission(data?.certificate_permission || false);
    } catch (error) {
      console.error('Error fetching certificate permission:', error);
    }
  };

  const fetchRequestStatus = async () => {
    try {
      const adminClient = getAdminSupabaseClient();
      const { data, error } = await adminClient
        .from('certificate_requests')
        .select('status')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setRequestStatus(data.status as 'pending' | 'approved' | 'rejected');
      } else {
        setRequestStatus('none');
      }
    } catch (error) {
      console.error('Error fetching request status:', error);
    }
  };

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const adminClient = getAdminSupabaseClient();
      
      const { error } = await adminClient
        .from('certificate_requests')
        .insert({
          event_id: eventId,
          club_id: clubId,
          status: 'pending',
        });

      if (error) throw error;

      setRequestStatus('pending');
      toast({
        title: "Request Sent",
        description: "Certificate permission request has been sent to the Principal.",
      });
    } catch (error: any) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send request.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleIssueCertificates = async () => {
    const presentAttendees = attendance.filter(a => a.is_present);
    
    if (presentAttendees.length === 0) {
      toast({
        title: "No Attendees",
        description: "There are no present attendees to issue certificates to.",
        variant: "destructive",
      });
      return;
    }

    setIsIssuingCertificates(true);
    try {
      const adminClient = getAdminSupabaseClient();
      
      // Fetch event details for the email
      const { data: eventData, error: eventError } = await adminClient
        .from('events')
        .select('title, event_date, club_id, clubs(name)')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Check for existing certificates for this event
      const { data: existingCerts, error: checkError } = await adminClient
        .from('certificates')
        .select('roll_number')
        .eq('event_id', eventId);

      if (checkError) throw checkError;

      const existingRollNumbers = new Set(existingCerts?.map(c => c.roll_number) || []);
      
      // Filter out attendees who already have certificates
      const newAttendees = presentAttendees.filter(a => !existingRollNumbers.has(a.roll_number));

      if (newAttendees.length === 0) {
        toast({
          title: "Certificates Already Issued",
          description: "All present attendees already have certificates for this event.",
        });
        setIsIssuingCertificates(false);
        return;
      }

      // Create certificates in database for new attendees
      const certificatesToInsert = newAttendees.map(attendee => ({
        event_id: eventId,
        club_id: clubId,
        roll_number: attendee.roll_number,
        student_name: attendee.student_name,
        student_email: attendee.student_email,
        certificate_title: `Certificate of Participation - ${eventTitle}`,
        description: `Awarded for attending ${eventTitle}`,
      }));

      const { error: insertError } = await adminClient
        .from('certificates')
        .insert(certificatesToInsert);

      if (insertError) throw insertError;

      // Send certificates via email to all new attendees
      toast({
        title: "Sending Certificates",
        description: `Sending ${newAttendees.length} certificate(s) via email...`,
      });

      const clubData = eventData?.clubs as { name: string } | null;
      
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-certificate-email', {
        body: {
          event_id: eventId,
          event_title: eventTitle,
          event_date: eventData?.event_date || new Date().toISOString(),
          club_id: clubId,
          club_name: clubData?.name || 'KMIT Club',
          attendees: newAttendees.map(a => ({
            student_name: a.student_name,
            student_email: a.student_email,
            roll_number: a.roll_number,
          })),
        },
      });

      if (emailError) {
        console.error('Error sending certificate emails:', emailError);
        toast({
          title: "Certificates Issued",
          description: `${newAttendees.length} certificate(s) issued. Email sending failed - students can download from their dashboard.`,
          variant: "default",
        });
      } else {
        const result = emailResult as { successful_count: number; failed_count: number };
        toast({
          title: "Certificates Issued & Emailed",
          description: `Successfully issued ${newAttendees.length} certificate(s). Emails sent: ${result.successful_count} successful, ${result.failed_count} failed.`,
        });
      }
    } catch (error: any) {
      console.error('Error issuing certificates:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to issue certificates.",
        variant: "destructive",
      });
    } finally {
      setIsIssuingCertificates(false);
    }
  };

  const handleResendCertificate = async (attendee: AttendanceRecord) => {
    setResendingFor(attendee.roll_number);
    try {
      const adminClient = getAdminSupabaseClient();
      
      // Fetch event details
      const { data: eventData, error: eventError } = await adminClient
        .from('events')
        .select('title, event_date, club_id, clubs(name)')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      const clubData = eventData?.clubs as { name: string } | null;

      // Call the edge function to resend
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-certificate-email', {
        body: {
          event_id: eventId,
          event_title: eventTitle,
          event_date: eventData?.event_date || new Date().toISOString(),
          club_id: clubId,
          club_name: clubData?.name || 'KMIT Club',
          attendees: [{
            student_name: attendee.student_name,
            student_email: attendee.student_email,
            roll_number: attendee.roll_number,
          }],
        },
      });

      if (emailError) throw emailError;

      const result = emailResult as { successful_count: number; failed_count: number };
      
      if (result.successful_count > 0) {
        toast({
          title: "Certificate Resent",
          description: `Certificate email sent to ${attendee.student_email}`,
        });
      } else {
        toast({
          title: "Failed to Send",
          description: `Could not send email to ${attendee.student_email}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error resending certificate:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend certificate.",
        variant: "destructive",
      });
    } finally {
      setResendingFor(null);
    }
  };

  const downloadAttendance = () => {
    const presentAttendees = attendance.filter(a => a.is_present);
    
    const csvContent = [
      ['S.No', 'Student Name', 'Roll Number', 'Email', 'Status', 'Scan Time'].join(','),
      ...presentAttendees.map((record, index) => [
        index + 1,
        `"${record.student_name}"`,
        record.roll_number,
        record.student_email,
        'Present',
        record.scanned_at ? new Date(record.scanned_at).toLocaleString('en-IN') : '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_attendance.csv`;
    link.click();
  };

  const presentCount = attendance.filter(a => a.is_present).length;
  const totalRegistered = attendance.length;

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendance - {eventTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                <div className="text-xs text-muted-foreground">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{totalRegistered}</div>
                <div className="text-xs text-muted-foreground">Registered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {totalRegistered > 0 ? Math.round((presentCount / totalRegistered) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Attendance</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={downloadAttendance} 
                variant="outline" 
                size="sm"
                disabled={presentCount === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
              
              {certificatePermission ? (
                <Button
                  onClick={handleIssueCertificates}
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  disabled={presentCount === 0 || isIssuingCertificates}
                >
                  {isIssuingCertificates ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Award className="mr-2 h-4 w-4" />
                  )}
                  Issue Certificates
                </Button>
              ) : requestStatus === 'pending' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-500 text-yellow-600"
                  disabled
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Awaiting Approval
                </Button>
              ) : requestStatus === 'rejected' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-600"
                  onClick={handleRequestPermission}
                  disabled={isRequestingPermission}
                >
                  {isRequestingPermission ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Request Again
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  onClick={handleRequestPermission}
                  disabled={isRequestingPermission}
                >
                  {isRequestingPermission ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Request Permission
                </Button>
              )}
            </div>
          </div>

          {/* Attendance Table */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No registrations found for this event</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">S.No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Scan Time</TableHead>
                    {certificatePermission && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance
                    .filter(record => record.is_present)
                    .map((record, index) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{record.student_name}</TableCell>
                        <TableCell>{record.roll_number}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{record.student_email}</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="default" 
                            className="bg-green-100 text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Present
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTime(record.scanned_at)}
                        </TableCell>
                        {certificatePermission && (
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleResendCertificate(record)}
                                    disabled={resendingFor === record.roll_number}
                                  >
                                    {resendingFor === record.roll_number ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Resend Certificate Email</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              
              {/* Show pending registrations */}
              {attendance.filter(a => !a.is_present).length > 0 && (
                <>
                  <div className="border-t my-4 pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending ({attendance.filter(a => !a.is_present).length})
                    </h4>
                  </div>
                  <Table>
                    <TableBody>
                      {attendance
                        .filter(record => !record.is_present)
                        .map((record, index) => (
                          <TableRow key={record.id} className="opacity-60">
                            <TableCell className="w-[50px]">{index + 1}</TableCell>
                            <TableCell>{record.student_name}</TableCell>
                            <TableCell>{record.roll_number}</TableCell>
                            <TableCell className="text-sm">{record.student_email}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">Pending</Badge>
                            </TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
