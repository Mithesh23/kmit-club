export interface Club {
  id: string;
  name: string;
  short_description: string | null;
  detailed_description: string | null;
  registration_open: boolean;
  created_at: string;
  updated_at: string;
  logo_url: string | null;
}

export interface ClubMember {
  id: string;
  club_id: string;
  name: string;
  role: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  club_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Event {
  id: string;
  club_id: string;
  title: string;
  description: string;
  event_date?: string | null;
  created_at: string;
  registration_open?: boolean;
  event_images?: EventImage[];
}

export interface EventImage {
  id: string;
  event_id: string;
  image_url: string;
  created_at: string;
}

export interface ClubRegistration {
  id: string;
  club_id: string;
  student_name: string;
  student_email: string;
  phone: string | null;
  roll_number: string | null;
  year: string | null;
  branch: string | null;
  why_join: string | null;
  past_experience: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ClubReport {
  id: string;
  club_id: string;
  title: string;
  report_type: 'mom' | 'monthly' | 'yearly' | 'event';
  file_url: string | null;
  report_date: string | null;
  participants_roll_numbers: string[] | null;
  report_data: Record<string, any> | null;
  created_at: string;
}

export interface ClubAdmin {
  id: string;
  club_id: string;
  email: string;
  created_at: string;
}

export interface ClubSession {
  success: boolean;
  token: string;
  club_id: string;
  message: string;
}