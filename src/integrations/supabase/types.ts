export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          club_id: string
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          club_id: string
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          club_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_admin_sessions: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "club_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      club_admins: {
        Row: {
          club_id: string
          created_at: string
          email: string
          id: string
          password_hash: string
        }
        Insert: {
          club_id: string
          created_at?: string
          email: string
          id?: string
          password_hash: string
        }
        Update: {
          club_id?: string
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_admins_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          created_at: string
          id: string
          name: string
          role: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          name: string
          role: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_registrations: {
        Row: {
          branch: string | null
          club_id: string
          created_at: string
          id: string
          past_experience: string | null
          phone: string | null
          roll_number: string | null
          status: Database["public"]["Enums"]["registration_status"]
          student_email: string
          student_name: string
          why_join: string | null
          year: string | null
        }
        Insert: {
          branch?: string | null
          club_id: string
          created_at?: string
          id?: string
          past_experience?: string | null
          phone?: string | null
          roll_number?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          student_email: string
          student_name: string
          why_join?: string | null
          year?: string | null
        }
        Update: {
          branch?: string | null
          club_id?: string
          created_at?: string
          id?: string
          past_experience?: string | null
          phone?: string | null
          roll_number?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          student_email?: string
          student_name?: string
          why_join?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_registrations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_reports: {
        Row: {
          club_id: string
          created_at: string
          file_url: string | null
          id: string
          participants_roll_numbers: string[] | null
          report_data: Json | null
          report_date: string | null
          report_type: Database["public"]["Enums"]["report_type"]
          title: string
        }
        Insert: {
          club_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          participants_roll_numbers?: string[] | null
          report_data?: Json | null
          report_date?: string | null
          report_type: Database["public"]["Enums"]["report_type"]
          title: string
        }
        Update: {
          club_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          participants_roll_numbers?: string[] | null
          report_data?: Json | null
          report_date?: string | null
          report_type?: Database["public"]["Enums"]["report_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_reports_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string
          detailed_description: string | null
          id: string
          logo_url: string | null
          name: string
          registration_open: boolean
          short_description: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          detailed_description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          registration_open?: boolean
          short_description?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          detailed_description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          registration_open?: boolean
          short_description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_images: {
        Row: {
          created_at: string
          event_id: string
          id: string
          image_url: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          image_url: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          branch: string
          created_at: string
          event_id: string
          id: string
          roll_number: string
          student_email: string
          student_name: string
          year: string
        }
        Insert: {
          branch: string
          created_at?: string
          event_id: string
          id?: string
          roll_number: string
          student_email: string
          student_name: string
          year: string
        }
        Update: {
          branch?: string
          created_at?: string
          event_id?: string
          id?: string
          roll_number?: string
          student_email?: string
          student_name?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          club_id: string
          created_at: string
          description: string
          event_date: string | null
          id: string
          registration_open: boolean
          title: string
        }
        Insert: {
          club_id: string
          created_at?: string
          description: string
          event_date?: string | null
          id?: string
          registration_open?: boolean
          title: string
        }
        Update: {
          club_id?: string
          created_at?: string
          description?: string
          event_date?: string | null
          id?: string
          registration_open?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      student_accounts: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          roll_number: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          roll_number: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          roll_number?: string
        }
        Relationships: []
      }
      student_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          student_id: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          student_id?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          student_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_club_admin: {
        Args: { admin_email: string; admin_password: string }
        Returns: {
          club_id: string
          message: string
          success: boolean
          token: string
        }[]
      }
      authenticate_student: {
        Args: { student_password: string; student_roll_number: string }
        Returns: {
          message: string
          roll_number: string
          success: boolean
          token: string
        }[]
      }
      create_club_admin: {
        Args: { admin_email: string; admin_password: string; club_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      get_all_club_credentials: {
        Args: never
        Returns: {
          admin_email: string
          club_name: string
          plain_password: string
        }[]
      }
      get_current_admin_session: {
        Args: never
        Returns: {
          admin_id: string
          club_id: string
        }[]
      }
      get_current_student_session: {
        Args: never
        Returns: {
          roll_number: string
          student_id: string
        }[]
      }
      is_admin_for_event_storage: {
        Args: { event_id_param: string }
        Returns: boolean
      }
      update_club_admin_password: {
        Args: { club_admin_email: string; new_password: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
    }
    Enums: {
      registration_status: "pending" | "approved" | "rejected"
      report_type: "mom" | "event" | "monthly" | "yearly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      registration_status: ["pending", "approved", "rejected"],
      report_type: ["mom", "event", "monthly", "yearly"],
    },
  },
} as const
