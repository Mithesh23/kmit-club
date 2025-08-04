import { useParams, useNavigate } from 'react-router-dom';
import { useClub, useClubMembers, useAnnouncements, useEvents } from '@/hooks/useClubs';
import { RegistrationDialog } from '@/components/RegistrationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Calendar, Users, Megaphone, Camera, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const ClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: club, isLoading: clubLoading } = useClub(id!);
  const { data: members, isLoading: membersLoading } = useClubMembers(id!);
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements(id!);
  const { data: events, isLoading: eventsLoading } = useEvents(id!);

  if (clubLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Club Not Found</h2>
          <p className="text-muted-foreground mb-4">The club you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clubs
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-primary">{club.name}</h1>
          {club.detailed_description && (
            <p className="text-muted-foreground mt-2 max-w-3xl">
              {club.detailed_description}
            </p>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Latest News & Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {announcementsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : announcements && announcements.length > 0 ? (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="border-l-4 border-primary pl-4">
                          <h4 className="font-semibold text-foreground">{announcement.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(announcement.created_at), 'PPP')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No announcements yet.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Club Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="space-y-6">
                    {events.map((event) => (
                      <div key={event.id} className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(event.created_at), 'PPP')}
                          </p>
                        </div>
                        {event.event_images && event.event_images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {event.event_images.map((image) => (
                              <div key={image.id} className="relative group">
                                <img
                                  src={image.image_url}
                                  alt="Event"
                                  className="w-full h-24 object-cover rounded-md"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                  <Camera className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {event !== events[events.length - 1] && <Separator />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No events yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration */}
            <Card>
              <CardHeader>
                <CardTitle>Join This Club</CardTitle>
              </CardHeader>
              <CardContent>
                <RegistrationDialog club={club} />
              </CardContent>
            </Card>

            {/* Club Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Club Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : members && members.length > 0 ? (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{member.name}</span>
                        <Badge variant="secondary">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No members listed yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;