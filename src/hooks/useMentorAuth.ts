import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useMentorAuth = () => {
  const [loading, setLoading] = useState(false);

  async function login(email: string, password: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from("mentors")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    setLoading(false);

    if (error || !data) return { success: false };

    localStorage.setItem("mentor_email", email);
    return { success: true };
  }

  function logout() {
    localStorage.removeItem("mentor_email");
  }

  const isAuthenticated = Boolean(localStorage.getItem("mentor_email"));

  return { login, logout, loading, isAuthenticated };
};
