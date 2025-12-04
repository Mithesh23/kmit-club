import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClubAuth } from '@/hooks/useClubAuth';
import { useAdminClub } from '@/hooks/useAdminClubData';
import { ClubInfoEdit } from '@/components/admin/ClubInfoEdit';
import { AnnouncementsManager } from '@/components/admin/AnnouncementsManager';
import { MembersManager } from '@/components/admin/MembersManager';
import { EventsManager } from '@/components/admin/EventsManager';
import { RegistrationsView } from '@/components/admin/RegistrationsView';
import { ReportsManager } from '@/components/admin/ReportsManager';
import { AttendanceManager } from '@/components/admin/AttendanceManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Settings, Users, Calendar, Megaphone, UserCheck, FileText, Loader2, ClipboardCheck } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { session, logout, loading } = useClubAuth();
  const { data: club, isLoading: clubLoading } = useAdminClub(session?.club_id || '');

  useEffect(() => {
    if (!loading && !session?.success) {
      navigate('/');
    }
  }, [session, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading || clubLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.success || !club) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{club.name} - Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your club information and activities</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(`/club/${club.id}`)}>
              View Public Page
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white shadow-sm">
            <TabsTrigger value="info" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-4 w-4" />
              Club Info
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardCheck className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserCheck className="h-4 w-4" />
              Registrations
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <ClubInfoEdit club={club} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsManager clubId={club.id} />
          </TabsContent>

          <TabsContent value="members">
            <MembersManager clubId={club.id} />
          </TabsContent>

          <TabsContent value="events">
            <EventsManager clubId={club.id} />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceManager clubId={club.id} />
          </TabsContent>

          <TabsContent value="registrations">
            <RegistrationsView clubId={club.id} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsManager clubId={club.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;