import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Camera, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '@/types/club';
import { EventRegistrationDialog } from '@/components/EventRegistrationDialog';

const EventDetail = () => {
  const { eventId, clubId } = useParams<{ eventId: string; clubId: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async (): Promise<Event | null> => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_images(*)
        `)
        .eq('id', eventId!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(`/club/${clubId}`)}>Back to Club</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Professional Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/15 rounded-full blur-3xl animate-float opacity-80" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float opacity-40" style={{ animationDelay: '4s' }} />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="professional-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#professional-grid)" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <header className="relative bg-card/50 backdrop-blur-glass border-b border-border shadow-elegant">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/club/${clubId}`)}
              className="bg-card/50 hover:bg-card/80 backdrop-blur-sm border border-border"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Club
            </Button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-display font-bold text-gradient text-neon">
                {event.title}
              </h1>
              <div className="w-24 h-2 bg-gradient-primary rounded-full glow-primary"></div>
            </div>
            
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span className="text-lg font-medium">
                {format(new Date(event.created_at), 'PPPP')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Event Content */}
      <main className="relative py-16">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Event Description */}
          <div className="mb-16 animate-fade-in">
            <div className="card-neon p-12 rounded-3xl space-y-6 glow-primary">
              <h2 className="text-3xl font-display font-bold text-gradient mb-6">Event Details</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          {/* Event Registration */}
          <div className="mb-16 animate-fade-in">
            <div className="max-w-md mx-auto">
              <EventRegistrationDialog 
                eventId={event.id} 
                eventTitle={event.title}
                registrationOpen={event.registration_open ?? true}
              />
            </div>
          </div>

          {/* Event Images */}
          {event.event_images && event.event_images.length > 0 && (
            <div className="animate-slide-up">
              <div className="text-center mb-12 space-y-4">
                <h2 className="text-4xl md:text-5xl font-display font-bold">
                  Event <span className="text-gradient text-neon">Gallery</span>
                </h2>
                <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full glow-primary" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {event.event_images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="group relative overflow-hidden rounded-2xl card-neon hover-lift glow-accent"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={image.image_url}
                        alt={`${event.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                      <div className="text-white text-center space-y-2">
                        <Camera className="h-6 w-6 mx-auto" />
                        <p className="text-sm font-medium">View Full Size</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Images State */}
          {(!event.event_images || event.event_images.length === 0) && (
            <div className="text-center py-24 animate-fade-in">
              <div className="w-32 h-32 mx-auto rounded-3xl bg-card border-2 border-primary/30 flex items-center justify-center glow-primary">
                <Camera className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-4 mt-8">
                <h3 className="text-3xl font-display font-bold text-gradient">Photos Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-lg leading-relaxed">
                  Event photos will be shared here after the event.
                  <span className="block mt-2 text-primary font-semibold">
                    Stay tuned for amazing moments!
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="relative bg-card/50 backdrop-blur-glass border-t border-border shadow-elegant mt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <h4 className="text-2xl font-display font-bold text-gradient">KMIT Club Events</h4>
              <div className="w-16 h-1 bg-gradient-primary mx-auto rounded-full glow-primary"></div>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg max-w-2xl mx-auto">
              Creating memorable experiences and fostering community connections through engaging events.
            </p>
            <div className="border-t border-border pt-8">
              <p className="text-muted-foreground">
                © 2024 Keshav Memorial Institute of Technology. 
                <span className="text-primary font-semibold"> Crafting Excellence.</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EventDetail;