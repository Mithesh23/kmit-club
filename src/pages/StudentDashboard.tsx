import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { useStudentClubs, useStudentAttendance } from '@/hooks/useStudentData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, Users, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

const StudentDashboard = () => {
  const { session, logout, loading } = useStudentAuth();
  const navigate = useNavigate();
  const { data: clubs, isLoading: clubsLoading } = useStudentClubs();
  const { data: attendance, isLoading: attendanceLoading } = useStudentAttendance();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/student/login');
    }
  }, [session, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  if (loading || !session) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">Roll Number: {session.roll_number}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* My Clubs Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">My Clubs</h2>
          </div>
          {clubsLoading ? (
            <p className="text-muted-foreground">Loading clubs...</p>
          ) : clubs && clubs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clubs.map((registration: any) => (
                <Card 
                  key={registration.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/club/${registration.club.id}`)}
                >
                  <CardHeader>
                    {registration.club.logo_url && (
                      <img
                        src={registration.club.logo_url}
                        alt={registration.club.name}
                        className="w-16 h-16 object-contain mb-2"
                      />
                    )}
                    <CardTitle>{registration.club.name}</CardTitle>
                    <CardDescription>{registration.club.short_description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  You are not part of any clubs yet. Register for clubs to see them here.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        <Separator />

        {/* Attendance Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Attendance</h2>
          </div>
          {attendanceLoading ? (
            <p className="text-muted-foreground">Loading attendance...</p>
          ) : attendance && attendance.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Participation Records</CardTitle>
                <CardDescription>
                  Events and meetings where your attendance was recorded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendance.map((record: any) => (
                    <div
                      key={record.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">{record.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {record.club.name}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{record.report_type.toUpperCase()}</Badge>
                          {record.report_date && (
                            <Badge variant="secondary">
                              {format(new Date(record.report_date), 'MMM dd, yyyy')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No attendance records found. Your participation in events and meetings will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
