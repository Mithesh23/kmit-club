import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudentSession } from '@/types/student';

export const useStudentAuth = () => {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('student_auth_token');
    const rollNumber = localStorage.getItem('student_roll_number');
    
    if (token && rollNumber) {
      setSession({
        success: true,
        token,
        roll_number: rollNumber,
        message: 'Restored session'
      });
    }
    
    setLoading(false);
  }, []);

  const login = async (rollNumber: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.rpc('authenticate_student', {
        student_roll_number: rollNumber,
        student_password: password
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0] as StudentSession;
        
        if (result.success) {
          localStorage.setItem('student_auth_token', result.token);
          localStorage.setItem('student_roll_number', result.roll_number);
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
    localStorage.removeItem('student_auth_token');
    localStorage.removeItem('student_roll_number');
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
