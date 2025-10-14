import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminRegistrations, useUpdateRegistrationStatus } from '@/hooks/useAdminClubData';
import { UserCheck, Loader2, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface RegistrationsViewProps {
  clubId: string;
}

export const RegistrationsView = ({ clubId }: RegistrationsViewProps) => {
  const { data: registrations, isLoading } = useAdminRegistrations(clubId);
  const { mutate: updateStatus, isPending } = useUpdateRegistrationStatus();
  const { toast } = useToast();

  const pendingCount = registrations?.filter(r => r.status === 'pending').length || 0;

  const handleStatusUpdate = (registrationId: string, status: 'approved' | 'rejected') => {
    updateStatus({ registrationId, status }, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: `Registration ${status} successfully`,
        });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Student Registrations
          </div>
          {pendingCount > 0 && (
            <Badge variant="secondary">
              {pendingCount} Pending
            </Badge>
          )}
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
                  <div className="space-y-1">
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