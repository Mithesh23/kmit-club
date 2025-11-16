import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useClub, useClubMembers, useAnnouncements, useEvents } from '@/hooks/useClubs';
import { useApprovedRegistrations } from '@/hooks/useClubRegistrations';
import { RegistrationDialog } from '@/components/RegistrationDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Users, Megaphone, Camera, Loader2, ImageIcon, GraduationCap, History } from 'lucide-react';
import { format, isPast } from 'date-fns';

const ClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  const { data: club, isLoading: clubLoading } = useClub(id!);
  const { data: members, isLoading: membersLoading } = useClubMembers(id!);
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements(id!);
  const { data: events, isLoading: eventsLoading } = useEvents(id!);
  const { data: approvedRegistrations, isLoading: registrationsLoading } = useApprovedRegistrations(id!);

  // Split events into current and past
  const currentEvents = events?.filter(event => !event.event_date || !isPast(new Date(event.event_date))) || [];
  const pastEvents = events?.filter(event => event.event_date && isPast(new Date(event.event_date))) || [];

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-light to-primary-100 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-glass border-b border-white/20 shadow-elegant">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="bg-white/50 hover:bg-white/80 backdrop-blur-sm border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clubs
            </Button>
          </div>
          
          <div className="flex items-start gap-6">
            {/* Club Icon */}
            <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-elegant">
              {club.name.charAt(0)}
            </div>
            
            <div className="flex-1">
              <h1 className="text-5xl font-display font-bold text-gradient mb-3">
                {club.name}
              </h1>
              {club.detailed_description && (
                <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl">
                  {club.detailed_description}
                </p>
              )}
              
              {/* Club Stats */}
              <div className="flex items-center gap-6 mt-6">
                <div className={`px-4 py-2 rounded-full ${
                  club.registration_open 
                    ? 'bg-success/10 text-success border border-success/20' 
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {club.registration_open ? '🟢 Registration Open' : '⭕ Registration Closed'}
                </div>
                <div className="text-sm text-muted-foreground">
                  📅 Est. {new Date(club.created_at).getFullYear()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Announcements */}
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-display">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Megaphone className="h-5 w-5 text-white" />
                  </div>
                  Latest News & Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {announcementsLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-muted-foreground">Loading announcements...</p>
                      </div>
                    </div>
                  ) : announcements && announcements.length > 0 ? (
                    <div className="space-y-6">
                      {announcements.map((announcement, index) => (
                        <div 
                          key={announcement.id} 
                          className="group relative p-6 bg-gradient-secondary rounded-xl border border-primary/10 hover:shadow-md transition-all duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-primary rounded-full" />
                          <h4 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                            {announcement.title}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed mb-3">
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(announcement.created_at), 'PPP')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Megaphone className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h4 className="font-display font-semibold text-lg mb-2">No Announcements Yet</h4>
                      <p className="text-muted-foreground">Check back soon for exciting updates!</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Events */}
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-display">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  Club Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-muted-foreground">Loading events...</p>
                    </div>
                  </div>
                ) : (
                  <Tabs defaultValue="current" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="current">Current Events</TabsTrigger>
                      <TabsTrigger value="past">
                        <History className="h-4 w-4 mr-2" />
                        Past Events
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="current">
                      {currentEvents.length > 0 ? (
                        <div className="space-y-8">
                          {currentEvents.map((event, index) => (
                            <div 
                              key={event.id} 
                              className="group relative p-6 bg-gradient-secondary rounded-xl border border-primary/10 hover:shadow-md transition-all duration-300 cursor-pointer"
                              style={{ animationDelay: `${index * 100}ms` }}
                              onClick={() => navigate(`/club/${id}/event/${event.id}`)}
                            >
                              <div className="absolute left-0 top-0 w-1 h-full bg-gradient-primary rounded-full" />
                              
                              <div className="mb-4">
                                <h4 className="font-display font-semibold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                                  {event.title}
                                </h4>
                                <p className="text-muted-foreground leading-relaxed mb-3">
                                  {event.description.length > 150 
                                    ? `${event.description.substring(0, 150)}...` 
                                    : event.description
                                  }
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {event.event_date ? format(new Date(event.event_date), 'PPP') : format(new Date(event.created_at), 'PPP')}
                                  </div>
                                  <div className="text-primary text-sm font-medium group-hover:text-primary/80">
                                    View Details →
                                  </div>
                                </div>
                              </div>

                              {event.event_images && event.event_images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                  {event.event_images.map((image, imgIndex) => (
                                    <div 
                                      key={image.id} 
                                      className="relative group/img overflow-hidden rounded-lg"
                                      style={{ animationDelay: `${(index * 100) + (imgIndex * 50)}ms` }}
                                    >
                                      <img
                                        src={image.image_url}
                                        alt="Event"
                                        className="w-full h-32 object-cover transition-transform duration-300 group-hover/img:scale-110"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                                        <Camera className="h-5 w-5 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 bg-gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h4 className="font-display font-semibold text-lg mb-2">No Current Events</h4>
                          <p className="text-muted-foreground">Exciting events are being planned!</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="past">
                      {pastEvents.length > 0 ? (
                        <div className="space-y-8">
                          {pastEvents.map((event, index) => (
                            <div 
                              key={event.id} 
                              className="group relative p-6 bg-gradient-secondary rounded-xl border border-primary/10 hover:shadow-md transition-all duration-300 cursor-pointer opacity-75"
                              style={{ animationDelay: `${index * 100}ms` }}
                              onClick={() => navigate(`/club/${id}/event/${event.id}`)}
                            >
                              <div className="absolute left-0 top-0 w-1 h-full bg-muted rounded-full" />
                              
                              <div className="mb-4">
                                <h4 className="font-display font-semibold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                                  {event.title}
                                </h4>
                                <p className="text-muted-foreground leading-relaxed mb-3">
                                  {event.description.length > 150 
                                    ? `${event.description.substring(0, 150)}...` 
                                    : event.description
                                  }
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {event.event_date && format(new Date(event.event_date), 'PPP')}
                                  </div>
                                  <Badge variant="secondary">Completed</Badge>
                                </div>
                              </div>

                              {event.event_images && event.event_images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                  {event.event_images.map((image, imgIndex) => (
                                    <div 
                                      key={image.id} 
                                      className="relative group/img overflow-hidden rounded-lg"
                                      style={{ animationDelay: `${(index * 100) + (imgIndex * 50)}ms` }}
                                    >
                                      <img
                                        src={image.image_url}
                                        alt="Event"
                                        className="w-full h-32 object-cover transition-transform duration-300 group-hover/img:scale-110"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                                        <Camera className="h-5 w-5 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 bg-gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                            <History className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h4 className="font-display font-semibold text-lg mb-2">No Past Events</h4>
                          <p className="text-muted-foreground">Past events will appear here once they are completed.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
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