import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Users, Clock, FileText, Loader2, CheckCircle2, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminRegistrations, useCreateReport } from '@/hooks/useAdminClubData';
import { useAttendanceEvents, useCreateAttendanceEvent, useCreateAttendanceRecords, useDeleteAttendanceEvent } from '@/hooks/useAttendance';

interface AttendanceManagerProps {
  clubId: string;
}

export const AttendanceManager = ({ clubId }: AttendanceManagerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [eventTime, setEventTime] = useState('10:00');
  const [duration, setDuration] = useState('60');
  const [selectedRollNumbers, setSelectedRollNumbers] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { toast } = useToast();
  const { data: registrations, isLoading: registrationsLoading } = useAdminRegistrations(clubId);
  const { data: attendanceEvents, isLoading: eventsLoading } = useAttendanceEvents(clubId);
  const createAttendanceEvent = useCreateAttendanceEvent();
  const createAttendanceRecords = useCreateAttendanceRecords();
  const createReport = useCreateReport();
  const deleteAttendanceEvent = useDeleteAttendanceEvent();

  // Get approved students with roll numbers
  const approvedStudents = useMemo(() => {
    if (!registrations) return [];
    return registrations
      .filter(r => r.status === 'approved' && r.roll_number)
      .map(r => ({
        roll_number: r.roll_number!,
        name: r.student_name,
      }));
  }, [registrations]);

  const toggleRollNumber = (rollNumber: string) => {
    setSelectedRollNumbers(prev => 
      prev.includes(rollNumber) 
        ? prev.filter(r => r !== rollNumber)
        : [...prev, rollNumber]
    );
  };

  const selectAll = () => {
    setSelectedRollNumbers(approvedStudents.map(s => s.roll_number));
  };

  const deselectAll = () => {
    setSelectedRollNumbers([]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Please enter an event title.", variant: "destructive" });
      return;
    }
    if (!eventDate) {
      toast({ title: "Error", description: "Please select a date.", variant: "destructive" });
      return;
    }
    if (selectedRollNumbers.length === 0) {
      toast({ title: "Error", description: "Please mark at least one student as present.", variant: "destructive" });
      return;
    }

    try {
      // Create attendance event
      const attendanceEvent = await createAttendanceEvent.mutateAsync({
        club_id: clubId,
        title: title.trim(),
        description: description.trim() || null,
        event_date: format(eventDate, 'yyyy-MM-dd'),
        event_time: eventTime,
        duration_minutes: parseInt(duration),
      });

      // Create attendance records for present students
      await createAttendanceRecords.mutateAsync({
        attendance_event_id: attendanceEvent.id,
        roll_numbers: selectedRollNumbers,
      });

      // Create a report for this attendance
      await createReport.mutateAsync({
        club_id: clubId,
        title: `Attendance: ${title.trim()}`,
        report_type: 'event',
        file_url: null,
        report_date: format(eventDate, 'yyyy-MM-dd'),
        participants_roll_numbers: selectedRollNumbers,
        report_data: {
          type: 'attendance',
          event_title: title.trim(),
          description: description.trim(),
          event_time: eventTime,
          duration_minutes: parseInt(duration),
          total_present: selectedRollNumbers.length,
          total_members: approvedStudents.length,
          attendance_percentage: Math.round((selectedRollNumbers.length / approvedStudents.length) * 100),
        },
      });

      toast({ title: "Success", description: "Attendance recorded successfully!" });
      
      // Reset form
      setTitle('');
      setDescription('');
      setEventDate(undefined);
      setEventTime('10:00');
      setDuration('60');
      setSelectedRollNumbers([]);
      setShowForm(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to record attendance.", variant: "destructive" });
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    
    try {
      await deleteAttendanceEvent.mutateAsync(eventId);
      toast({ title: "Success", description: "Attendance record deleted." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete.", variant: "destructive" });
    }
  };

  const filteredEvents = useMemo(() => {
    if (!attendanceEvents) return [];
    if (filterStatus === 'all') return attendanceEvents;
    // Add more filters as needed
    return attendanceEvents;
  }, [attendanceEvents, filterStatus]);

  if (registrationsLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Attendance Management</h2>
          <p className="text-sm text-muted-foreground">Mark attendance for club events and activities</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Cancel' : 'Mark Attendance'}
        </Button>
      </div>

      {/* Create Attendance Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Mark Attendance
            </CardTitle>
            <CardDescription>Record attendance for a club event or activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Weekly Meeting, Workshop, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventDate ? format(eventDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventDate}
                      onSelect={setEventDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="15"
                  step="15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what was covered in this session..."
                rows={3}
              />
            </div>

            {/* Roll Number Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Mark Present Students</Label>
                  <p className="text-sm text-muted-foreground">
                    Click on roll numbers to mark students as present ({selectedRollNumbers.length}/{approvedStudents.length} selected)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              {approvedStudents.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg max-h-64 overflow-y-auto">
                  {approvedStudents.map((student) => (
                    <Button
                      key={student.roll_number}
                      variant={selectedRollNumbers.includes(student.roll_number) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleRollNumber(student.roll_number)}
                      className={cn(
                        "transition-all",
                        selectedRollNumbers.includes(student.roll_number) 
                          ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                          : "hover:border-green-500"
                      )}
                    >
                      {student.roll_number}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No approved members with roll numbers found.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createAttendanceEvent.isPending || createAttendanceRecords.isPending || createReport.isPending}
              >
                {(createAttendanceEvent.isPending || createAttendanceRecords.isPending || createReport.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Submit Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Attendance History
              </CardTitle>
              <CardDescription>Past attendance records for this club</CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEvents && filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {format(new Date(event.event_date), 'PP')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.event_time}
                        </span>
                        <span>{event.duration_minutes} mins</span>
                      </div>
                      {event.attendance_records && (
                        <div className="mt-2">
                          <Badge variant="secondary">
                            {event.attendance_records.length} Present
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-semibold text-lg mb-2">No Attendance Records</h4>
              <p className="text-muted-foreground">
                Start by marking attendance for your first event.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
