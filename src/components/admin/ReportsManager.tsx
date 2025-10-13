import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminReports, useCreateReport, useDeleteReport } from '@/hooks/useAdminClubData';
import { FileText, Loader2, Trash2, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReportsManagerProps {
  clubId: string;
}

export const ReportsManager = ({ clubId }: ReportsManagerProps) => {
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'event'>('monthly');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: reports, isLoading } = useAdminReports(clubId);
  const { mutate: createReport, isPending: creating } = useCreateReport();
  const { mutate: deleteReport } = useDeleteReport();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !file) {
      toast({
        title: 'Missing information',
        description: 'Please provide both title and file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${clubId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('club-reports')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('club-reports')
        .getPublicUrl(filePath);

      // Create report record
      createReport({
        club_id: clubId,
        title,
        report_type: reportType,
        file_url: publicUrl,
      }, {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Report uploaded successfully',
          });
          setTitle('');
          setFile(null);
          setReportType('monthly');
          // Reset file input
          const fileInput = document.getElementById('report-file') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to create report',
            variant: 'destructive',
          });
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      deleteReport(reportId, {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Report deleted successfully',
          });
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to delete report',
            variant: 'destructive',
          });
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter report title"
                required
              />
            </div>

            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="yearly">Yearly Report</SelectItem>
                  <SelectItem value="event">Event Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="report-file">Upload File (PDF, DOC, etc.)</Label>
              <Input
                id="report-file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                required
              />
              {file && <p className="text-sm text-muted-foreground mt-1">{file.name}</p>}
            </div>

            <Button type="submit" disabled={creating || uploading}>
              {(creating || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload Report
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{report.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), 'PPP')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(report.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No reports uploaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};