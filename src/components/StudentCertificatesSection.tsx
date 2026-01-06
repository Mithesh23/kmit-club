import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Award, Loader2, ExternalLink, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Certificate {
  id: string;
  certificate_number: string;
  certificate_title: string;
  description: string | null;
  issued_at: string;
  club: {
    name: string;
    logo_url: string | null;
  } | null;
  event: {
    title: string;
    event_date: string | null;
  } | null;
}

interface StudentCertificatesSectionProps {
  rollNumber: string;
}

export const StudentCertificatesSection = ({ rollNumber }: StudentCertificatesSectionProps) => {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['student-certificates', rollNumber],
    queryFn: async () => {
      const token = localStorage.getItem('student_auth_token');
      
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
          certificate_number,
          certificate_title,
          description,
          issued_at,
          club:clubs(name, logo_url),
          event:events(title, event_date)
        `)
        .eq('roll_number', rollNumber)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return data as Certificate[];
    },
    enabled: !!rollNumber,
  });

  const handleDownloadCertificate = (certificate: Certificate) => {
    // Generate a simple text-based certificate for download
    const content = `
═══════════════════════════════════════════════════════════════════
                          CERTIFICATE
═══════════════════════════════════════════════════════════════════

Certificate Number: ${certificate.certificate_number}

                    ${certificate.certificate_title}

This is to certify that this certificate was issued by:

Club: ${certificate.club?.name || 'N/A'}
Event: ${certificate.event?.title || 'N/A'}
${certificate.event?.event_date ? `Date: ${format(new Date(certificate.event.event_date), 'PPP')}` : ''}

${certificate.description ? `Description: ${certificate.description}` : ''}

Issued on: ${format(new Date(certificate.issued_at), 'PPP')}

═══════════════════════════════════════════════════════════════════
                    KMIT Clubs Portal
═══════════════════════════════════════════════════════════════════
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certificate.certificate_number}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className="card-elegant border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-elegant border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-display">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            My Certificates
          </CardTitle>
          <CardDescription>
            Certificates issued by clubs for event participation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {certificates && certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="group p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/30 hover:shadow-md transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedCertificate(certificate)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                        {certificate.certificate_title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {certificate.club?.name || 'Unknown Club'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400">
                          {certificate.certificate_number}
                        </Badge>
                        {certificate.event?.title && (
                          <Badge variant="secondary" className="text-xs">
                            {certificate.event.title}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Issued: {format(new Date(certificate.issued_at), 'PP')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Award className="h-8 w-8 text-amber-500" />
              </div>
              <h4 className="font-display font-semibold text-lg mb-2">No Certificates Yet</h4>
              <p className="text-muted-foreground text-sm">
                Participate in club events to earn certificates!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificate Details Dialog */}
      <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Certificate Details
            </DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-6">
              {/* Certificate Visual */}
              <div className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-950/50 dark:via-background dark:to-orange-950/50 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-6 text-center">
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {selectedCertificate.certificate_number}
                  </Badge>
                </div>
                <Award className="h-12 w-12 mx-auto text-amber-500 mb-3" />
                <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-2">
                  {selectedCertificate.certificate_title}
                </h3>
                {selectedCertificate.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedCertificate.description}
                  </p>
                )}
                <div className="border-t border-amber-200 dark:border-amber-800 pt-4 mt-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Issued by: </span>
                    <span className="font-medium">{selectedCertificate.club?.name}</span>
                  </p>
                  {selectedCertificate.event && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Event: </span>
                      <span className="font-medium">{selectedCertificate.event.title}</span>
                    </p>
                  )}
                  {selectedCertificate.event?.event_date && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Event Date: </span>
                      <span className="font-medium">
                        {format(new Date(selectedCertificate.event.event_date), 'PPP')}
                      </span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="text-muted-foreground">Issued on: </span>
                    <span className="font-medium">
                      {format(new Date(selectedCertificate.issued_at), 'PPP')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDownloadCertificate(selectedCertificate)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                  onClick={() => setSelectedCertificate(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
