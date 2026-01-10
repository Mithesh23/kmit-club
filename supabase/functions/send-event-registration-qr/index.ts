import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationQRRequest {
  registration_id: string;
  event_id: string;
  event_title: string;
  event_date: string;
  student_name: string;
  student_email: string;
  roll_number: string;
  club_name: string;
}

// Generate a secure unique token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-event-registration-qr function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      registration_id,
      event_id,
      event_title,
      event_date,
      student_name,
      student_email,
      roll_number,
      club_name,
    }: RegistrationQRRequest = await req.json();

    console.log(`Processing QR for registration: ${registration_id}, student: ${student_name}`);

    // Validate required fields
    if (!registration_id || !event_id || !student_email || !student_name) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique QR token
    const qrToken = generateSecureToken();
    console.log(`Generated QR token for ${student_name}`);

    // Create QR code data - contains token and event ID for validation
    const qrData = JSON.stringify({
      token: qrToken,
      event_id: event_id,
      registration_id: registration_id,
    });

    // Generate QR code as base64 string (without data URL prefix)
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Extract pure base64 content (remove data:image/png;base64, prefix)
    const base64Content = qrCodeBase64.replace(/^data:image\/png;base64,/, '');

    console.log("QR code generated successfully");

    // Store the attendance record with QR token
    const { error: insertError } = await supabase
      .from('event_attendance')
      .insert({
        event_id,
        registration_id,
        qr_token: qrToken,
        student_name,
        student_email,
        roll_number,
        is_present: false,
      });

    if (insertError) {
      // If duplicate, just log and continue (registration already processed)
      if (insertError.code === '23505') {
        console.log("Attendance record already exists, skipping insert");
      } else {
        console.error("Error inserting attendance record:", insertError);
        throw insertError;
      }
    }

    // Format event date for display
    const formattedDate = event_date 
      ? new Date(event_date).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Date TBA';

    // Send email with QR code as inline attachment
    const emailResponse = await resend.emails.send({
      from: "KMIT Clubs <noreply@kmitclubs.in>",
      to: [student_email],
      subject: `🎫 Your Entry Pass for ${event_title} - KMIT Clubs`,
      attachments: [
        {
          filename: 'qr-code.png',
          content: base64Content,
          content_type: 'image/png',
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
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎉 Registration Confirmed!</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Your entry pass is ready</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
                        Dear <strong>${student_name}</strong>,
                      </p>
                      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                        Your registration for the event has been confirmed! Please find your QR code attached to this email. Present this QR code at the venue for entry.
                      </p>
                      
                      <!-- Event Details Card -->
                      <table role="presentation" style="width: 100%; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                        <tr>
                          <td>
                            <h2 style="color: #0369a1; margin: 0 0 15px; font-size: 20px;">${event_title}</h2>
                            <p style="color: #0c4a6e; margin: 0 0 8px; font-size: 14px;">
                              <strong>📅 Date:</strong> ${formattedDate}
                            </p>
                            <p style="color: #0c4a6e; margin: 0 0 8px; font-size: 14px;">
                              <strong>🏛️ Organized by:</strong> ${club_name}
                            </p>
                            <p style="color: #0c4a6e; margin: 0; font-size: 14px;">
                              <strong>🎓 Roll Number:</strong> ${roll_number}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- QR Code Notice -->
                      <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px;">
                          <strong>📱 Your Entry QR Code</strong>
                        </p>
                        <div style="background: #ffffff; border: 3px solid #6366f1; border-radius: 16px; padding: 20px; display: inline-block;">
                          <p style="color: #374151; margin: 0; font-size: 14px;">
                            📎 <strong>Check the attachment</strong> for your QR code image
                          </p>
                        </div>
                        <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0;">
                          This QR code is unique to you and can only be used once
                        </p>
                      </div>
                      
                      <!-- Important Notice -->
                      <table role="presentation" style="width: 100%; background-color: #fef3c7; border-radius: 8px; padding: 15px;">
                        <tr>
                          <td>
                            <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                              <strong>⚠️ Important:</strong> Please save the attached QR code image or take a screenshot. You will need to show this at the venue for entry. Each QR code can only be scanned once.
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
                        See you at the event! 🎊
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

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "QR code generated and email sent",
        qr_token: qrToken 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-event-registration-qr function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
