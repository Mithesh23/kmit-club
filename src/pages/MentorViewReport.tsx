import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Calendar, Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import kmitLogo from "@/assets/kmit-logo.png";
export default function MentorViewReport() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    const { data, error } = await supabase
      .from("club_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    console.log("Loaded Report:", data, error);
    setReport(data);
    setLoading(false);
  }

  // --------------------------------------------------
  //                PDF DOWNLOAD LOGIC
  // --------------------------------------------------

  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 60;

    const addLine = () => {
      doc.setDrawColor(180);
      doc.setLineWidth(1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;
    };

    const addPageIfNeeded = (heightNeeded = 50) => {
      if (y + heightNeeded >= pageHeight - 40) {
        doc.addPage();
        y = 60;
        drawHeader();
        y += 20;
      }
    };

    const drawHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(report.title, pageWidth / 2, 40, { align: "center" });
    };

    // Draw main header
    drawHeader();
    y += 20;

    // Report Type
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Report Type:", margin, y);

    const reportTypeLabel =
      report.report_type === "mom"
        ? "Minutes of Meeting"
        : report.report_type.charAt(0).toUpperCase() +
          report.report_type.slice(1) +
          " Report";

    doc.setFont("helvetica", "normal");
    doc.text(reportTypeLabel, margin + 100, y);
    y += 20;

    // Report Date
    if (report.report_date) {
      doc.setFont("helvetica", "bold");
      doc.text("Report Date:", margin, y);

      doc.setFont("helvetica", "normal");
      doc.text(format(new Date(report.report_date), "PPP"), margin + 100, y);
      y += 25;
    }

    addLine();

    // Participants Section
    if (report.participants_roll_numbers?.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Participants", margin, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const participantString = report.participants_roll_numbers.join(", ");
      const wrapped = doc.splitTextToSize(
        participantString,
        pageWidth - margin * 2
      );

      wrapped.forEach((line) => {
        addPageIfNeeded(20);
        doc.text(line, margin + 10, y);
        y += 15;
      });

      y += 10;
      addLine();
    }

    // Report Data Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Report Details", margin, y);
    y += 20;

    doc.setFontSize(11);

    Object.entries(report.report_data || {}).forEach(([key, value]) => {
      if (!value) return;

      addPageIfNeeded();

      const label = key.replace(/([A-Z])/g, " $1").trim();
      const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);

      doc.setFont("helvetica", "bold");
      doc.text(`${formattedLabel}:`, margin, y);
      y += 15;

      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(
        String(value),
        pageWidth - margin * 2
      );

      lines.forEach((line) => {
        addPageIfNeeded();
        doc.text(line, margin + 10, y);
        y += 15;
      });

      y += 10;
    });

    addLine();

    // Footer
    addPageIfNeeded();
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(
      `Created on: ${format(new Date(report.created_at), "PPP p")}`,
      margin,
      y + 10
    );

    doc.save(`${report.title.replace(/\s+/g, "_")}_report.pdf`);
  };

  // --------------------------------------------------
  //                   UI DISPLAY
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Report not found</h2>
          <Button onClick={() => navigate("/mentor")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const data = report.report_data || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-4">
              <img src={kmitLogo} alt="KMIT Logo" className="h-10 w-auto" />
              <h1 className="text-xl font-semibold text-gray-800">Report</h1>
            </div>

            {/* Right side - Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate(`/mentor/club/${report.club_id}/reports`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{report.title}</CardTitle>

            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                {report.report_type === "mom"
                  ? "MOM"
                  : report.report_type.charAt(0).toUpperCase() +
                    report.report_type.slice(1)}
              </span>

              {report.report_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(report.report_date), "PPP")}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* PARTICIPANTS */}
            {report.participants_roll_numbers?.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Participants</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {report.participants_roll_numbers.join(", ")}
                </p>
              </div>
            )}

            {/* REPORT DETAILS */}
            {data && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">
                  Report Details
                </h3>

                {Object.entries(data).map(([key, value]) => {
                  if (!value) return null;

                  return (
                    <div key={key} className="space-y-2">
                      <h4 className="font-semibold text-primary capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </h4>
                      <p className="text-muted-foreground whitespace-pre-wrap pl-4">
                        {String(value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t text-xs text-muted-foreground">
              Created on: {format(new Date(report.created_at), "PPP p")}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
