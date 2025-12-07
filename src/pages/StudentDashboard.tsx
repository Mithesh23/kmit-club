import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogOut, Users, Calendar, FileText, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useStudentAttendance } from '@/hooks/useAttendance';
import { StudentProfileDialog } from '@/components/StudentProfileDialog';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import kmitLogo from '@/assets/kmit-logo.png';
import { transformImageUrl } from '@/lib/utils';

interface StudentClub {
  id: string;
  club_id: string;
  student_name: string;
  student_email: string;
  phone: string | null;
  roll_number: string;
  year: string;
  branch: string;
  created_at: string;
  club: {
    id: string;
    name: string;
    short_description: string | null;
    logo_url: string | null;
  };
}

interface StudentReport {
  id: string;
  title: string;
  report_type: string;
  report_date: string | null;
  created_at: string;
  club: {
    name: string;
  };
}

const StudentDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [clubs, setClubs] = useState<StudentClub[]>([]);
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [rollNumber, setRollNumber] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: attendedEvents, isLoading: attendanceLoading } = useStudentAttendance(rollNumber || '');

  useEffect(() => {
    const token = localStorage.getItem('student_auth_token');
    const storedRollNumber = localStorage.getItem('student_roll_number');
    
    if (!token || !storedRollNumber) {
      navigate('/student/login');
      return;
    }
    
    setRollNumber(storedRollNumber);
    fetchStudentData(storedRollNumber);
  }, [navigate]);

  const fetchStudentData = async (roll: string) => {
    setIsLoading(true);
    try {
      // Fetch approved club registrations for this student
      const { data: registrations, error: regError } = await supabase
        .from('club_registrations')
        .select(`
          id,
          club_id,
          student_name,
          student_email,
          phone,
          roll_number,
          year,
          branch,
          created_at,
          club:clubs(id, name, short_description, logo_url)
        `)
        .eq('roll_number', roll)
        .eq('status', 'approved');

      if (regError) throw regError;
      
      // Type assertion to handle the joined data
      setClubs((registrations as unknown as StudentClub[]) || []);

      // Fetch reports where this student participated
      const { data: reportsData, error: reportsError } = await supabase
        .from('club_reports')
        .select(`
          id,
          title,
          report_type,
          report_date,
          created_at,
          club:clubs(name)
        `)
        .contains('participants_roll_numbers', [roll])
        .order('created_at', { ascending: false })
        .limit(10);

      if (reportsError) throw reportsError;
      
      setReports((reportsData as unknown as StudentReport[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_auth_token');
    localStorage.removeItem('student_roll_number');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    navigate('/student/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-light to-primary-100 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-glass border-b border-white/20 shadow-elegant">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={kmitLogo} alt="KMIT Logo" className="h-12 w-auto" />
              <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center text-white text-xl font-bold">
                {clubs[0]?.student_name?.charAt(0)?.toUpperCase() || rollNumber?.charAt(0) || 'S'}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gradient">
                  {clubs[0]?.student_name || 'Student Dashboard'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {rollNumber}
                  </span>
                  {clubs[0]?.year && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="secondary" className="text-xs">
                        {clubs[0].year}
                      </Badge>
                    </>
                  )}
                  {clubs[0]?.branch && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-xs">
                        {clubs[0].branch}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StudentProfileDialog
                rollNumber={rollNumber || ''}
                currentEmail={clubs[0]?.student_email}
                currentPhone={clubs[0]?.phone}
                onUpdate={() => rollNumber && fetchStudentData(rollNumber)}
              />
              <ChangePasswordDialog 
                userType="student" 
                identifier={rollNumber || ''} 
              />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Clubs */}
          <div className="lg:col-span-2">
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-display">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  My Clubs
                </CardTitle>
                <CardDescription>
                  Clubs you are a member of
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clubs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clubs.map((membership) => (
                      <div
                        key={membership.id}
                        className="group p-4 bg-gradient-secondary rounded-xl border border-primary/10 hover:shadow-md transition-all duration-300 cursor-pointer"
                        onClick={() => navigate(`/club/${membership.club_id}`)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                            {membership.club?.logo_url ? (
                              <img 
                                src={transformImageUrl(membership.club.logo_url)} 
                                alt={membership.club?.name || 'Club'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              membership.club?.name?.charAt(0) || 'C'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {membership.club?.name || 'Unknown Club'}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {membership.club?.short_description || 'No description available'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {membership.year}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {membership.branch}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Joined: {format(new Date(membership.created_at), 'PP')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-display font-semibold text-lg mb-2">No Clubs Yet</h4>
                    <p className="text-muted-foreground mb-4">
                      You haven't been approved for any clubs yet.
                    </p>
                    <Button onClick={() => navigate('/')}>
                      Browse Clubs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-sm">Total Clubs</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">{clubs.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm">Events Attended</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{attendedEvents?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm">Reports</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">{reports.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attended Events */}
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Events Attended
                </CardTitle>
                <CardDescription>
                  Your attendance history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : attendedEvents && attendedEvents.length > 0 ? (
                  <div className="space-y-3">
                    {attendedEvents.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <h4 className="font-medium text-sm truncate">{event.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Attended
                          </Badge>
                          {event.club?.name && (
                            <span className="text-xs text-muted-foreground">
                              {event.club.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.event_date), 'PP')}
                          <Clock className="h-3 w-3 ml-2" />
                          {event.event_time}
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No attendance records yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  <FileText className="h-5 w-5" />
                  Recent Reports
                </CardTitle>
                <CardDescription>
                  Reports you participated in
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.slice(0, 5).map((report) => (
                      <div
                        key={report.id}
                        className="p-3 bg-gradient-secondary rounded-lg border border-primary/10 cursor-pointer hover:shadow-sm transition-all"
                        onClick={() => navigate(`/report/${report.id}`)}
                      >
                        <h4 className="font-medium text-sm truncate">{report.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {report.report_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {report.club?.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.report_date 
                            ? format(new Date(report.report_date), 'PP')
                            : format(new Date(report.created_at), 'PP')
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No reports yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
