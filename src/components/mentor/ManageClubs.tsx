import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  FileText,
  Calendar,
  Building2,
  Search,
  Download,
  Eye,
  Loader2,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";

interface Club {
  id: string;
  name: string;
  short_description: string | null;
  registration_open: boolean;
  created_at: string;
}

interface ClubMember {
  id: string;
  club_id: string;
  name: string;
  role: string;
}

interface ClubReport {
  id: string;
  club_id: string;
  title: string;
  report_type: string;
  report_date: string | null;
  created_at: string;
  file_url: string | null;
  report_data: any;
}

interface ClubRegistration {
  id: string;
  club_id: string;
  student_name: string;
  student_email: string;
  roll_number: string | null;
  year: string | null;
  branch: string | null;
  status: string;
  created_at: string;
}

export default function ManageClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [reports, setReports] = useState<ClubReport[]>([]);
  const [registrations, setRegistrations] = useState<ClubRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClub, setSelectedClub] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    
    const [clubsRes, membersRes, reportsRes, registrationsRes] = await Promise.all([
      supabase.from("clubs").select("*").order("name"),
      supabase.from("club_members").select("*").order("name"),
      supabase.from("club_reports").select("*").order("created_at", { ascending: false }),
      supabase.from("club_registrations").select("*").order("created_at", { ascending: false }),
    ]);

    if (clubsRes.data) setClubs(clubsRes.data);
    if (membersRes.data) setMembers(membersRes.data);
    if (reportsRes.data) setReports(reportsRes.data);
    if (registrationsRes.data) setRegistrations(registrationsRes.data);
    
    setLoading(false);
  }

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClubMembers = (clubId: string) =>
    members.filter(m => m.club_id === clubId);

  const getClubReports = (clubId: string) =>
    reports.filter(r => r.club_id === clubId);

  const getClubRegistrations = (clubId: string) =>
    registrations.filter(r => r.club_id === clubId);

  const getApprovedCount = (clubId: string) =>
    registrations.filter(r => r.club_id === clubId && r.status === "approved").length;

  const getPendingCount = (clubId: string) =>
    registrations.filter(r => r.club_id === clubId && r.status === "pending").length;

  const totalStats = {
    clubs: clubs.length,
    executiveMembers: members.length,
    reports: reports.length,
    approvedStudents: registrations.filter(r => r.status === "approved").length,
    pendingRegistrations: registrations.filter(r => r.status === "pending").length,
  };

  const downloadClubReport = (club: Club) => {
    const clubMembers = getClubMembers(club.id);
    const clubReports = getClubReports(club.id);
    const clubRegs = getClubRegistrations(club.id);
    const approved = clubRegs.filter(r => r.status === "approved");

    let csv = `Club Report: ${club.name}\n\n`;
    csv += `Executive Members (${clubMembers.length})\n`;
    csv += "Name,Role\n";
    clubMembers.forEach(m => {
      csv += `${m.name},${m.role}\n`;
    });

    csv += `\nApproved Students (${approved.length})\n`;
    csv += "Name,Email,Roll Number,Year,Branch\n";
    approved.forEach(r => {
      csv += `${r.student_name},${r.student_email},${r.roll_number || "N/A"},${r.year || "N/A"},${r.branch || "N/A"}\n`;
    });

    csv += `\nReports (${clubReports.length})\n`;
    csv += "Title,Type,Date\n";
    clubReports.forEach(r => {
      csv += `${r.title},${r.report_type},${r.report_date || "N/A"}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${club.name.replace(/\s+/g, "_")}_report.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
          <CardContent className="p-4 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-700">{totalStats.clubs}</div>
            <div className="text-sm text-muted-foreground">Total Clubs</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-700">{totalStats.executiveMembers}</div>
            <div className="text-sm text-muted-foreground">Executive Members</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
          <CardContent className="p-4 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-700">{totalStats.approvedStudents}</div>
            <div className="text-sm text-muted-foreground">Approved Students</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200">
          <CardContent className="p-4 text-center">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 text-amber-600" />
            <div className="text-2xl font-bold text-amber-700">{totalStats.pendingRegistrations}</div>
            <div className="text-sm text-muted-foreground">Pending Registrations</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-200">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-rose-600" />
            <div className="text-2xl font-bold text-rose-700">{totalStats.reports}</div>
            <div className="text-sm text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clubs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clubs Accordion */}
      <Accordion type="single" collapsible className="space-y-4">
        {filteredClubs.map((club) => (
          <AccordionItem
            key={club.id}
            value={club.id}
            className="border rounded-xl bg-card shadow-sm overflow-hidden"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">{club.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getClubMembers(club.id).length} executives • {getApprovedCount(club.id)} members • {getClubReports(club.id).length} reports
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={club.registration_open ? "default" : "secondary"}>
                    {club.registration_open ? "Open" : "Closed"}
                  </Badge>
                  {getPendingCount(club.id) > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {getPendingCount(club.id)} pending
                    </Badge>
                  )}
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-6 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Executive Members */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Executive Members ({getClubMembers(club.id).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      {getClubMembers(club.id).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No executive members</p>
                      ) : (
                        <div className="space-y-2">
                          {getClubMembers(club.id).map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                            >
                              <span className="font-medium">{member.name}</span>
                              <Badge variant="outline">{member.role}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Approved Students */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Approved Students ({getApprovedCount(club.id)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      {getClubRegistrations(club.id).filter(r => r.status === "approved").length === 0 ? (
                        <p className="text-sm text-muted-foreground">No approved students</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Roll No</TableHead>
                              <TableHead>Year</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getClubRegistrations(club.id)
                              .filter(r => r.status === "approved")
                              .map((reg) => (
                                <TableRow key={reg.id}>
                                  <TableCell className="font-medium">{reg.student_name}</TableCell>
                                  <TableCell>{reg.roll_number || "N/A"}</TableCell>
                                  <TableCell>{reg.year || "N/A"}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Reports */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Club Reports ({getClubReports(club.id).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      {getClubReports(club.id).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No reports submitted</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getClubReports(club.id).map((report) => (
                              <TableRow key={report.id}>
                                <TableCell className="font-medium">{report.title}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {report.report_type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {report.report_date
                                    ? format(new Date(report.report_date), "MMM d, yyyy")
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  {report.file_url && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(report.file_url!, "_blank")}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Download Button */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => downloadClubReport(club)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Club Report
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filteredClubs.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No clubs found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}
