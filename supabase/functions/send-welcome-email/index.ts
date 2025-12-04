import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  studentName: string;
  studentEmail: string;
  clubName: string;
  rollNumber?: string;
  defaultPassword?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, studentEmail, clubName, rollNumber, defaultPassword }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${studentEmail} for club: ${clubName}`);

    const loginSection = rollNumber ? `
      <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
        <h3 style="color: #155724; margin-top: 0; margin-bottom: 15px;">🔐 Your Login Credentials</h3>
        <p style="margin: 0; color: #155724;">
          <strong>Username (Roll Number):</strong> ${rollNumber}<br/>
          <strong>Default Password:</strong> ${defaultPassword || 'Kmitclubs123'}
        </p>
        <p style="margin-top: 15px; margin-bottom: 0; color: #155724; font-size: 14px;">
          Visit the KMIT Clubs Hub and click "Student Login" to access your dashboard.
        </p>
      </div>
    ` : '';

    const { data, error } = await resend.emails.send({
      from: `${clubName} <noreply@kmitclubs.in>`,
      to: [studentEmail],
      subject: `Welcome to ${clubName}! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #007bff; font-size: 32px; margin-bottom: 10px;">
              🎉 Welcome to ${clubName}! 🎉
            </h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">
              Congratulations, ${studentName}!
            </h2>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              Your registration has been approved, and you are now officially a member of ${clubName}.
            </p>
          </div>

          ${loginSection}

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Login to your student dashboard to see all your clubs</li>
              <li>You'll receive announcements and updates about club activities via email</li>
              <li>Check your club dashboard for upcoming events and meetings</li>
              <li>Stay active and participate in club activities</li>
              <li>Connect with fellow club members</li>
            </ul>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404;">
              <strong>Important:</strong> Keep an eye on your email for important announcements and event notifications from ${clubName}.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              We're excited to have you as part of our community!
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This is an automated message from ${clubName}. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      throw error;
    }

    console.log("Welcome email sent successfully:", data.id);

    return new Response(
      JSON.stringify({ 
        message: 'Welcome email sent successfully',
        emailId: data.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
