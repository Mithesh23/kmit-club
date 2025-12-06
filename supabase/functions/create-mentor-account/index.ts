import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, name } = await req.json();

    console.log('Creating mentor account for:', email);

    // Validate required fields
    if (!email || !password || !name) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ success: false, message: 'Email, password, and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if mentor with this email already exists
    const { data: existingMentor, error: checkError } = await supabase
      .from('mentors')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing mentor:', checkError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error checking existing mentor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingMentor) {
      console.error('Mentor with this email already exists');
      return new Response(
        JSON.stringify({ success: false, message: 'A mentor with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new mentor
    const { data: newMentor, error: insertError } = await supabase
      .from('mentors')
      .insert({
        email: email.toLowerCase().trim(),
        password: password,
        name: name.trim(),
      })
      .select('id, email, name')
      .single();

    if (insertError) {
      console.error('Error creating mentor:', insertError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to create mentor account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Mentor account created successfully:', newMentor.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mentor account created successfully',
        mentor: { id: newMentor.id, email: newMentor.email, name: newMentor.name }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
