import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnnouncementEmailRequest {
  clubId: string;
  clubName: string;
  title: string;
  content: string;
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
  title: string,
  content: string,
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
        subject: `${clubName} Announcement: ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
              ${clubName}
            </h1>
            <h2 style="color: #555;">
              ${title}
            </h2>
            <div style="color: #666; line-height: 1.6; margin: 20px 0;">
              ${content.replace(/\n/g, '<br>')}
            </div>
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an official announcement from ${clubName}. You received this because you are an approved member.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error(`[Attempt ${attempts}] Email error for ${to}:`, error);
        lastError = error.message || 'Unknown error';
        
        if (attempts <= maxRetries) {
          console.log(`[Attempt ${attempts}] Retrying after delay...`);
          await delay(1000); // 1 second delay before retry
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
    const { clubId, clubName, title, content }: AnnouncementEmailRequest = await req.json();

    console.log(`Starting announcement email process for club: ${clubName}`);

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all approved club members' emails (excluding pass-out students)
    const { data: members, error: membersError } = await supabase
      .from('club_registrations')
      .select('student_email, student_name')
      .eq('club_id', clubId)
      .eq('status', 'approved')
      .neq('year', 'Pass Out');

    if (membersError) {
      console.error('Error fetching members:', membersError);
      throw new Error('Failed to fetch club members');
    }

    if (!members || members.length === 0) {
      console.log('No approved members found for this club');
      return new Response(
        JSON.stringify({ 
          message: 'No members to send emails to',
          summary: { total: 0, sent: 0, failed: 0, retried: 0 }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${members.length} approved members. Starting sequential email sending with throttling...`);

    const results: EmailResult[] = [];
    
    // Send emails sequentially with 2-second delay between each
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      
      console.log(`Processing email ${i + 1}/${members.length} for ${member.student_email}`);
      
      const result = await sendEmailWithRetry(
        member.student_email,
        member.student_name,
        clubName,
        title,
        content
      );
      
      results.push(result);
      
      // Add 2-second delay between emails (except for the last one)
      if (i < members.length - 1) {
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
        message: `Announcement emails completed: ${summary.sent + summary.retried} successful, ${summary.failed} failed`,
        summary,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-announcement-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
