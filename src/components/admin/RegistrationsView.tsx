import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminRegistrations } from '@/hooks/useAdminClubData';
import { UserCheck, Loader2, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface RegistrationsViewProps {
  clubId: string;
}

export const RegistrationsView = ({ clubId }: RegistrationsViewProps) => {
  const { data: registrations, isLoading } = useAdminRegistrations(clubId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Student Registrations
          {registrations && registrations.length > 0 && (
            <Badge variant="secondary">{registrations.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : registrations && registrations.length > 0 ? (
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div key={registration.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium">{registration.student_name}</h5>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(registration.created_at), 'PP')}
                    </span>
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