import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roll_number } = await req.json();

    if (!roll_number) {
      return new Response(
        JSON.stringify({ error: 'Roll number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find student by roll number (case-insensitive)
    const normalizedRollNumber = roll_number.toUpperCase();
    
    const { data: student, error: studentError } = await supabase
      .from('student_accounts')
      .select('roll_number, student_email')
      .ilike('roll_number', normalizedRollNumber)
      .single();

    if (studentError || !student) {
      // Don't reveal if account exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: 'If your account exists, you will receive a password reset email.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no email in student_accounts, try to find from club_registrations
    let studentEmail = student.student_email;
    
    if (!studentEmail) {
      const { data: registration } = await supabase
        .from('club_registrations')
        .select('student_email')
        .ilike('roll_number', normalizedRollNumber)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (registration?.student_email) {
        studentEmail = registration.student_email;
        
        // Also update the student_accounts with this email for future use
        await supabase
          .from('student_accounts')
          .update({ student_email: studentEmail })
          .ilike('roll_number', normalizedRollNumber);
      }
    }

    if (!studentEmail) {
      return new Response(
        JSON.stringify({ error: 'No email associated with this account. Please contact admin.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Store token
    const { error: tokenError } = await supabase
      .from('student_password_reset_tokens')
      .insert({
        roll_number: student.roll_number,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Token insert error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email using Resend
    const resetUrl = `https://b8f6bed5-b35f-4f5e-9a29-46c68d6fdfe0.lovableproject.com/reset-password?token=${resetToken}`;
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'KMIT Clubs <noreply@kmitclubs.in>',
        to: [studentEmail],
        subject: 'Reset Your Password - KMIT Clubs',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; text-align: center;">Password Reset Request</h1>
            <p style="color: #333; font-size: 16px;">Hello,</p>
            <p style="color: #333; font-size: 16px;">We received a request to reset your password for your KMIT Clubs account (Roll Number: <strong>${student.roll_number}</strong>).</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="color: #4f46e5; font-size: 14px; word-break: break-all;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">KMIT Clubs Portal</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to send reset email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password reset email sent to:', student.student_email);

    return new Response(
      JSON.stringify({ success: true, message: 'If your account exists, you will receive a password reset email.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
