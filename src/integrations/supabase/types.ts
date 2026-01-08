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
      attendance_events: {
        Row: {
          club_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          event_date: string
          event_time: string
          id: string
          title: string
        }
        Insert: {
          club_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          event_date: string
          event_time: string
          id?: string
          title: string
        }
        Update: {
          club_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          event_date?: string
          event_time?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_event_id: string
          created_at: string
          id: string
          present: boolean
          roll_number: string
        }
        Insert: {
          attendance_event_id: string
          created_at?: string
          id?: string
          present?: boolean
          roll_number: string
        }
        Update: {
          attendance_event_id?: string
          created_at?: string
          id?: string
          present?: boolean
          roll_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_attendance_event_id_fkey"
            columns: ["attendance_event_id"]
            isOneToOne: false
            referencedRelation: "attendance_events"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_requests: {
        Row: {
          club_id: string
          created_at: string
          event_id: string
          id: string
          requested_at: string
          responded_at: string | null
          status: string
        }
        Insert: {
          club_id: string
          created_at?: string
          event_id: string
          id?: string
          requested_at?: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          event_id?: string
          id?: string
          requested_at?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_requests_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          certificate_title: string
          club_id: string
          created_at: string
          description: string | null
          event_id: string
          id: string
          issued_at: string
          roll_number: string
          student_email: string
          student_name: string
        }
        Insert: {
          certificate_number?: string
          certificate_title: string
          club_id: string
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          issued_at?: string
          roll_number: string
          student_email: string
          student_name: string
        }
        Update: {
          certificate_number?: string
          certificate_title?: string
          club_id?: string
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          issued_at?: string
          roll_number?: string
          student_email?: string
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_active: boolean
          linkedin_url: string | null
          logo_url: string | null
          name: string
          registration_1st_year: boolean
          registration_2nd_year: boolean
          registration_3rd_year: boolean
          registration_4th_year: boolean
          registration_open: boolean
          short_description: string | null
          twitter_url: string | null
          updated_at: string
          website_url: string | null
          whatsapp_url: string | null
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          detailed_description?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          registration_1st_year?: boolean
          registration_2nd_year?: boolean
          registration_3rd_year?: boolean
          registration_4th_year?: boolean
          registration_open?: boolean
          short_description?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          detailed_description?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          registration_1st_year?: boolean
          registration_2nd_year?: boolean
          registration_3rd_year?: boolean
          registration_4th_year?: boolean
          registration_open?: boolean
          short_description?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
          whatsapp_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      event_attendance: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_present: boolean
          qr_token: string
          registration_id: string
          roll_number: string
          scanned_at: string | null
          student_email: string
          student_name: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_present?: boolean
          qr_token: string
          registration_id: string
          roll_number: string
          scanned_at?: string | null
          student_email: string
          student_name: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_present?: boolean
          qr_token?: string
          registration_id?: string
          roll_number?: string
          scanned_at?: string | null
          student_email?: string
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
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
          certificate_permission: boolean
          club_id: string
          created_at: string
          description: string
          event_date: string | null
          id: string
          registration_open: boolean
          title: string
        }
        Insert: {
          certificate_permission?: boolean
          club_id: string
          created_at?: string
          description: string
          event_date?: string | null
          id?: string
          registration_open?: boolean
          title: string
        }
        Update: {
          certificate_permission?: boolean
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
      kmit_event_images: {
        Row: {
          created_at: string | null
          event_id: number | null
          id: number
          image_url: string
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          id?: never
          image_url: string
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          id?: never
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "kmit_event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "kmit_events"
            referencedColumns: ["id"]
          },
        ]
      }
      kmit_events: {
        Row: {
          category: string
          created_at: string | null
          date: string
          description: string | null
          drive_link: string | null
          id: number
          name: string
          ticket_url: string | null
          year: number
        }
        Insert: {
          category: string
          created_at?: string | null
          date: string
          description?: string | null
          drive_link?: string | null
          id?: never
          name: string
          ticket_url?: string | null
          year: number
        }
        Update: {
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          drive_link?: string | null
          id?: never
          name?: string
          ticket_url?: string | null
          year?: number
        }
        Relationships: []
      }
      mentor_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          mentor_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          mentor_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          mentor_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          email: string
          id: string
          name: string | null
          password: string
        }
        Insert: {
          email: string
          id?: string
          name?: string | null
          password: string
        }
        Update: {
          email?: string
          id?: string
          name?: string | null
          password?: string
        }
        Relationships: []
      }
      student_accounts: {
        Row: {
          branch: string | null
          created_at: string | null
          id: string
          password_hash: string
          phone: string | null
          roll_number: string
          student_email: string | null
          year: string | null
        }
        Insert: {
          branch?: string | null
          created_at?: string | null
          id?: string
          password_hash: string
          phone?: string | null
          roll_number: string
          student_email?: string | null
          year?: string | null
        }
        Update: {
          branch?: string | null
          created_at?: string | null
          id?: string
          password_hash?: string
          phone?: string | null
          roll_number?: string
          student_email?: string | null
          year?: string | null
        }
        Relationships: []
      }
      student_password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          roll_number: string
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          roll_number: string
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          roll_number?: string
          token?: string
          used?: boolean
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
      authenticate_mentor: {
        Args: { mentor_email: string; mentor_password: string }
        Returns: {
          mentor_id: string
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
      change_club_admin_password: {
        Args: {
          admin_club_id: string
          new_password: string
          old_password: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      change_mentor_password: {
        Args: {
          mentor_email_param: string
          new_password: string
          old_password: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      change_student_password: {
        Args: {
          new_password: string
          old_password: string
          student_roll_number: string
        }
        Returns: {
          message: string
          success: boolean
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
          password_changed: boolean
          plain_password: string
        }[]
      }
      get_all_mentor_credentials: {
        Args: never
        Returns: {
          email: string
          id: string
          name: string
          password: string
        }[]
      }
      get_all_student_credentials: {
        Args: never
        Returns: {
          branch: string
          id: string
          password_changed: boolean
          phone: string
          roll_number: string
          student_email: string
          year: string
        }[]
      }
      get_current_admin_session: {
        Args: never
        Returns: {
          admin_id: string
          club_id: string
        }[]
      }
      get_current_mentor_session: {
        Args: never
        Returns: {
          mentor_id: string
        }[]
      }
      get_current_student_session: {
        Args: never
        Returns: {
          roll_number: string
          student_id: string
        }[]
      }
      insert_daily_student_session: { Args: never; Returns: undefined }
      is_admin_for_event_storage: {
        Args: { event_id_param: string }
        Returns: boolean
      }
      is_club_active: { Args: { club_id_param: string }; Returns: boolean }
      is_mentor: { Args: never; Returns: boolean }
      mark_event_attendance: {
        Args: { p_event_id: string; p_qr_token: string }
        Returns: {
          message: string
          roll_number: string
          scanned_at: string
          student_name: string
          success: boolean
        }[]
      }
      mentor_create_club: {
        Args: {
          p_name: string
          p_registration_open?: boolean
          p_short_description?: string
        }
        Returns: string
      }
      mentor_update_club_status: {
        Args: { p_club_id: string; p_is_active: boolean }
        Returns: boolean
      }
      promote_students_yearly: { Args: never; Returns: undefined }
      reset_student_password_with_token: {
        Args: { new_password: string; reset_token: string }
        Returns: {
          message: string
          success: boolean
        }[]
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
