
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
  Power,
  PowerOff,
  Award,
} from "lucide-react";

import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transformImageUrl } from '@/lib/utils';
import { toast } from "sonner";
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://qvsrhfzdkjygjuwmfwmh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c";

const getMentorSupabaseClient = () => {
  const token = localStorage.getItem('mentor_auth_token');
  
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { authorization: token } : {},
    },
  });
};

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PastMembersDialog } from "@/components/PastMembersDialog";

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

  // Club Toggle Dialog State
  const [toggleClubDialog, setToggleClubDialog] = useState<{ action: "enable" | "disable" } | null>(null);
  const [togglingClub, setTogglingClub] = useState(false);

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

  // Toggle Club Status
  async function handleToggleClub() {
    if (!toggleClubDialog || !club) return;

    const newStatus = toggleClubDialog.action === "enable";
    setTogglingClub(true);

    try {
      const mentorToken = localStorage.getItem('mentor_auth_token');
      if (!mentorToken) {
        throw new Error('Not authenticated as mentor');
      }

      const response = await supabase.functions.invoke('update-club-status', {
        body: {
          club_id: club.id,
          is_active: newStatus,
          mentor_token: mentorToken,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(
        `Club "${club.name}" has been ${toggleClubDialog.action}d successfully!`
      );
      loadAll(); // refresh updated status
    } catch (e: any) {
      toast.error(`Failed to ${toggleClubDialog.action} club: ${e.message}`);
    } finally {
      setTogglingClub(false);
      setToggleClubDialog(null);
    }
  }

  // EVENT FILTERS
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

  // STUDENT FILTERS - exclude Pass Out students from main view
  const filteredStudents = useMemo(() => {
    return registrations.filter((r) => {
      // Exclude passout students from main view
      if (r.year === 'Pass Out') return false;
      
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

        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
              {club?.logo_url ? (
                <img src={transformImageUrl(club.logo_url)} className="w-full h-full object-cover" />
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

          <div className="flex gap-3">

            {/* ENABLE / DISABLE CLUB BUTTON */}
            {club && (
              club.is_active !== false ? (
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setToggleClubDialog({ action: "disable" })}
                >
                  <PowerOff className="h-4 w-4 mr-2" /> Disable Club
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600/30 hover:bg-green-600/10"
                  onClick={() => setToggleClubDialog({ action: "enable" })}
                >
                  <Power className="h-4 w-4 mr-2" /> Enable Club
                </Button>
              )
            )}

            <Button variant="ghost" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button onClick={() => navigate("/")}>Home</Button>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">

          {/* LEFT SECTION */}
          <div className="lg:col-span-2 space-y-8">

            {/* ABOUT */}
            <Card>
              <CardHeader>
                <CardTitle>About the Club</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{club?.detailed_description}</p>
              </CardContent>
            </Card>

            {/* EVENTS SECTION */}
            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <CardTitle>Club Events</CardTitle>
                </div>

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
                      <EventCard 
                        key={ev.id} 
                        event={ev} 
                        clubId={clubId!} 
                        navigate={navigate}
                        onRefresh={loadAll}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>Registered Students</CardTitle>
                  </div>
                  <PastMembersDialog clubId={clubId || ''} clubName={club?.name} />
                </div>

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

            {/* EXECUTIVE MEMBERS */}
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

            {/* REPORTS */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Club Reports</CardTitle>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/mentor/clubs/${clubId}/reports`)}
                >
                  View All
                </Button>
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
                            {rep.report_type} • {format(new Date(rep.created_at), "PPP")}
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

            {/* STATS */}
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

      {/* ===========================
            CONFIRMATION DIALOG
      =========================== */}
      <AlertDialog
        open={!!toggleClubDialog}
        onOpenChange={() => setToggleClubDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleClubDialog?.action === "disable"
                ? "Disable Club"
                : "Enable Club"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {toggleClubDialog?.action === "disable" ? (
                <>
                  Are you sure you want to disable "{club?.name}"?
                  <br />
                  <br />
                  This will:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Remove the club from the homepage</li>
                    <li>Disable club admin login</li>
                    <li>Prevent new registrations</li>
                  </ul>
                </>
              ) : (
                <>
                  Are you sure you want to enable "{club?.name}"?
                  <br />
                  <br />
                  This will:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Show the club on the homepage</li>
                    <li>Reactivate club admin login</li>
                    <li>Allow new registrations</li>
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingClub}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={togglingClub}
              onClick={handleToggleClub}
              className={
                toggleClubDialog?.action === "disable"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {toggleClubDialog?.action === "disable" ? "Disable" : "Enable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Event Card Component with Certificate Permission Toggle
function EventCard({ 
  event, 
  clubId, 
  navigate, 
  onRefresh 
}: { 
  event: any; 
  clubId: string; 
  navigate: any;
  onRefresh: () => void;
}) {
  const [toggling, setToggling] = useState(false);

  const toggleCertificatePermission = async () => {
    setToggling(true);
    try {
      const mentorClient = getMentorSupabaseClient();
      const newValue = !event.certificate_permission;
      
      const { error } = await mentorClient
        .from('events')
        .update({ certificate_permission: newValue })
        .eq('id', event.id);

      if (error) throw error;

      toast.success(
        newValue 
          ? "Certificate permission granted. Club admin can now issue certificates." 
          : "Certificate permission revoked."
      );
      onRefresh();
    } catch (err: any) {
      toast.error(`Failed to update permission: ${err.message}`);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{event.title}</h3>
          <p className="text-muted-foreground text-sm">{event.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {event.event_date ? format(new Date(event.event_date), "PPP") : ""}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={event.certificate_permission ? "default" : "outline"}
            className={event.certificate_permission 
              ? "bg-yellow-500 hover:bg-yellow-600 text-black" 
              : "border-yellow-500 text-yellow-600 hover:bg-yellow-50"}
            onClick={toggleCertificatePermission}
            disabled={toggling}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Award className="h-4 w-4 mr-1" />
                {event.certificate_permission ? "Permission Granted" : "Grant Certificate"}
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/club/${clubId}/event/${event.id}`)}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
