import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Users,
  Calendar,
  FileText,
  Filter,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MentorClubDetails() {
  const { id: clubId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [eventSearch, setEventSearch] = useState("");
  const [eventYear, setEventYear] = useState("");
  const [eventMonth, setEventMonth] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [studentYear, setStudentYear] = useState("");
  const [studentBranch, setStudentBranch] = useState("");
  const [studentStatus, setStudentStatus] = useState("");

  useEffect(() => {
    if (!clubId) return;
    loadAll();
  }, [clubId]);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const { data: clubData } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", clubId)
        .single();
      setClub(clubData || null);

      const { data: membersData } = await supabase
        .from("club_members")
        .select("*")
        .eq("club_id", clubId)
        .order("created_at", { ascending: true });
      setMembers(membersData ?? []);

      const { data: eventsData } = await supabase
        .from("events")
        .select("*, event_images(*)")
        .eq("club_id", clubId)
        .order("event_date", { ascending: true });
      setEvents(eventsData ?? []);

      const { data: regsData } = await supabase
        .from("club_registrations")
        .select("*")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });
      setRegistrations(regsData ?? []);

      const { data: reportsData } = await supabase
        .from("club_reports")
        .select("*")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });
      setReports(reportsData ?? []);
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  // ==============================
  // EVENT FILTERING
  // ==============================
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        eventSearch === "" ||
        ev.title?.toLowerCase().includes(eventSearch.toLowerCase());

      const matchesYear =
        eventYear === "" ||
        (ev.event_date &&
          new Date(ev.event_date).getFullYear().toString() === eventYear);

      const matchesMonth =
        eventMonth === "" ||
        (ev.event_date &&
          (new Date(ev.event_date).getMonth() + 1).toString() === eventMonth);

      return matchesSearch && matchesYear && matchesMonth;
    });
  }, [events, eventSearch, eventYear, eventMonth]);

  // ==============================
  // STUDENT FILTERING
  // ==============================
  const filteredStudents = useMemo(() => {
    return registrations.filter((r) => {
      const matchesSearch =
        studentSearch === "" ||
        r.student_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        r.roll_number?.toLowerCase().includes(studentSearch.toLowerCase());

      const matchesYear = studentYear ? r.year === studentYear : true;
      const matchesBranch = studentBranch ? r.branch === studentBranch : true;
      const matchesStatus = studentStatus ? r.status === studentStatus : true;

      return matchesSearch && matchesYear && matchesBranch && matchesStatus;
    });
  }, [registrations, studentSearch, studentYear, studentBranch, studentStatus]);

  if (!clubId)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No club selected.</p>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
              {club?.logo_url ? (
                <img
                  src={club.logo_url}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <div className="text-muted-foreground">No Logo</div>
              )}
            </div>

            <div>
              <h1 className="text-4xl font-display font-bold">{club?.name}</h1>
              <Badge className="mt-2">
                {club?.registration_open ? "Registration Open" : "Registration Closed"}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
            <Button onClick={() => navigate("/")}>Home</Button>
          </div>
        </div>

        {/* ============================
              Main Layout
        ============================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">

          {/* LEFT SECTION */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About the Club</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{club?.detailed_description}</p>
              </CardContent>
            </Card>

            {/* ============================
                  EVENTS + FILTERS
            ============================ */}
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <CardTitle>Club Events</CardTitle>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <Input
                    placeholder="Search event name..."
                    className="w-48"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                  />

                  <select
                    className="border rounded-md p-2"
                    value={eventYear}
                    onChange={(e) => setEventYear(e.target.value)}
                  >
                    <option value="">Year</option>
                    {[...new Set(events.map((e) =>
                      e.event_date ? new Date(e.event_date).getFullYear() : null
                    ))]
                      .filter(Boolean)
                      .map((y) => (
                        <option key={y}>{y}</option>
                      ))}
                  </select>

                  <select
                    className="border rounded-md p-2"
                    value={eventMonth}
                    onChange={(e) => setEventMonth(e.target.value)}
                  >
                    <option value="">Month</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>

              <CardContent>
                {filteredEvents.length === 0 ? (
                  <p className="text-muted-foreground">No matching events.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map((ev) => (
                      <div key={ev.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{ev.title}</h3>
                            <p className="text-muted-foreground text-sm">{ev.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {ev.event_date ? format(new Date(ev.event_date), "PPP") : ""}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/club/${clubId}/event/${ev.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ============================
                STUDENT REGISTRATIONS + FILTERS
            ============================ */}
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Registered Students</CardTitle>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">

                  <Input
                    placeholder="Search name / roll"
                    className="w-56"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />

                  <select
                    className="border p-2 rounded-md"
                    value={studentYear}
                    onChange={(e) => setStudentYear(e.target.value)}
                  >
                    <option value="">Year</option>
                    {[...new Set(registrations.map((r) => r.year))].map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>

                  <select
                    className="border p-2 rounded-md"
                    value={studentBranch}
                    onChange={(e) => setStudentBranch(e.target.value)}
                  >
                    <option value="">Branch</option>
                    {[...new Set(registrations.map((r) => r.branch))].map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>

                  <select
                    className="border p-2 rounded-md"
                    value={studentStatus}
                    onChange={(e) => setStudentStatus(e.target.value)}
                  >
                    <option value="">Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </CardHeader>

              <CardContent>
                {filteredStudents.length === 0 ? (
                  <p className="text-muted-foreground">No matching students.</p>
                ) : (
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-3">
                      {filteredStudents.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 border rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">{s.student_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.student_email} • {s.roll_number}
                            </p>
                          </div>
                          <Badge
                            variant={
                              s.status === "approved"
                                ? "default"
                                : s.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {s.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-6">

            {/* Executive members */}
            <Card>
              <CardHeader>
                <CardTitle>Executive Members</CardTitle>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-muted-foreground">No executive members.</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="p-2 border rounded-md">
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ============================
                REPORTS + VIEW ALL
            ============================ */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Club Reports</CardTitle>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      View All
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>All Club Reports</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 mt-4">
                      {reports.length === 0 ? (
                        <p className="text-muted-foreground">No reports available.</p>
                      ) : (
                        reports.map((rep) => (
                          <div
                            key={rep.id}
                            className="p-3 border rounded-lg flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium">{rep.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {rep.report_type} •{" "}
                                {rep.report_date
                                  ? format(new Date(rep.report_date), "PPP")
                                  : format(new Date(rep.created_at), "PPP")}
                              </p>
                            </div>

                              <Button onClick={() => navigate(`/mentor/view-report/${rep.id}`)}>View Report</Button>

                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-muted-foreground">No reports uploaded.</p>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 3).map((rep) => (
                      <div key={rep.id} className="p-2 border rounded-md flex justify-between">
                        <div>
                          <p className="font-medium">{rep.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {rep.report_type} •{" "}
                            {format(new Date(rep.created_at), "PPP")}
                          </p>
                        </div>

                          <Button onClick={() => navigate(`/mentor/view-report/${rep.id}`)}>
    View Report
  </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="text-xl font-bold">{members.length}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Events</p>
                    <p className="text-xl font-bold">{events.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

        </div>
      </div>
    </div>
  );
}
