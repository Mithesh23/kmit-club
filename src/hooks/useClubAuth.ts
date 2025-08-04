import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClubSession } from '@/types/club';

export const useClubAuth = () => {
  const [session, setSession] = useState<ClubSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('club_auth_token');
    const clubId = localStorage.getItem('club_id');
    
    if (token && clubId) {
      setSession({
        success: true,
        token,
        club_id: clubId,
        message: 'Restored session'
      });
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.rpc('authenticate_club_admin', {
        admin_email: email,
        admin_password: password
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0] as ClubSession;
        
        if (result.success) {
          localStorage.setItem('club_auth_token', result.token);
          localStorage.setItem('club_id', result.club_id);
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
    }
  };

  const logout = () => {
    localStorage.removeItem('club_auth_token');
    localStorage.removeItem('club_id');
    setSession(null);
  };

  return {
    session,
    loading,
    login,
    logout,
    isAuthenticated: !!session?.success
  };
};