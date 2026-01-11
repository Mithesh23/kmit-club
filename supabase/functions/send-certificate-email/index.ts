import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificateRequest {
  event_id: string;
  event_title: string;
  event_date: string;
  club_id: string;
  club_name: string;
  template_url: string;
  attendees: {
    student_name: string;
    student_email: string;
    roll_number: string;
  }[];
}

// Year mapping for Roman numerals
const yearMapping: Record<string, string> = {
  '1st Year': 'I',
  '2nd Year': 'II',
  '3rd Year': 'III',
  '4th Year': 'IV',
};

// Format date for certificate (e.g., "9th January 2026")
function formatCertificateDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  // Add ordinal suffix
  const suffix = (day === 1 || day === 21 || day === 31) ? 'st' :
                 (day === 2 || day === 22) ? 'nd' :
                 (day === 3 || day === 23) ? 'rd' : 'th';
  
  return `${day}${suffix} ${month} ${year}`;
}

// Generate certificate PDF as base64 - matching the Student Download functionality exactly
async function generateCertificatePDF(
  studentName: string,
  studentYear: string,
  studentBranch: string,
  eventName: string,
  eventDate: string,
  templateBase64: string
): Promise<string> {
  // Use jsPDF from CDN for Deno
  const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
  
  // Create PDF with landscape orientation (A4)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Add the template as background
  try {
    pdf.addImage(`data:image/jpeg;base64,${templateBase64}`, 'JPEG', 0, 0, pageWidth, pageHeight);
  } catch (error) {
    console.error("Error adding template image:", error);
    // Create fallback design if template fails
    pdf.setFillColor(255, 248, 220);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.setDrawColor(218, 165, 32);
    pdf.setLineWidth(3);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(36);
    pdf.setTextColor(139, 69, 19);
    pdf.text('CERTIFICATE OF PARTICIPATION', pageWidth / 2, 50, { align: 'center' });
  }

  // Set Times New Roman font (using Times which is built into jsPDF)
  pdf.setFont('times', 'normal');
  pdf.setTextColor(0, 0, 0);

  // Format year for display
  const romanYear = yearMapping[studentYear] || studentYear;
  const formattedDate = formatCertificateDate(eventDate);

  // Position and add text - EXACTLY matching StudentCertificatesSection.tsx layout
  
  // Student Name (after "Mr/Ms") - position (128, 109)
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  pdf.text(studentName.toUpperCase(), 128, 109);

  // Year (after "Studying" - B.Tech + Year) - position (75, 125)
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  const studyingText = `B.Tech ${romanYear} Year`;
  pdf.text(studyingText, 75, 125);

  // Branch (after "in") - position (160, 130)
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  pdf.text(studentBranch || '', 160, 130);

  // Event Name (after "event of") - position (188, 141)
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  pdf.text(eventName, 188, 141);

  // Event Date (after "held in the college during/on") - position (125, 156)
  pdf.setFontSize(14);
  pdf.setFont('times', 'bold');
  pdf.text(formattedDate, 125, 156);

  // Get PDF as base64
  const pdfOutput = pdf.output('datauristring');
  const base64Content = pdfOutput.split(',')[1];
  
  return base64Content;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-certificate-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: CertificateRequest = await req.json();
    const { event_id, event_title, event_date, club_id, club_name, attendees, template_url } = requestData;

    console.log(`Processing certificates for event: ${event_title}, attendees: ${attendees.length}`);

    if (!attendees || attendees.length === 0) {
      return new Response(
        JSON.stringify({ error: "No attendees provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the certificate template image once (to avoid fetching for each attendee)
    let templateBase64 = '';
    try {
      if (template_url) {
        console.log(`Fetching certificate template from: ${template_url}`);
        const templateResponse = await fetch(template_url);
        if (templateResponse.ok) {
          const imageData = await templateResponse.arrayBuffer();
          templateBase64 = btoa(String.fromCharCode(...new Uint8Array(imageData)));
          console.log("Certificate template loaded successfully");
        } else {
          console.error("Failed to fetch template:", templateResponse.status);
        }
      }
    } catch (error) {
      console.error("Error fetching certificate template:", error);
    }

    // Fetch student details for all attendees
    const rollNumbers = attendees.map(a => a.roll_number);
    const { data: studentAccounts, error: studentError } = await supabase
      .from('student_accounts')
      .select('roll_number, year, branch')
      .in('roll_number', rollNumbers);

    if (studentError) {
      console.error("Error fetching student accounts:", studentError);
    }

    // Create a map for quick lookup
    const studentDetailsMap = new Map(
      (studentAccounts || []).map(s => [s.roll_number, { year: s.year, branch: s.branch }])
    );

    // Process all emails in parallel
    const emailPromises = attendees.map(async (attendee) => {
      try {
        // Get student details (default to empty if not found - for non-registered students)
        const details = studentDetailsMap.get(attendee.roll_number) || { year: '', branch: '' };
        
        // Generate PDF certificate with the template
        const pdfBase64 = await generateCertificatePDF(
          attendee.student_name,
          details.year || '',
          details.branch || '',
          event_title,
          event_date,
          templateBase64
        );

        console.log(`Generated certificate for ${attendee.student_name}`);

        // Send email with certificate attached
        const emailResponse = await resend.emails.send({
          from: "KMIT Clubs <noreply@kmitclubs.in>",
          to: [attendee.student_email],
          subject: `🏆 Your Participation Certificate - ${event_title}`,
          attachments: [
            {
              filename: `Certificate_${attendee.student_name.replace(/\s+/g, '_')}_${event_title.replace(/\s+/g, '_')}.pdf`,
              content: pdfBase64,
              content_type: 'application/pdf',
            },
          ],
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🏆 Congratulations!</h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Your participation certificate is ready</p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
                            Dear <strong>${attendee.student_name}</strong>,
                          </p>
                          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                            Thank you for participating in our event! Please find your participation certificate attached to this email.
                          </p>
                          
                          <!-- Event Details Card -->
                          <table role="presentation" style="width: 100%; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                            <tr>
                              <td>
                                <h2 style="color: #92400e; margin: 0 0 15px; font-size: 20px;">${event_title}</h2>
                                <p style="color: #78350f; margin: 0 0 8px; font-size: 14px;">
                                  <strong>📅 Event Date:</strong> ${event_date ? new Date(event_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                </p>
                                <p style="color: #78350f; margin: 0 0 8px; font-size: 14px;">
                                  <strong>🏛️ Organized by:</strong> ${club_name}
                                </p>
                                <p style="color: #78350f; margin: 0; font-size: 14px;">
                                  <strong>🎓 Roll Number:</strong> ${attendee.roll_number}
                                </p>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Certificate Notice -->
                          <div style="text-align: center; margin: 30px 0;">
                            <div style="background: #ffffff; border: 3px solid #f59e0b; border-radius: 16px; padding: 20px; display: inline-block;">
                              <p style="color: #374151; margin: 0; font-size: 14px;">
                                📎 <strong>Your certificate is attached</strong> to this email as a PDF
                              </p>
                            </div>
                          </div>
                          
                          <!-- Important Notice -->
                          <table role="presentation" style="width: 100%; background-color: #ecfdf5; border-radius: 8px; padding: 15px;">
                            <tr>
                              <td>
                                <p style="color: #065f46; font-size: 13px; margin: 0; line-height: 1.5;">
                                  <strong>💡 Tip:</strong> Download and save your certificate for future reference. You can also access all your certificates from your Student Dashboard on the KMIT Clubs portal.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                          <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px;">
                            Keep achieving great things! 🌟
                          </p>
                          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                            KMIT Clubs • Keshav Memorial Institute of Technology
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${attendee.student_email}:`, emailResponse);
        return { success: true, email: attendee.student_email, roll_number: attendee.roll_number };
      } catch (error: any) {
        console.error(`Failed to send certificate to ${attendee.student_email}:`, error);
        return { success: false, email: attendee.student_email, roll_number: attendee.roll_number, error: error.message };
      }
    });

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Certificate emails sent: ${successful.length} successful, ${failed.length} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Certificates sent: ${successful.length} successful, ${failed.length} failed`,
        successful_count: successful.length,
        failed_count: failed.length,
        failed_emails: failed.map(f => ({ email: f.email, error: f.error }))
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-certificate-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
