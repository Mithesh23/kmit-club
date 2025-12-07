import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { club_id, is_active, mentor_token } = await req.json();

    if (!club_id || is_active === undefined || !mentor_token) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: club_id, is_active, mentor_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify mentor session token
    const { data: sessionData, error: sessionError } = await supabase
      .from('mentor_sessions')
      .select('mentor_id, expires_at')
      .eq('token', mentor_token)
      .single();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired mentor session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Mentor session has expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update club status
    const { error: updateError } = await supabase
      .from('clubs')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', club_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update club status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: `Club ${is_active ? 'enabled' : 'disabled'} successfully` }),
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
