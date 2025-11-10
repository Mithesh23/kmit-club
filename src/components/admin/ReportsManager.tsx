import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAdminReports, useCreateReport, useDeleteReport } from '@/hooks/useAdminClubData';
import { FileText, Loader2, Trash2, Upload, CalendarIcon, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReportsManagerProps {
  clubId: string;
}

export const ReportsManager = ({ clubId }: ReportsManagerProps) => {
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState<'mom' | 'monthly' | 'yearly' | 'event'>('mom');
  const [reportDate, setReportDate] = useState<Date>();
  const [participants, setParticipants] = useState('');
  
  // Report-specific fields
  const [agenda, setAgenda] = useState('');
  const [discussions, setDiscussions] = useState('');
  const [decisions, setDecisions] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [nextMeetingDate, setNextMeetingDate] = useState<Date>();
  
  // Event report fields
  const [eventDescription, setEventDescription] = useState('');
  const [eventOutcomes, setEventOutcomes] = useState('');
  const [attendance, setAttendance] = useState('');
  
  // Monthly/Yearly report fields
  const [summary, setSummary] = useState('');
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [plans, setPlans] = useState('');

  const { data: reports, isLoading } = useAdminReports(clubId);
  const { mutate: createReport, isPending: creating } = useCreateReport();
  const { mutate: deleteReport } = useDeleteReport();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !reportDate || !participants) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all common fields',
        variant: 'destructive',
      });
      return;
    }

    // Build report data based on type
    const reportData: Record<string, any> = {};
    
    if (reportType === 'mom') {
      reportData.agenda = agenda;
      reportData.discussions = discussions;
      reportData.decisions = decisions;
      reportData.actionItems = actionItems;
      reportData.nextMeetingDate = nextMeetingDate?.toISOString();
    } else if (reportType === 'event') {
      reportData.eventDescription = eventDescription;
      reportData.eventOutcomes = eventOutcomes;
      reportData.attendance = attendance;
    } else {
      reportData.summary = summary;
      reportData.achievements = achievements;
      reportData.challenges = challenges;
      reportData.plans = plans;
    }

    const rollNumbers = participants.split(',').map(r => r.trim()).filter(r => r);

    createReport({
      club_id: clubId,
      title,
      report_type: reportType,
      report_date: format(reportDate, 'yyyy-MM-dd'),
      participants_roll_numbers: rollNumbers,
      report_data: reportData,
      file_url: null,
    }, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Report created successfully',
        });
        // Reset form
        setTitle('');
        setReportDate(undefined);
        setParticipants('');
        setAgenda('');
        setDiscussions('');
        setDecisions('');
        setActionItems('');
        setNextMeetingDate(undefined);
        setEventDescription('');
        setEventOutcomes('');
        setAttendance('');
        setSummary('');
        setAchievements('');
        setChallenges('');
        setPlans('');
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to create report',
          variant: 'destructive',
        });
      },
    });
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
            Create New Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Fields */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold text-sm">Common Information</h4>
              
              <div>
                <Label htmlFor="title">Report Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter report title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="report-type">Report Type *</Label>
                <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mom">Minutes of Meeting (MOM)</SelectItem>
                    <SelectItem value="event">Event Report</SelectItem>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="yearly">Yearly Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !reportDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportDate ? format(reportDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={reportDate}
                      onSelect={setReportDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="participants">Participants Roll Numbers *</Label>
                <Textarea
                  id="participants"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="Enter roll numbers separated by commas (e.g., 001, 002, 003)"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Separate multiple roll numbers with commas</p>
              </div>
            </div>

            {/* Report Type Specific Fields */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold text-sm">Report Details</h4>
              
              {reportType === 'mom' && (
                <>
                  <div>
                    <Label htmlFor="agenda">Meeting Agenda</Label>
                    <Textarea
                      id="agenda"
                      value={agenda}
                      onChange={(e) => setAgenda(e.target.value)}
                      placeholder="What was discussed in the meeting?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discussions">Key Discussions</Label>
                    <Textarea
                      id="discussions"
                      value={discussions}
                      onChange={(e) => setDiscussions(e.target.value)}
                      placeholder="Main discussion points"
                    />
                  </div>
                  <div>
                    <Label htmlFor="decisions">Decisions Made</Label>
                    <Textarea
                      id="decisions"
                      value={decisions}
                      onChange={(e) => setDecisions(e.target.value)}
                      placeholder="What decisions were made?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="actionItems">Action Items</Label>
                    <Textarea
                      id="actionItems"
                      value={actionItems}
                      onChange={(e) => setActionItems(e.target.value)}
                      placeholder="Action items and responsibilities"
                    />
                  </div>
                  <div>
                    <Label>Next Meeting Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !nextMeetingDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {nextMeetingDate ? format(nextMeetingDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={nextMeetingDate}
                          onSelect={setNextMeetingDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}

              {reportType === 'event' && (
                <>
                  <div>
                    <Label htmlFor="eventDescription">Event Description</Label>
                    <Textarea
                      id="eventDescription"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Describe the event"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventOutcomes">Event Outcomes</Label>
                    <Textarea
                      id="eventOutcomes"
                      value={eventOutcomes}
                      onChange={(e) => setEventOutcomes(e.target.value)}
                      placeholder="What were the outcomes?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="attendance">Attendance Count</Label>
                    <Input
                      id="attendance"
                      value={attendance}
                      onChange={(e) => setAttendance(e.target.value)}
                      placeholder="Number of attendees"
                    />
                  </div>
                </>
              )}

              {(reportType === 'monthly' || reportType === 'yearly') && (
                <>
                  <div>
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Overall summary of the period"
                    />
                  </div>
                  <div>
                    <Label htmlFor="achievements">Achievements</Label>
                    <Textarea
                      id="achievements"
                      value={achievements}
                      onChange={(e) => setAchievements(e.target.value)}
                      placeholder="Key achievements during this period"
                    />
                  </div>
                  <div>
                    <Label htmlFor="challenges">Challenges</Label>
                    <Textarea
                      id="challenges"
                      value={challenges}
                      onChange={(e) => setChallenges(e.target.value)}
                      placeholder="Challenges faced"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plans">Future Plans</Label>
                    <Textarea
                      id="plans"
                      value={plans}
                      onChange={(e) => setPlans(e.target.value)}
                      placeholder="Plans for the next period"
                    />
                  </div>
                </>
              )}
            </div>

            <Button type="submit" disabled={creating} className="w-full">
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Report
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Existing Reports
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
                <div key={report.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{report.title}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {report.report_type === 'mom' ? 'MOM' : report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                        </span>
                        {report.report_date && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(report.report_date), 'PPP')}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Created: {format(new Date(report.created_at), 'PPP')}
                        </span>
                      </div>
                      {report.participants_roll_numbers && report.participants_roll_numbers.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Participants: {report.participants_roll_numbers.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(report.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {report.report_data && (
                    <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                      {Object.entries(report.report_data).map(([key, value]) => (
                        value && (
                          <div key={key}>
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                            <span className="text-muted-foreground">{String(value)}</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No reports created yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};