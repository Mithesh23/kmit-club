import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface ReportData {
  eventTitle?: string;
  eventDate?: string;
  eventVenue?: string;
  eventDescription?: string;
  eventOutcomes?: string;
  meetingAgenda?: string;
  meetingDiscussion?: string;
  meetingDecisions?: string;
  monthlyActivities?: string;
  monthlyAchievements?: string;
  monthlyChallenges?: string;
  yearlyHighlights?: string;
  yearlyStatistics?: string;
  yearlyGoals?: string;
  [key: string]: string | undefined;
}

interface ReportDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: {
    id: string;
    title: string;
    report_type: string;
    report_date: string | null;
    created_at: string;
    file_url?: string | null;
    report_data?: ReportData | null;
    participants_roll_numbers?: string[] | null;
    club?: {
      name: string;
    };
  } | null;
}

export const ReportDetailsDialog = ({ open, onOpenChange, report }: ReportDetailsDialogProps) => {
  if (!report) return null;

  const reportData = report.report_data as ReportData | null;

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'mom': return 'Minutes of Meeting';
      case 'event': return 'Event Report';
      case 'monthly': return 'Monthly Report';
      case 'yearly': return 'Yearly Report';
      default: return type;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'mom': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'event': return 'bg-green-100 text-green-700 border-green-200';
      case 'monthly': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'yearly': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderReportContent = () => {
    if (!reportData) {
      return (
        <p className="text-muted-foreground text-center py-4">
          No detailed content available for this report.
        </p>
      );
    }

    switch (report.report_type) {
      case 'event':
        return (
          <div className="space-y-4">
            {reportData.eventTitle && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Event Title</h4>
                <p>{reportData.eventTitle}</p>
              </div>
            )}
            {reportData.eventDate && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Event Date</h4>
                <p>{reportData.eventDate}</p>
              </div>
            )}
            {reportData.eventVenue && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Venue</h4>
                <p>{reportData.eventVenue}</p>
              </div>
            )}
            {reportData.eventDescription && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                <p className="whitespace-pre-wrap">{reportData.eventDescription}</p>
              </div>
            )}
            {reportData.eventOutcomes && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Outcomes</h4>
                <p className="whitespace-pre-wrap">{reportData.eventOutcomes}</p>
              </div>
            )}
          </div>
        );

      case 'mom':
        return (
          <div className="space-y-4">
            {reportData.meetingAgenda && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Agenda</h4>
                <p className="whitespace-pre-wrap">{reportData.meetingAgenda}</p>
              </div>
            )}
            {reportData.meetingDiscussion && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Discussion</h4>
                <p className="whitespace-pre-wrap">{reportData.meetingDiscussion}</p>
              </div>
            )}
            {reportData.meetingDecisions && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Decisions</h4>
                <p className="whitespace-pre-wrap">{reportData.meetingDecisions}</p>
              </div>
            )}
          </div>
        );

      case 'monthly':
        return (
          <div className="space-y-4">
            {reportData.monthlyActivities && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Activities</h4>
                <p className="whitespace-pre-wrap">{reportData.monthlyActivities}</p>
              </div>
            )}
            {reportData.monthlyAchievements && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Achievements</h4>
                <p className="whitespace-pre-wrap">{reportData.monthlyAchievements}</p>
              </div>
            )}
            {reportData.monthlyChallenges && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Challenges</h4>
                <p className="whitespace-pre-wrap">{reportData.monthlyChallenges}</p>
              </div>
            )}
          </div>
        );

      case 'yearly':
        return (
          <div className="space-y-4">
            {reportData.yearlyHighlights && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Highlights</h4>
                <p className="whitespace-pre-wrap">{reportData.yearlyHighlights}</p>
              </div>
            )}
            {reportData.yearlyStatistics && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Statistics</h4>
                <p className="whitespace-pre-wrap">{reportData.yearlyStatistics}</p>
              </div>
            )}
            {reportData.yearlyGoals && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Goals for Next Year</h4>
                <p className="whitespace-pre-wrap">{reportData.yearlyGoals}</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            {Object.entries(reportData).map(([key, value]) => (
              value && (
                <div key={key}>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="whitespace-pre-wrap">{value}</p>
                </div>
              )
            ))}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl">{report.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`${getReportTypeColor(report.report_type)}`}>
              {getReportTypeLabel(report.report_type)}
            </Badge>
            {report.club?.name && (
              <Badge variant="outline">{report.club.name}</Badge>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {report.report_date 
                ? format(new Date(report.report_date), 'PPP')
                : format(new Date(report.created_at), 'PPP')
              }
            </div>
          </div>

          {/* Participants */}
          {report.participants_roll_numbers && report.participants_roll_numbers.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Participants ({report.participants_roll_numbers.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.participants_roll_numbers.slice(0, 10).map((roll) => (
                  <Badge key={roll} variant="secondary" className="text-xs">
                    {roll}
                  </Badge>
                ))}
                {report.participants_roll_numbers.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{report.participants_roll_numbers.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Report Content */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Report Details</h3>
            {renderReportContent()}
          </div>

          {/* File URL */}
          {report.file_url && (
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(report.file_url!, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Attached Document
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
