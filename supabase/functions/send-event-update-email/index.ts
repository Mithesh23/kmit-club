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

interface EmailResult {
  email: string;
  status: 'sent' | 'failed' | 'retried';
  attempts: number;
  error?: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Send a single email with retry logic
async function sendEmailWithRetry(
  to: string,
  name: string,
  clubName: string,
  eventTitle: string,
  subject: string,
  message: string,
  maxRetries: number = 2
): Promise<EmailResult> {
  let attempts = 0;
  let lastError: string | undefined;

  while (attempts <= maxRetries) {
    attempts++;
    try {
      console.log(`[Attempt ${attempts}] Sending email to ${to}...`);
      
      const { data, error } = await resend.emails.send({
        from: `${clubName} <noreply@kmitclubs.in>`,
        to: [to],
        subject: `${eventTitle}: ${subject}`,
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
                  <p>Hello ${name},</p>
                  <p class="event-title">Event: ${eventTitle}</p>
                  <div class="message">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                  <p>Thank you for your registration!</p>
                  <p>Best regards,<br><strong>${clubName}</strong></p>
                </div>
                <div class="footer">
                  <p>This email was sent to registered participants of ${eventTitle}</p>
                  <p>© ${new Date().getFullYear()} ${clubName}. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error(`[Attempt ${attempts}] Email error for ${to}:`, error);
        lastError = error.message || 'Unknown error';
        
        if (attempts <= maxRetries) {
          console.log(`[Attempt ${attempts}] Retrying after delay...`);
          await delay(1000);
          continue;
        }
      } else {
        console.log(`[Attempt ${attempts}] Email sent successfully to ${to}: ${data?.id}`);
        return {
          email: to,
          status: attempts > 1 ? 'retried' : 'sent',
          attempts,
        };
      }
    } catch (error: any) {
      console.error(`[Attempt ${attempts}] Exception sending to ${to}:`, error);
      lastError = error.message || 'Unknown exception';
      
      if (attempts <= maxRetries) {
        console.log(`[Attempt ${attempts}] Retrying after delay...`);
        await delay(1000);
        continue;
      }
    }
  }

  return {
    email: to,
    status: 'failed',
    attempts,
    error: lastError,
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting event update email process...");

    const { eventId, subject, message }: EventUpdateEmailRequest = await req.json();

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

    // Get auth token from request header
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

    // Create admin client with service role for database operations
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

    // Validate admin session by checking the token directly in club_admin_sessions table
    const token = authHeader.replace('Bearer ', '');
    
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from("club_admin_sessions")
      .select("admin_id, club_admins(club_id)")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      console.error("Invalid admin session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired session" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const clubId = (sessionData.club_admins as any)?.club_id;
    if (!clubId) {
      console.error("Could not determine club_id from session");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Could not determine club" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Admin session verified for club:", clubId);

    // Fetch event details
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

    // Verify admin has permission for this event's club
    if (event.club_id !== clubId) {
      console.error("Admin does not have permission for this event");
      return new Response(
        JSON.stringify({ error: "Unauthorized: You don't have permission for this event" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Fetch event registrations
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
          summary: { total: 0, sent: 0, failed: 0, retried: 0 }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${registrations.length} registrations. Starting sequential email sending with throttling...`);

    const clubName = (event.clubs as any)?.name || "Club";
    const results: EmailResult[] = [];

    // Send emails sequentially with 2-second delay between each
    for (let i = 0; i < registrations.length; i++) {
      const registration = registrations[i];
      
      console.log(`Processing email ${i + 1}/${registrations.length} for ${registration.student_email}`);
      
      const result = await sendEmailWithRetry(
        registration.student_email,
        registration.student_name,
        clubName,
        event.title,
        subject,
        message
      );
      
      results.push(result);
      
      // Add 2-second delay between emails (except for the last one)
      if (i < registrations.length - 1) {
        console.log(`Waiting 2 seconds before next email...`);
        await delay(2000);
      }
    }

    // Calculate summary
    const summary = {
      total: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      retried: results.filter(r => r.status === 'retried').length,
      failed: results.filter(r => r.status === 'failed').length,
    };

    console.log(`Email sending complete. Summary:`, summary);
    console.log(`Detailed results:`, JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emails sent: ${summary.sent + summary.retried} successful, ${summary.failed} failed`,
        summary,
        results,
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
