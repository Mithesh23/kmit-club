import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CertificateEmailRequest {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  clubName: string;
  attendees: {
    name: string;
    email: string;
    rollNumber: string;
    branch?: string;
    year?: string;
  }[];
}

// Convert year number to Roman numeral
function toRomanNumeral(num: number): string {
  const romanNumerals: { [key: number]: string } = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV'
  };
  return romanNumerals[num] || num.toString();
}

// Generate PDF certificate as base64
async function generateCertificatePDF(
  studentName: string,
  branch: string,
  year: string,
  eventTitle: string,
  eventDate: string
): Promise<string> {
  // We'll use a simple approach - create an HTML certificate and convert to PDF
  // Since we can't use jsPDF in Deno easily, we'll use a workaround with PDFKit or simple base64 encoding
  
  // For email attachments, we'll generate a simple PDF using raw PDF commands
  const romanYear = toRomanNumeral(parseInt(year) || 1);
  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Create a simple PDF document
  // This is a minimal PDF structure
  const content = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 800 >>
stream
BT
/F1 24 Tf
150 400 Td
(CERTIFICATE OF PARTICIPATION) Tj
0 -50 Td
/F1 16 Tf
(This is to certify that) Tj
0 -30 Td
/F1 20 Tf
(${studentName}) Tj
0 -30 Td
/F1 14 Tf
(B.Tech ${romanYear} Year - ${branch}) Tj
0 -40 Td
/F1 16 Tf
(has successfully participated in) Tj
0 -30 Td
/F1 18 Tf
(${eventTitle}) Tj
0 -30 Td
/F1 14 Tf
(held on ${formattedDate}) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000001119 00000 n 

trailer
<< /Size 6 /Root 1 0 R >>
startxref
1200
%%EOF
`;

  // Convert to base64
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const base64 = btoa(String.fromCharCode(...data));
  
  return base64;
}

// Generate HTML certificate for email body
function generateCertificateHTML(
  studentName: string,
  branch: string,
  year: string,
  eventTitle: string,
  eventDate: string,
  clubName: string
): string {
  const romanYear = toRomanNumeral(parseInt(year) || 1);
  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #1a365d; margin: 0; font-size: 28px; }
        .content { text-align: center; line-height: 1.8; }
        .highlight { color: #2563eb; font-weight: bold; font-size: 20px; }
        .event-name { color: #dc2626; font-weight: bold; font-size: 18px; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
        .certificate-note { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Certificate of Participation</h1>
        </div>
        <div class="content">
          <p>Dear <span class="highlight">${studentName}</span>,</p>
          <p>Congratulations! This is to certify that you have successfully participated in</p>
          <p class="event-name">${eventTitle}</p>
          <p>organized by <strong>${clubName}</strong></p>
          <p>held on <strong>${formattedDate}</strong></p>
          <p style="margin-top: 20px;">Your Details:</p>
          <p><strong>B.Tech ${romanYear} Year</strong> - ${branch}</p>
        </div>
        <div class="certificate-note">
          <strong>📄 Your participation certificate is attached to this email.</strong>
        </div>
        <div class="footer">
          <p>Thank you for your participation!</p>
          <p>Best regards,<br>${clubName} Team<br>KMIT</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-certificate-email function invoked");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, eventTitle, eventDate, clubName, attendees }: CertificateEmailRequest = await req.json();
    
    console.log(`Processing ${attendees.length} attendees for event: ${eventTitle}`);
    
    if (!attendees || attendees.length === 0) {
      return new Response(
        JSON.stringify({ error: "No attendees provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Process each attendee with throttling
    for (const attendee of attendees) {
      try {
        console.log(`Processing certificate for: ${attendee.name} (${attendee.email})`);
        
        // Get student details if not provided
        let branch = attendee.branch || "Computer Science";
        let year = attendee.year || "1";
        
        if (!attendee.branch || !attendee.year) {
          const { data: studentData } = await supabase
            .from('student_accounts')
            .select('branch, year')
            .eq('roll_number', attendee.rollNumber)
            .maybeSingle();
          
          if (studentData) {
            branch = studentData.branch || branch;
            year = studentData.year?.toString() || year;
          }
        }

        // Generate certificate PDF
        const pdfBase64 = await generateCertificatePDF(
          attendee.name,
          branch,
          year,
          eventTitle,
          eventDate
        );

        // Generate email HTML
        const emailHtml = generateCertificateHTML(
          attendee.name,
          branch,
          year,
          eventTitle,
          eventDate,
          clubName
        );

        // Send email with attachment
        const emailResponse = await resend.emails.send({
          from: "KMIT Clubs <noreply@kmitclubs.in>",
          to: [attendee.email],
          subject: `🎉 Certificate of Participation - ${eventTitle}`,
          html: emailHtml,
          attachments: [
            {
              filename: `Certificate_${attendee.name.replace(/[^a-zA-Z0-9]/g, '_')}_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
              content: pdfBase64,
            }
          ]
        });

        console.log(`Email sent successfully to ${attendee.email}:`, emailResponse);
        successCount++;

        // Add delay to prevent rate limiting (2 seconds between emails)
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (emailError: any) {
        console.error(`Failed to send email to ${attendee.email}:`, emailError);
        errors.push(`${attendee.email}: ${emailError.message}`);
        failCount++;
        
        // Still add delay even on failure
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Completed: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        successCount,
        failCount,
        totalAttempted: attendees.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in send-certificate-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
