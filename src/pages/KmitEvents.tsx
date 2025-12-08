
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Calendar, Loader2, Ticket } from "lucide-react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import kmitLogo from "@/assets/kmit-logo.png";

export default function KmitEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const fixedOrder = ["KMIT Evening", "NAVRAAS", "PATANG UTHSAV"];

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    const { data, error } = await supabase.from("kmit_events").select("*").order("date", { ascending: true });
    if (!error) setEvents(data || []);
    setLoading(false);
  }

  // get latest event per category (newest by date)
  function getEvent(category: string) {
    const filtered = events
      .filter((ev) => ev.category === category)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return filtered[0] || null;
  }

  // compute years present
  const years = Array.from(new Set(events.map((e) => e.year))).sort((a: any, b: any) => b - a);

  // filtered list for past / archive link
  const filteredEvents = events.filter((ev) => {
    if (filterYear !== "all" && String(ev.year) !== String(filterYear)) return false;
    if (filterCategory !== "all" && ev.category !== filterCategory) return false;
    return true;
  });

  // Check if event date has passed (event is in the past)
  function isEventPast(eventDate: string) {
    return isBefore(parseISO(eventDate), startOfDay(new Date()));
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* background blobs (same style) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="-right-40 top-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float opacity-60"></div>
      </div>

      {/* header */}
      <header className="relative bg-card/40 backdrop-blur-xl border-b border-border shadow-xl">
        <div className="container mx-auto px-6 py-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={kmitLogo} alt="KMIT Logo" className="h-14 w-auto" />
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient">KMIT Major Events</h1>
              <div className="w-32 h-1 bg-gradient-primary rounded-full mt-2"></div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select className="border rounded-md p-2" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="all">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

            <select className="border rounded-md p-2" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All categories</option>
              <option value="KMIT Evening">KMIT Evening</option>
              <option value="NAVRAAS">NAVRAAS</option>
              <option value="PATANG UTHSAV">PATANG UTSAV</option>
            </select>

            <Button onClick={() => navigate("/kmit-events/past")}>Past Events</Button>
            <Button onClick={() => navigate("/")}>Home</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-7xl">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {fixedOrder.map((category) => {
              // if filters are enabled and exclude this category/year, hide or show fallback
              if (filterCategory !== "all" && filterCategory !== category) {
                return null;
              }
              const ev = getEvent(category);
              if (filterYear !== "all" && ev && String(ev.year) !== String(filterYear)) {
                // if the latest event for this category does not match year, show fallback
                return (
                  <div key={category} className="card-neon bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl p-8">
                    <h2 className="text-3xl font-bold">{category}</h2>
                    <Badge className="mt-2">{category}</Badge>
                    <p className="mt-4 text-muted-foreground">No event for selected filters.</p>
                  </div>
                );
              }

              const isPast = ev?.date ? isEventPast(ev.date) : false;
              const showTicketButton = ev?.ticket_url && ev?.category === "NAVRAAS" && !isPast;

              return (
                <div key={category} className="card-neon bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl p-8">
                  <h2 className="text-3xl font-display font-bold text-gradient mb-2">{ev ? ev.name : category}</h2>
                  <Badge className="mb-4">{category}</Badge>

                  <div className="flex items-center gap-3 text-muted-foreground mb-6">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>{ev?.date ? format(parseISO(ev.date), "PPPP") : "Date not added"}</span>
                  </div>

                  <p className="text-muted-foreground min-h-[80px]">
                    {ev?.description || "This event has not been added by the mentor yet."}
                  </p>

                  <div className="mt-6 space-y-3">
                    {/* Grab your Pass button - only for NAVRAAS with ticket_url and not past */}
                    {showTicketButton && (
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                        onClick={() => window.open(ev.ticket_url, "_blank")}
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        Grab your Pass
                      </Button>
                    )}

                    {ev ? (
                      <Button className="w-full" variant={showTicketButton ? "outline" : "default"} onClick={() => navigate(`/kmit-events/${ev.id}`)}>View Details</Button>
                    ) : (
                      <Button disabled className="w-full opacity-60">Coming Soon</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
