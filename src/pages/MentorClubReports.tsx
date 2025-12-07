import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, ArrowLeft, ExternalLink, Download, Search } from "lucide-react";
import { format } from "date-fns";

export default function MentorClubReports() {
  const { id: clubId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<any | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    if (!clubId) return;
    loadData();
  }, [clubId]);

  async function loadData() {
    setLoading(true);
    try {
      const [clubRes, reportsRes] = await Promise.all([
        supabase.from("clubs").select("*").eq("id", clubId).maybeSingle(),
        supabase
          .from("club_reports")
          .select("*")
          .eq("club_id", clubId)
          .order("created_at", { ascending: false }),
      ]);

      setClub(clubRes.data);
      setReports(reportsRes.data ?? []);
    } catch (err) {
      console.error("Error loading data:", err);
    }
    setLoading(false);
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      searchTerm === "" ||
      report.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "" || report.report_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getReportTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "mom":
        return "default";
      case "event":
        return "secondary";
      case "monthly":
        return "outline";
      case "yearly":
        return "destructive";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold">
                {club?.name} - Reports
              </h1>
              <p className="text-muted-foreground">
                {reports.length} report{reports.length !== 1 ? "s" : ""} uploaded
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/")}>Home</Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                className="border rounded-md px-3 py-2 bg-background"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="mom">MOM</option>
                <option value="event">Event</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No reports found.
              </p>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {report.title}
                            </h3>
                            <Badge variant={getReportTypeBadgeVariant(report.report_type)}>
                              {report.report_type.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Created: {format(new Date(report.created_at), "PPP")}
                            {report.report_date && (
                              <> • Report Date: {format(new Date(report.report_date), "PPP")}</>
                            )}
                          </p>
                          {report.participants_roll_numbers?.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {report.participants_roll_numbers.length} participant(s)
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/mentor/view-report/${report.id}`)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {report.file_url && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(report.file_url, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Open
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                              >
                                <a href={report.file_url} download>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
