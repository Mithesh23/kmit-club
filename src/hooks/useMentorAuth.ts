import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MentorSession {
  success: boolean;
  token: string;
  mentor_id: string;
  message: string;
}

export const useMentorAuth = () => {
  const [session, setSession] = useState<MentorSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const token = localStorage.getItem('mentor_auth_token');
    const mentorId = localStorage.getItem('mentor_id');
    
    if (token && mentorId) {
      setSession({
        success: true,
        token,
        mentor_id: mentorId,
        message: 'Restored session'
      });
    }
    
    setLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('authenticate_mentor', {
        mentor_email: email,
        mentor_password: password
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0] as MentorSession;
        
        if (result.success) {
          localStorage.setItem('mentor_auth_token', result.token);
          localStorage.setItem('mentor_id', result.mentor_id);
          localStorage.setItem('mentor_email', email);
          setSession(result);
          return { success: true, message: result.message };
        } else {
          return { success: false, message: result.message };
        }
      }

      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("mentor_auth_token");
    localStorage.removeItem("mentor_id");
    localStorage.removeItem("mentor_email");
    setSession(null);
  }

  const isAuthenticated = !!session?.success;
  const token = session?.token || localStorage.getItem('mentor_auth_token');

  return { login, logout, loading, isAuthenticated, token, session };
};

// Helper to get mentor supabase client with auth token
export const getMentorSupabaseClient = () => {
  const token = localStorage.getItem('mentor_auth_token');
  
  return {
    client: supabase,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  };
};
