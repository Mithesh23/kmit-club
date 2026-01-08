import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Award, Check, X, Loader2, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qvsrhfzdkjygjuwmfwmh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c";

const getMentorSupabaseClient = () => {
  const token = localStorage.getItem('mentor_auth_token');
  
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { 'x-mentor-token': token } : {},
    },
  });
};

interface CertificateRequest {
  id: string;
  event_id: string;
  club_id: string;
  status: string;
  requested_at: string;
  event: {
    id: string;
    title: string;
    description: string;
    event_date: string | null;
  };
  club: {
    id: string;
    name: string;
  };
}

export default function CertificateRequestsManager() {
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const mentorClient = getMentorSupabaseClient();
      
      const { data, error } = await mentorClient
        .from('certificate_requests')
        .select(`
          id,
          event_id,
          club_id,
          status,
          requested_at,
          event:events(id, title, description, event_date),
          club:clubs(id, name)
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to handle the nested objects
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        event: item.event,
        club: item.club,
      }));
      
      setRequests(transformedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load certificate requests.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approved' | 'rejected') => {
    setProcessingId(requestId);
    try {
      const mentorClient = getMentorSupabaseClient();
      
      const { error } = await mentorClient
        .from('certificate_requests')
        .update({ status: action })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: action === 'approved' ? "Request Approved" : "Request Rejected",
        description: action === 'approved' 
          ? "Certificate permission has been granted. The club admin can now issue certificates."
          : "The certificate request has been rejected.",
      });

      // Remove the processed request from the list
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error: any) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process request.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Certificate Requests
          {requests.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {requests.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No pending certificate requests</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.club?.name || 'Unknown Club'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{request.event?.title || 'Unknown Event'}</div>
                      {request.event?.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                          {request.event.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {request.event?.event_date 
                          ? format(new Date(request.event.event_date), 'dd MMM yyyy')
                          : 'No date'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(request.requested_at), 'dd MMM yyyy, HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAction(request.id, 'approved')}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Grant
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(request.id, 'rejected')}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
