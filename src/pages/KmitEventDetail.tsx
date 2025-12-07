import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { transformImageUrl } from '@/lib/utils';

const KmitEventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const numericId = id ? parseInt(id, 10) : null;

  const { data: event, isLoading } = useQuery({
    queryKey: ["kmit_event", numericId],
    queryFn: async () => {
      const { data, error } = await supabase.from("kmit_events").select("*").eq("id", numericId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!numericId,
  });

  const { data: imagesData } = useQuery({
    queryKey: ["kmit_event_images", numericId],
    queryFn: async () => {
      const { data } = await supabase.from("kmit_event_images").select("*").eq("event_id", numericId!).order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!numericId,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Event not found</h2>
          <Button onClick={() => navigate("/kmit-events")}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/40 backdrop-blur-xl border-b border-border shadow-elegant">
        <div className="container mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-gradient">{event.name}</h1>
            <div className="w-32 h-1 bg-gradient-primary mt-3 rounded-full"></div>
          </div>
          <div>
            <Button variant="ghost" onClick={() => navigate("/kmit-events")}><ArrowLeft /> Back</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="card-neon rounded-2xl p-8 bg-white/80 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-muted-foreground"><CalendarIcon /></div>
            <div>{event.date ? format(parseISO(event.date), "PPPP") : "Date not set"}</div>
          </div>

          <div className="prose max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed">{event.description}</p>
          </div>

          {/* Images */}
          <div className="mt-8">
            {imagesData && imagesData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {imagesData.map((img: any) => (
                  <div key={img.id} className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <img 
                      src={transformImageUrl(img.image_url)} 
                      alt="event" 
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', img.image_url);
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="mx-auto w-32 h-32 rounded-3xl bg-card border-2 border-primary/30 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold mt-6 text-gradient">Photos Coming Soon</h3>
                <p className="text-muted-foreground mt-2">No images uploaded for this event yet.</p>
              </div>
            )}

            {/* View Full Gallery Button (Drive Link) - Always shown if drive_link exists */}
            {event.drive_link && (
              <div className="mt-8 flex justify-center">
                <Button
                  className="px-8 py-3 text-lg bg-primary text-white hover:bg-primary/90 shadow-lg rounded-xl"
                  onClick={() => window.open(event.drive_link, "_blank")}
                >
                  View Full Gallery
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

function CalendarIcon() {
  return (
    <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 11h5v5H7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export default KmitEventDetail;
