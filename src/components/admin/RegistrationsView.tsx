import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminRegistrations, useUpdateRegistrationStatus, useAdminClub } from '@/hooks/useAdminClubData';
import { UserCheck, Loader2, Mail, Phone, CheckCircle, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationsViewProps {
  clubId: string;
}

export const RegistrationsView = ({ clubId }: RegistrationsViewProps) => {
  const { data: registrations, isLoading } = useAdminRegistrations(clubId);
  const { data: club } = useAdminClub(clubId);
  const { mutate: updateStatus, isPending } = useUpdateRegistrationStatus();
  const { toast } = useToast();

  const pendingCount = registrations?.filter(r => r.status === 'pending').length || 0;

  const handleStatusUpdate = (registrationId: string, status: 'approved' | 'rejected') => {
    const registration = registrations?.find(r => r.id === registrationId);
    
    updateStatus({ registrationId, status }, {
      onSuccess: async () => {
        toast({
          title: 'Success',
          description: `Registration ${status} successfully`,
        });

        // If approved and has roll number, create student account via edge function
        if (status === 'approved' && registration?.roll_number) {
          try {
            const { data, error: accountError } = await supabase.functions.invoke('create-student-account', {
              body: {
                rollNumber: registration.roll_number,
                password: 'Kmitclubs123',
              },
            });

            if (accountError) {
              console.error('Error creating student account:', accountError);
            } else if (data?.success && !data?.alreadyExists) {
              toast({
                title: "Student Account Created",
                description: `Login credentials generated for ${registration.roll_number}`,
              });
            }
          } catch (error) {
            console.error('Error creating student account:', error);
          }
        }

        // Send welcome email if approved
        if (status === 'approved' && registration && club) {
          try {
            const { error } = await supabase.functions.invoke('send-welcome-email', {
              body: {
                studentName: registration.student_name,
                studentEmail: registration.student_email,
                clubName: club.name,
                rollNumber: registration.roll_number,
                defaultPassword: 'Kmitclubs123',
              },
            });

            if (error) {
              console.error('Error sending welcome email:', error);
              toast({
                title: "Welcome Email",
                description: "Registration approved but failed to send welcome email.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Welcome Email Sent",
                description: `Welcome email sent to ${registration.student_name}`,
              });
            }
          } catch (error) {
            console.error('Error invoking welcome email function:', error);
          }
        }
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to update registration status',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDownload = () => {
    if (!registrations || registrations.length === 0) return;

    const csvContent = [
      ['Name', 'Email', 'Phone', 'Roll Number', 'Year', 'Branch', 'Why Join', 'Past Experience', 'Status', 'Registration Date'],
      ...registrations.map(reg => [
        reg.student_name,
        reg.student_email,
        reg.phone || '',
        reg.roll_number || '',
        reg.year || '',
        reg.branch || '',
        reg.why_join || '',
        reg.past_experience || '',
        reg.status,
        format(new Date(reg.created_at), 'PP')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Student Registrations
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="secondary">
                {pendingCount} Pending
              </Badge>
            )}
            {registrations && registrations.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : registrations && registrations.length > 0 ? (
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div key={registration.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{registration.student_name}</h5>
                        <Badge 
                          variant={
                            registration.status === 'approved' 
                              ? 'default' 
                              : registration.status === 'rejected' 
                              ? 'destructive' 
                              : 'secondary'
                          }
                        >
                          {registration.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(registration.created_at), 'PP')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {registration.student_email}
                    </div>
                    {registration.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {registration.phone}
                      </div>
                    )}
                    {registration.roll_number && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Roll:</span> {registration.roll_number}
                      </div>
                    )}
                    {registration.year && registration.branch && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Year:</span> {registration.year} | <span className="font-medium">Branch:</span> {registration.branch}
                      </div>
                    )}
                    {registration.why_join && (
                      <div className="text-sm">
                        <span className="font-medium">Why join:</span>
                        <p className="text-muted-foreground mt-1">{registration.why_join}</p>
                      </div>
                    )}
                    {registration.past_experience && (
                      <div className="text-sm">
                        <span className="font-medium">Past experience:</span>
                        <p className="text-muted-foreground mt-1">{registration.past_experience}</p>
                      </div>
                    )}
                  </div>
                  {registration.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStatusUpdate(registration.id, 'approved')}
                        disabled={isPending}
                        className="flex-1"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(registration.id, 'rejected')}
                        disabled={isPending}
                        className="flex-1"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No registrations yet.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};