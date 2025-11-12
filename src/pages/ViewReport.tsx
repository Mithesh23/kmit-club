import { useParams, useNavigate } from 'react-router-dom';
import { useAdminReports } from '@/hooks/useAdminClubData';
import { useClubAuth } from '@/hooks/useClubAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Loader2, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { useEffect } from 'react';

const ViewReport = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useClubAuth();
  const { data: reports, isLoading } = useAdminReports(session?.club_id || '');

  useEffect(() => {
    if (!authLoading && !session?.success) {
      navigate('/admin');
    }
  }, [session, authLoading, navigate]);

  const report = reports?.find(r => r.id === reportId);

  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(report.title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Report Type
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const reportTypeLabel = report.report_type === 'mom' ? 'Minutes of Meeting' : 
                           report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1) + ' Report';
    doc.text(`Type: ${reportTypeLabel}`, 20, yPos);
    yPos += 10;

    // Date
    if (report.report_date) {
      doc.text(`Date: ${format(new Date(report.report_date), 'PPP')}`, 20, yPos);
      yPos += 10;
    }

    // Participants
    if (report.participants_roll_numbers && report.participants_roll_numbers.length > 0) {
      doc.text('Participants:', 20, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.text(report.participants_roll_numbers.join(', '), 25, yPos);
      yPos += 12;
      doc.setFontSize(12);
    }

    // Report Data
    if (report.report_data) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Report Details', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');

      Object.entries(report.report_data).forEach(([key, value]) => {
        if (value) {
          const label = key.replace(/([A-Z])/g, ' $1').trim();
          const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
          
          doc.setFont('helvetica', 'bold');
          doc.text(`${capitalizedLabel}:`, 20, yPos);
          yPos += 7;
          
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(String(value), pageWidth - 40);
          doc.text(lines, 25, yPos);
          yPos += lines.length * 7 + 5;

          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        }
      });
    }

    doc.save(`${report.title.replace(/\s+/g, '_')}_report.pdf`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Report not found</h2>
          <Button onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{report.title}</CardTitle>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                {report.report_type === 'mom' ? 'MOM' : report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
              </span>
              {report.report_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(report.report_date), 'PPP')}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {report.participants_roll_numbers && report.participants_roll_numbers.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Participants</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {report.participants_roll_numbers.join(', ')}
                </p>
              </div>
            )}

            {report.report_data && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">Report Details</h3>
                {Object.entries(report.report_data).map(([key, value]) => (
                  value && (
                    <div key={key} className="space-y-2">
                      <h4 className="font-semibold text-primary capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-muted-foreground whitespace-pre-wrap pl-4">
                        {String(value)}
                      </p>
                    </div>
                  )
                ))}
              </div>
            )}

            <div className="pt-4 border-t text-xs text-muted-foreground">
              Created on: {format(new Date(report.created_at), 'PPP p')}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ViewReport;
