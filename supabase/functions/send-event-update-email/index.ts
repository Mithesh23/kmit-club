import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EventUpdateEmailRequest {
  eventId: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting event update email process...");

    // Get request body
    const { eventId, subject, message }: EventUpdateEmailRequest = await req.json();

    // Validate input
    if (!eventId || !subject || !message) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: eventId, subject, message" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Extract token
    const token = authHeader.replace("Bearer ", "");

    // Verify admin session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.rpc(
      "get_current_admin_session",
      {},
      {
        headers: {
          authorization: authHeader,
        },
      }
    );

    if (sessionError || !sessionData || sessionData.length === 0) {
      console.error("Invalid admin session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid session" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const adminSession = sessionData[0];
    console.log("Admin session verified for club:", adminSession.club_id);

    // Get event details and verify it belongs to the admin's club
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, title, club_id, clubs(name)")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event not found:", eventError);
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify admin has permission for this event
    if (event.club_id !== adminSession.club_id) {
      console.error("Admin does not have permission for this event");
      return new Response(
        JSON.stringify({ error: "Unauthorized: You don't have permission for this event" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get all registrations for the event
    const { data: registrations, error: registrationsError } = await supabaseAdmin
      .from("event_registrations")
      .select("student_name, student_email")
      .eq("event_id", eventId);

    if (registrationsError) {
      console.error("Error fetching registrations:", registrationsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch registrations" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!registrations || registrations.length === 0) {
      console.log("No registrations found for event");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No registrations found for this event",
          sent: 0 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${registrations.length} registrations. Sending emails...`);

    // Send emails to all registered students
    const clubName = event.clubs?.name || "Club";
    let successCount = 0;
    let failCount = 0;

    const emailPromises = registrations.map(async (registration) => {
      try {
        const { data, error } = await resend.emails.send({
          from: `${clubName} <noreply@kmitclubs.in>`,
          to: [registration.student_email],
          subject: `${event.title}: ${subject}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
                  .header h1 { margin: 0; font-size: 24px; }
                  .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; }
                  .message { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                  .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
                  .event-title { color: #667eea; font-weight: 600; margin: 10px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📢 Event Update</h1>
                  </div>
                  <div class="content">
                    <p>Hello ${registration.student_name},</p>
                    <p class="event-title">Event: ${event.title}</p>
                    <div class="message">
                      ${message.replace(/\n/g, '<br>')}
                    </div>
                    <p>Thank you for your registration!</p>
                    <p>Best regards,<br><strong>${clubName}</strong></p>
                  </div>
                  <div class="footer">
                    <p>This email was sent to registered participants of ${event.title}</p>
                    <p>© ${new Date().getFullYear()} ${clubName}. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        if (error) {
          console.error(`Failed to send email to ${registration.student_email}:`, error);
          failCount++;
        } else {
          console.log(`Email sent successfully to ${registration.student_email}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error sending email to ${registration.student_email}:`, error);
        failCount++;
      }
    });

    await Promise.all(emailPromises);

    console.log(`Email sending complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emails sent: ${successCount} successful, ${failCount} failed`,
        sent: successCount,
        failed: failCount,
        total: registrations.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-event-update-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
