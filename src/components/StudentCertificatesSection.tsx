import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Award, Loader2, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

interface Certificate {
  id: string;
  certificate_number: string;
  certificate_title: string;
  description: string | null;
  issued_at: string;
  student_name: string;
  roll_number: string;
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

// Year mapping for Roman numerals
const yearMapping: Record<string, string> = {
  '1st Year': 'I',
  '2nd Year': 'II',
  '3rd Year': 'III',
  '4th Year': 'IV',
};

export const StudentCertificatesSection = ({ rollNumber }: StudentCertificatesSectionProps) => {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['student-certificates', rollNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
          certificate_number,
          certificate_title,
          description,
          issued_at,
          student_name,
          roll_number,
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

  // Fetch student details for year and branch
  const { data: studentDetails } = useQuery({
    queryKey: ['student-details', rollNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_accounts')
        .select('year, branch')
        .eq('roll_number', rollNumber)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!rollNumber,
  });

  // Get formatted certificate details for preview
  const getCertificatePreviewData = (certificate: Certificate) => {
    const studentYear = studentDetails?.year || '';
    const romanYear = yearMapping[studentYear] || studentYear;
    const eventDate = certificate.event?.event_date 
      ? format(new Date(certificate.event.event_date), 'do MMMM yyyy')
      : '';
    
    return {
      studentName: certificate.student_name.toUpperCase(),
      studyingText: `B.Tech ${romanYear} Year`,
      branch: studentDetails?.branch || '',
      eventName: certificate.event?.title || '',
      eventDate,
    };
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    setIsDownloading(true);
    
    try {
      // Create PDF with landscape orientation (A4)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 297;
      const pageHeight = 210;

      // Load the certificate template image
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        templateImg.onload = () => resolve();
        templateImg.onerror = () => reject(new Error('Failed to load template'));
        templateImg.src = '/certificate-template.jpg';
      });

      // Add the template as background
      pdf.addImage(templateImg, 'JPEG', 0, 0, pageWidth, pageHeight);

      // Set Times New Roman font (using Times which is built into jsPDF)
      pdf.setFont('times', 'normal');

      const previewData = getCertificatePreviewData(certificate);

      // Position and add text - matching the template layout
      // Student Name (after "Mr/Ms")
      pdf.setFontSize(14);
      pdf.setFont('times', 'bold');
      pdf.text(previewData.studentName, 128, 109);

      // Year (after "Studying" - B.Tech + Year)
      pdf.setFontSize(14);
      pdf.setFont('times', 'bold');
      pdf.text(previewData.studyingText, 75, 125);

      // Branch (after "in")
      pdf.setFontSize(14);
      pdf.setFont('times', 'bold');
      pdf.text(previewData.branch, 160, 130);

      // Event Name (after "event of")
      pdf.setFontSize(14);
      pdf.setFont('times', 'bold');
      pdf.text(previewData.eventName, 188, 141);

      // Event Date (after "held in the college during/on")
      pdf.setFontSize(14);
      pdf.setFont('times', 'bold');
      pdf.text(previewData.eventDate, 125, 156);

      // Save the PDF
      const fileName = `Certificate_${certificate.student_name.replace(/\s+/g, '_')}_${certificate.event?.title?.replace(/\s+/g, '_') || 'Event'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Certificate Preview Component with actual template
  const CertificatePreview = ({ certificate }: { certificate: Certificate }) => {
    const previewData = getCertificatePreviewData(certificate);
    
    return (
      <div className="relative w-full overflow-hidden rounded-lg border-2 border-amber-300 shadow-lg">
        {/* Certificate Template Background */}
        <img 
          src="/certificate-template.jpg" 
          alt="Certificate Template" 
          className="w-full h-auto"
        />
        
        {/* Overlay text positioned exactly like the PDF */}
        <div className="absolute inset-0" style={{ fontFamily: 'Times New Roman, serif' }}>
          {/* Student Name - position (128, 109) in PDF = ~43.1% from left, ~51.9% from top */}
          <div 
            className="absolute font-bold text-black"
            style={{ 
              left: '43.1%', 
              top: '51.9%',
              fontSize: 'clamp(8px, 1.4vw, 14px)',
            }}
          >
            {previewData.studentName}
          </div>
          
          {/* Year - position (75, 125) in PDF = ~25.3% from left, ~59.5% from top */}
          <div 
            className="absolute font-bold text-black"
            style={{ 
              left: '25.3%', 
              top: '59.5%',
              fontSize: 'clamp(8px, 1.4vw, 14px)',
            }}
          >
            {previewData.studyingText}
          </div>
          
          {/* Branch - position (160, 130) in PDF = ~53.9% from left, ~61.9% from top */}
          <div 
            className="absolute font-bold text-black"
            style={{ 
              left: '53.9%', 
              top: '61.9%',
              fontSize: 'clamp(8px, 1.4vw, 14px)',
            }}
          >
            {previewData.branch}
          </div>
          
          {/* Event Name - position (188, 141) in PDF = ~63.3% from left, ~67.1% from top */}
          <div 
            className="absolute font-bold text-black"
            style={{ 
              left: '63.3%', 
              top: '67.1%',
              fontSize: 'clamp(8px, 1.4vw, 14px)',
            }}
          >
            {previewData.eventName}
          </div>
          
          {/* Event Date - position (125, 156) in PDF = ~42.1% from left, ~74.3% from top */}
          <div 
            className="absolute font-bold text-black"
            style={{ 
              left: '42.1%', 
              top: '74.3%',
              fontSize: 'clamp(8px, 1.4vw, 14px)',
            }}
          >
            {previewData.eventDate}
          </div>
        </div>
      </div>
    );
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
      <Dialog open={!!selectedCertificate} onOpenChange={() => { setSelectedCertificate(null); setShowPreview(false); }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              {showPreview ? 'Certificate Preview' : 'Certificate Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-6">
              {showPreview ? (
                /* Certificate Preview with Template */
                <CertificatePreview certificate={selectedCertificate} />
              ) : (
                /* Certificate Details View */
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
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'View Details' : 'Preview Certificate'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDownloadCertificate(selectedCertificate)}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={() => { setSelectedCertificate(null); setShowPreview(false); }}
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
