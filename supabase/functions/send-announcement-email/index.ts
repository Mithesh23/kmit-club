import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "npm:resend@2.0.0";

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clubId, clubName, title, content }: AnnouncementEmailRequest = await req.json();

    console.log(`Sending announcement email for club: ${clubName}`);

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all approved club members' emails
    const { data: members, error: membersError } = await supabase
      .from('club_registrations')
      .select('student_email, student_name')
      .eq('club_id', clubId)
      .eq('status', 'approved');

    if (membersError) {
      console.error('Error fetching members:', membersError);
      throw new Error('Failed to fetch club members');
    }

    if (!members || members.length === 0) {
      console.log('No approved members found for this club');
      return new Response(
        JSON.stringify({ message: 'No members to send emails to' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${members.length} approved members`);

    // Send email to all members
    const emailPromises = members.map(async (member) => {
      try {
        const { data, error } = await resend.emails.send({
          from: `${clubName} <onboarding@resend.dev>`,
          to: [member.student_email],
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
          console.error(`Failed to send email to ${member.student_email}:`, error);
          return { success: false, email: member.student_email, error };
        }

        console.log(`Email sent to ${member.student_email}:`, data.id);
        return { success: true, email: member.student_email, emailId: data.id };
      } catch (error) {
        console.error(`Failed to send email to ${member.student_email}:`, error);
        return { success: false, email: member.student_email, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Successfully sent ${successCount} out of ${members.length} emails`);

    return new Response(
      JSON.stringify({
        message: `Sent ${successCount} emails to club members`,
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
