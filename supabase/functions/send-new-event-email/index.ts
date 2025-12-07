import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewEventEmailRequest {
  eventId: string;
  clubId: string;
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
  eventDescription: string,
  eventDate: string | null,
  isMentor: boolean = false,
  maxRetries: number = 2
): Promise<EmailResult> {
  let attempts = 0;
  let lastError: string | undefined;

  const formattedDate = eventDate 
    ? new Date(eventDate).toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Date to be announced';

  while (attempts <= maxRetries) {
    attempts++;
    try {
      console.log(`[Attempt ${attempts}] Sending email to ${to}...`);
      
      const { data, error } = await resend.emails.send({
        from: `KMIT Clubs <noreply@kmitclubs.in>`,
        to: [to],
        subject: `🎉 New Event: ${eventTitle} - ${clubName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .header .club-name { font-size: 16px; opacity: 0.9; margin-top: 8px; }
                .content { background: #ffffff; padding: 35px 30px; border: 1px solid #e5e7eb; border-top: none; }
                .event-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #667eea; }
                .event-title { color: #1e293b; font-weight: 700; font-size: 22px; margin-bottom: 15px; }
                .event-date { color: #667eea; font-weight: 600; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center; }
                .event-date::before { content: '📅'; margin-right: 8px; }
                .event-description { color: #475569; font-size: 15px; line-height: 1.7; }
                .footer { background: #f9fafb; padding: 25px 30px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .badge { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 15px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <span class="badge">NEW EVENT</span>
                  <h1>🎊 New Event Announced!</h1>
                  <div class="club-name">from ${clubName}</div>
                </div>
                <div class="content">
                  <p>Hello ${name},</p>
                  <p>${isMentor 
                    ? `A new event has been created by <strong>${clubName}</strong>. Here are the details:` 
                    : `Great news! <strong>${clubName}</strong> has announced a new event. Check out the details below:`}
                  </p>
                  
                  <div class="event-card">
                    <div class="event-title">${eventTitle}</div>
                    <div class="event-date">${formattedDate}</div>
                    <div class="event-description">${eventDescription.replace(/\n/g, '<br>')}</div>
                  </div>
                  
                  ${isMentor 
                    ? `<p>As a mentor/principal, you are receiving this notification to stay updated on club activities.</p>` 
                    : `<p>Don't miss out on this exciting event! Make sure to register and participate.</p>`}
                  
                  <p>Best regards,<br><strong>KMIT Clubs Team</strong></p>
                </div>
                <div class="footer">
                  <p>You received this email because ${isMentor ? 'you are a mentor/principal at KMIT' : `you are a member of ${clubName}`}.</p>
                  <p>© ${new Date().getFullYear()} KMIT Clubs Hub. All rights reserved.</p>
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
    console.log("Starting new event email notification process...");

    const { eventId, clubId }: NewEventEmailRequest = await req.json();

    if (!eventId || !clubId) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: eventId, clubId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

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

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, title, description, event_date, club_id, clubs(name)")
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

    const clubName = (event.clubs as any)?.name || "Club";
    console.log(`Processing new event notification for: ${event.title} by ${clubName}`);

    // Get all approved club members (excluding Pass Out students)
    const { data: clubMembers, error: membersError } = await supabaseAdmin
      .from("club_registrations")
      .select("student_name, student_email, year")
      .eq("club_id", clubId)
      .eq("status", "approved")
      .neq("year", "Pass Out");

    if (membersError) {
      console.error("Error fetching club members:", membersError);
    }

    // Get all mentors/principals
    const { data: mentors, error: mentorsError } = await supabaseAdmin
      .from("mentors")
      .select("name, email");

    if (mentorsError) {
      console.error("Error fetching mentors:", mentorsError);
    }

    const allRecipients: Array<{ name: string; email: string; isMentor: boolean }> = [];

    // Add club members
    if (clubMembers && clubMembers.length > 0) {
      clubMembers.forEach(member => {
        if (member.student_email) {
          allRecipients.push({
            name: member.student_name,
            email: member.student_email,
            isMentor: false,
          });
        }
      });
    }

    // Add mentors
    if (mentors && mentors.length > 0) {
      mentors.forEach(mentor => {
        if (mentor.email) {
          allRecipients.push({
            name: mentor.name || "Mentor",
            email: mentor.email,
            isMentor: true,
          });
        }
      });
    }

    if (allRecipients.length === 0) {
      console.log("No recipients found for new event notification");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No recipients found for this club",
          summary: { total: 0, sent: 0, failed: 0, retried: 0, members: 0, mentors: 0 }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${allRecipients.length} recipients (${clubMembers?.length || 0} members, ${mentors?.length || 0} mentors). Starting email sending...`);

    const results: EmailResult[] = [];

    // Send emails sequentially with 2-second delay between each
    for (let i = 0; i < allRecipients.length; i++) {
      const recipient = allRecipients[i];
      
      console.log(`Processing email ${i + 1}/${allRecipients.length} for ${recipient.email} (${recipient.isMentor ? 'Mentor' : 'Member'})`);
      
      const result = await sendEmailWithRetry(
        recipient.email,
        recipient.name,
        clubName,
        event.title,
        event.description,
        event.event_date,
        recipient.isMentor
      );
      
      results.push(result);
      
      // Add 2-second delay between emails (except for the last one)
      if (i < allRecipients.length - 1) {
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
      members: clubMembers?.length || 0,
      mentors: mentors?.length || 0,
    };

    console.log(`Email sending complete. Summary:`, summary);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emails sent: ${summary.sent + summary.retried} successful, ${summary.failed} failed`,
        summary,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-new-event-email function:", error);
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
