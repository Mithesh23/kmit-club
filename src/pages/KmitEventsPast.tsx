import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { format, parseISO, isBefore } from "date-fns";

export default function KmitEventsPast() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("kmit_events").select("*").order("date", { ascending: false });
    if (!error) setEvents((data || []).filter(ev => isBefore(new Date(ev.date), new Date())));
    setLoading(false);
  }

  const years = Array.from(new Set(events.map(e => e.year))).sort((a,b) => b-a);

  const filtered = events.filter(ev => {
    if (filterYear !== "all" && String(ev.year) !== String(filterYear)) return false;
    if (filterCategory !== "all" && ev.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-display font-bold">Past KMIT Events</h1>
          <div className="flex gap-3">
            <select className="border p-2 rounded" value={filterYear} onChange={(e)=>setFilterYear(e.target.value)}>
              <option value="all">All years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="border p-2 rounded" value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)}>
              <option value="all">All categories</option>
              <option value="KMIT Evening">KMIT Evening</option>
              <option value="NAVRAAS">NAVRAAS</option>
              <option value="PATANG UTHSAV">PATANG UTSAV</option>
            </select>
            <Button onClick={()=>navigate("/")}>Home</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No past events match filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(ev => (
              <div key={ev.id} className="card-neon rounded-2xl p-6 bg-white/80 shadow-lg">
                <h3 className="text-2xl font-bold">{ev.name}</h3>
                <div className="text-sm text-muted-foreground">{ev.category} • {format(parseISO(ev.date), "PPP")}</div>
                <p className="mt-3 text-muted-foreground">{ev.description}</p>
                <div className="mt-4">
                  <Button onClick={()=>navigate(`/kmit-events/${ev.id}`)}>View Details</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
