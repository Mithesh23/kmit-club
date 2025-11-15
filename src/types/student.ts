export interface StudentSession {
  success: boolean;
  token: string;
  roll_number: string;
  message: string;
}

export interface StudentClub {
  id: string;
  club_id: string;
  club: {
    id: string;
    name: string;
    short_description: string | null;
    logo_url: string | null;
  };
}

export interface AttendanceRecord {
  id: string;
  title: string;
  report_type: 'mom' | 'monthly' | 'yearly' | 'event';
  report_date: string | null;
  created_at: string;
  club: {
    name: string;
  };
}
