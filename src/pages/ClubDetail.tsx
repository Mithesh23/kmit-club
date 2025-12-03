import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClub, useClubMembers, useAnnouncements, useEvents } from '@/hooks/useClubs';
import { useApprovedRegistrations } from '@/hooks/useClubRegistrations';
import { RegistrationDialog } from '@/components/RegistrationDialog';
import { ClubCalendar } from '@/components/ClubCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, Users, Megaphone, Camera, Loader2, ImageIcon, GraduationCap, History } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

const ClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  const { data: club, isLoading: clubLoading } = useClub(id!);
  const { data: members, isLoading: membersLoading } = useClubMembers(id!);
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements(id!);
  const { data: events, isLoading: eventsLoading } = useEvents(id!);
  const { data: approvedRegistrations, isLoading: registrationsLoading } = useApprovedRegistrations(id!);

  // Filter events into upcoming and past based on event_date
  const { upcomingEvents, pastEvents } = useMemo(() => {
    if (!events) return { upcomingEvents: [], pastEvents: [] };
    
    const now = new Date();
    const upcoming: typeof events = [];
    const past: typeof events = [];
    
    events.forEach(event => {
      if (event.event_date) {
        const eventDate = parseISO(event.event_date);
        if (isPast(eventDate)) {
          past.push(event);
        } else {
          upcoming.push(event);
        }
      } else {
        // Events without date go to upcoming by default
        upcoming.push(event);
      }
    });
    
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

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
              className="bg-white/50 hover:bg-orange/80 backdrop-blur-sm border border-white/20"
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

            {/* Upcoming Events */}
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-2xl font-display">
                    <div className="p-2 bg-gradient-primary rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    {showPastEvents ? 'Past Events' : 'Upcoming Events'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPastEvents(!showPastEvents)}
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    {showPastEvents ? 'View Upcoming' : 'View Past Events'}
                    {!showPastEvents && pastEvents.length > 0 && (
                      <Badge variant="secondary" className="ml-1">{pastEvents.length}</Badge>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-muted-foreground">Loading events...</p>
                    </div>
                  </div>
                ) : (showPastEvents ? pastEvents : upcomingEvents).length > 0 ? (
                  <div className="space-y-8">
                    {(showPastEvents ? pastEvents : upcomingEvents).map((event, index) => (
                      <div 
                        key={event.id} 
                        className="group relative p-6 bg-gradient-secondary rounded-xl border border-primary/10 hover:shadow-md transition-all duration-300 cursor-pointer"
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => navigate(`/club/${id}/event/${event.id}`)}
                      >
                        <div className={`absolute left-0 top-0 w-1 h-full rounded-full ${showPastEvents ? 'bg-muted-foreground' : 'bg-gradient-primary'}`} />
                        
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-display font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                              {event.title}
                            </h4>
                            {showPastEvents && (
                              <Badge variant="secondary" className="text-xs">Completed</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground leading-relaxed mb-3">
                            {event.description.length > 150 
                              ? `${event.description.substring(0, 150)}...` 
                              : event.description
                            }
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {event.event_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {format(parseISO(event.event_date), 'PPP')}
                                </span>
                              )}
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
                    <h4 className="font-display font-semibold text-lg mb-2">
                      {showPastEvents ? 'No Past Events' : 'No Upcoming Events'}
                    </h4>
                    <p className="text-muted-foreground">
                      {showPastEvents 
                        ? 'No events have been completed yet.' 
                        : 'Exciting events are being planned!'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Club Calendar */}
            {events && events.length > 0 && (
              <ClubCalendar events={events} clubId={id!} />
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Registration */}
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-display">Join This Club</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Become part of our amazing community
                </p>
              </CardHeader>
              <CardContent>
                <RegistrationDialog club={club} />
              </CardContent>
            </Card>

            {/* Club Members */}
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-display">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Club Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-muted-foreground text-sm">Loading members...</p>
                    </div>
                  </div>
                ) : members && members.length > 0 ? (
                  <div className="space-y-4">
                    {members.map((member, index) => (
                      <div 
                        key={member.id} 
                        className="group flex items-center justify-between p-4 bg-gradient-secondary rounded-lg border border-primary/10 hover:shadow-sm transition-all duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {member.name.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {member.name}
                          </span>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/20 transition-colors"
                        >
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gradient-secondary rounded-full mx-auto mb-3 flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-display font-semibold mb-1">No Members Listed</h4>
                    <p className="text-muted-foreground text-sm">Members will appear here soon!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approved Members */}
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-display">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  Club Members List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-primary hover:shadow-elegant transition-all"
                    >
                      View Members
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-display">Approved Members</DialogTitle>
                    </DialogHeader>
                    <div className="pt-4">
                      {registrationsLoading ? (
                        <div className="flex items-center justify-center h-40">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : approvedRegistrations && approvedRegistrations.length > 0 ? (
                        <div className="rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Roll Number</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Year</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {approvedRegistrations.map((registration) => (
                                <TableRow key={registration.id}>
                                  <TableCell className="font-medium">{registration.student_name}</TableCell>
                                  <TableCell>{registration.roll_number || 'N/A'}</TableCell>
                                  <TableCell>{registration.branch || 'N/A'}</TableCell>
                                  <TableCell>{registration.year || 'N/A'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                            <GraduationCap className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h4 className="font-display font-semibold text-lg mb-2">No Approved Members Yet</h4>
                          <p className="text-muted-foreground">Approved members will appear here</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Club Gallery */}
            <Card className="card-elegant border-0 shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-3 text-xl font-display">
                  <div className="p-2 bg-gradient-primary rounded-lg">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  Club Gallery
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-2">
                  View all event photos
                </p>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-primary hover:shadow-elegant transition-all"
                    >
                      View Gallery
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
                      <DialogTitle className="text-3xl font-display text-center">
                        <span className="text-gradient">Club Gallery</span>
                      </DialogTitle>
                      <p className="text-muted-foreground text-center mt-2">
                        Explore our collection of memorable moments
                      </p>
                    </DialogHeader>
                    <ScrollArea className="h-[calc(95vh-120px)] px-6">
                      <div className="py-6">
                        {eventsLoading ? (
                          <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                              <p className="text-muted-foreground text-lg">Loading gallery...</p>
                            </div>
                          </div>
                        ) : events && events.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.flatMap((event) => 
                              event.event_images && event.event_images.length > 0 
                                ? event.event_images.map((image, index) => (
                                    <div 
                                      key={image.id} 
                                      className="group relative overflow-hidden rounded-2xl border border-primary/20 hover:border-primary/40 transition-all duration-500 shadow-md hover:shadow-2xl animate-fade-in"
                                      style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                      <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                          src={image.image_url}
                                          alt={event.title}
                                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                      </div>
                                      
                                      <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h4 className="text-white text-lg font-display font-bold mb-1 drop-shadow-lg">
                                          {event.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-white/90 text-sm">
                                          <Calendar className="h-3.5 w-3.5" />
                                          <span className="drop-shadow">{format(new Date(event.created_at), 'PPP')}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                : []
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-24">
                            <div className="w-24 h-24 bg-gradient-secondary rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h4 className="font-display font-semibold text-2xl mb-3">No Images Yet</h4>
                            <p className="text-muted-foreground text-lg">Gallery images will appear here soon!</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;