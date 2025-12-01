import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { rollNumber, password = 'Kmitclubs123' } = await req.json();

    if (!rollNumber) {
      return new Response(
        JSON.stringify({ success: false, message: 'Roll number is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Creating student account for roll number: ${rollNumber}`);

    // Check if account already exists
    const { data: existingAccount, error: checkError } = await supabase
      .from('student_accounts')
      .select('id')
      .eq('roll_number', rollNumber)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing account:', checkError);
      return new Response(
        JSON.stringify({ success: false, message: 'Error checking account' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (existingAccount) {
      console.log(`Account already exists for: ${rollNumber}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Account already exists', alreadyExists: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the student account
    const { error: insertError } = await supabase
      .from('student_accounts')
      .insert({
        roll_number: rollNumber,
        password_hash: hashedPassword,
      });

    if (insertError) {
      console.error('Error creating student account:', insertError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to create account' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Successfully created account for: ${rollNumber}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-student-account:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
