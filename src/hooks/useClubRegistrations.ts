import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useApprovedRegistrations = (clubId: string) => {
  return useQuery({
    queryKey: ["approved-registrations", clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_registrations")
        .select("*")
        .eq("club_id", clubId)
        .eq("status", "approved")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!clubId,
  });
};
