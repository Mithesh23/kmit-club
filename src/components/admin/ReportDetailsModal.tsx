import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClubReport } from '@/types/club';
import { format } from 'date-fns';
import { Calendar, Users, FileText } from 'lucide-react';

interface ReportDetailsModalProps {
  report: ClubReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportDetailsModal = ({ report, open, onOpenChange }: ReportDetailsModalProps) => {
  if (!report) return null;

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'mom':
        return 'Minutes of Meeting';
      case 'event':
        return 'Event Report';
      case 'monthly':
        return 'Monthly Report';
      case 'yearly':
        return 'Yearly Report';
      default:
        return type;
    }
  };

  const renderReportData = () => {
    if (!report.report_data) return null;

    const data = report.report_data as Record<string, any>;

    if (report.report_type === 'mom') {
      return (
        <div className="space-y-4">
          {data.agenda && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Meeting Agenda</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.agenda}</p>
            </div>
          )}
          {data.discussions && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Key Discussions</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.discussions}</p>
            </div>
          )}
          {data.decisions && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Decisions Made</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.decisions}</p>
            </div>
          )}
          {data.actionItems && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Action Items</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.actionItems}</p>
            </div>
          )}
          {data.nextMeetingDate && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Next Meeting Date</h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(data.nextMeetingDate), 'PPP')}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (report.report_type === 'event') {
      return (
        <div className="space-y-4">
          {data.eventDescription && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Event Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.eventDescription}</p>
            </div>
          )}
          {data.eventOutcomes && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Event Outcomes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.eventOutcomes}</p>
            </div>
          )}
          {data.attendance && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Attendance Count</h4>
              <p className="text-sm text-muted-foreground">{data.attendance}</p>
            </div>
          )}
        </div>
      );
    }

    if (report.report_type === 'monthly' || report.report_type === 'yearly') {
      return (
        <div className="space-y-4">
          {data.summary && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.summary}</p>
            </div>
          )}
          {data.achievements && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Achievements</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.achievements}</p>
            </div>
          )}
          {data.challenges && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Challenges</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.challenges}</p>
            </div>
          )}
          {data.plans && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Future Plans</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.plans}</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {report.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type Badge */}
          <div>
            <Badge variant="secondary" className="text-sm">
              {getReportTypeLabel(report.report_type)}
            </Badge>
          </div>

          {/* Common Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">Common Information</h3>
            
            {report.report_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Report Date:</span>{' '}
                  {format(new Date(report.report_date), 'PPP')}
                </span>
              </div>
            )}

            {report.participants_roll_numbers && report.participants_roll_numbers.length > 0 && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium">Participants:</span>{' '}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {report.participants_roll_numbers.map((rollNum, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {rollNum}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Created: {format(new Date(report.created_at), 'PPP')}
            </div>
          </div>

          <Separator />

          {/* Report Specific Details */}
          <div>
            <h3 className="font-semibold text-base mb-4">Report Details</h3>
            {renderReportData()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
