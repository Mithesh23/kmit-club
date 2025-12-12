import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Copy, Users, GraduationCap, Shield, 
  ArrowUpDown, Eye, EyeOff, Loader2, X 
} from 'lucide-react';

interface ClubCredential {
  club_name: string;
  admin_email: string;
  plain_password: string;
}

interface MentorCredential {
  id: string;
  name: string | null;
  email: string;
  password: string;
}

interface StudentCredential {
  id: string;
  roll_number: string;
  student_email: string | null;
  phone: string | null;
  year: string | null;
  branch: string | null;
}

interface DeveloperCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeveloperCredentialsDialog = ({ open, onOpenChange }: DeveloperCredentialsDialogProps) => {
  const [clubs, setClubs] = useState<ClubCredential[]>([]);
  const [mentors, setMentors] = useState<MentorCredential[]>([]);
  const [students, setStudents] = useState<StudentCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAllCredentials();
      
      // Set up real-time subscriptions for updates
      const studentChannel = supabase
        .channel('dev-student-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_accounts' }, () => {
          fetchStudentCredentials();
        })
        .subscribe();

      const mentorChannel = supabase
        .channel('dev-mentor-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mentors' }, () => {
          fetchMentorCredentials();
        })
        .subscribe();

      const clubChannel = supabase
        .channel('dev-club-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'club_admins' }, () => {
          fetchClubCredentials();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(studentChannel);
        supabase.removeChannel(mentorChannel);
        supabase.removeChannel(clubChannel);
      };
    }
  }, [open]);

  const fetchClubCredentials = async () => {
    const { data, error } = await supabase.rpc('get_all_club_credentials');
    if (!error && data) setClubs(data);
  };

  const fetchMentorCredentials = async () => {
    const { data, error } = await supabase.rpc('get_all_mentor_credentials');
    if (!error && data) setMentors(data);
  };

  const fetchStudentCredentials = async () => {
    const { data, error } = await supabase.rpc('get_all_student_credentials');
    if (!error && data) setStudents(data);
  };

  const fetchAllCredentials = async () => {
    setLoading(true);
    try {
      // Fetch club credentials using RPC
      await fetchClubCredentials();

      // Fetch mentors using RPC
      await fetchMentorCredentials();

      // Fetch students using RPC
      await fetchStudentCredentials();

    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Get unique values for filters
  const uniqueYears = useMemo(() => {
    const years = students.map(s => s.year).filter(Boolean);
    return [...new Set(years)] as string[];
  }, [students]);

  const uniqueBranches = useMemo(() => {
    const branches = students.map(s => s.branch).filter(Boolean);
    return [...new Set(branches)] as string[];
  }, [students]);

  // Filtered and sorted data
  const filteredClubs = useMemo(() => {
    let result = clubs.filter(c => 
      c.club_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.admin_email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return result.sort((a, b) => 
      sortOrder === 'asc' 
        ? a.club_name.localeCompare(b.club_name)
        : b.club_name.localeCompare(a.club_name)
    );
  }, [clubs, searchQuery, sortOrder]);

  const filteredMentors = useMemo(() => {
    let result = mentors.filter(m => 
      (m.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return result.sort((a, b) => 
      sortOrder === 'asc'
        ? (a.name || a.email).localeCompare(b.name || b.email)
        : (b.name || b.email).localeCompare(a.name || a.email)
    );
  }, [mentors, searchQuery, sortOrder]);

  const filteredStudents = useMemo(() => {
    let result = students.filter(s => {
      const matchesSearch = 
        s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.student_email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesYear = yearFilter === 'all' || s.year === yearFilter;
      const matchesBranch = branchFilter === 'all' || s.branch === branchFilter;
      return matchesSearch && matchesYear && matchesBranch;
    });
    return result.sort((a, b) => 
      sortOrder === 'asc'
        ? a.roll_number.localeCompare(b.roll_number)
        : b.roll_number.localeCompare(a.roll_number)
    );
  }, [students, searchQuery, sortOrder, yearFilter, branchFilter]);

  const CredentialCard = ({ 
    title, 
    subtitle, 
    email, 
    password, 
    id,
    extraInfo 
  }: { 
    title: string; 
    subtitle?: string; 
    email: string; 
    password: string; 
    id: string;
    extraInfo?: React.ReactNode;
  }) => (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {extraInfo}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">Email:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{email}</code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => copyToClipboard(email, 'Email')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">Password:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
              {visiblePasswords.has(id) ? password : '••••••••'}
            </code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => togglePasswordVisibility(id)}
            >
              {visiblePasswords.has(id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => copyToClipboard(password, 'Password')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Developer Console</DialogTitle>
                <p className="text-sm text-muted-foreground">All system credentials</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 border-b bg-muted/30">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="clubs" className="flex-1">
            <div className="px-4 pt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="clubs" className="gap-2">
                  <Users className="h-4 w-4" />
                  Clubs ({filteredClubs.length})
                </TabsTrigger>
                <TabsTrigger value="mentors" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Mentors ({filteredMentors.length})
                </TabsTrigger>
                <TabsTrigger value="students" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Students ({filteredStudents.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="clubs" className="m-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="grid gap-3">
                  {filteredClubs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No clubs found</p>
                  ) : (
                    filteredClubs.map((club, idx) => (
                      <CredentialCard
                        key={idx}
                        id={`club-${idx}`}
                        title={club.club_name}
                        email={club.admin_email}
                        password={club.plain_password}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="mentors" className="m-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="grid gap-3">
                  {filteredMentors.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No mentors found</p>
                  ) : (
                    filteredMentors.map((mentor) => (
                      <CredentialCard
                        key={mentor.id}
                        id={mentor.id}
                        title={mentor.name || 'Unnamed Mentor'}
                        email={mentor.email}
                        password={mentor.password}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="students" className="m-0">
              <div className="px-4 pt-2 pb-2 flex gap-2">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {uniqueYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {uniqueBranches.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(yearFilter !== 'all' || branchFilter !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => { setYearFilter('all'); setBranchFilter('all'); }}
                  >
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[350px] p-4 pt-0">
                <div className="grid gap-3">
                  {filteredStudents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No students found</p>
                  ) : (
                    filteredStudents.map((student) => (
                      <CredentialCard
                        key={student.id}
                        id={student.id}
                        title={student.roll_number}
                        subtitle={student.student_email || undefined}
                        email={student.roll_number}
                        password="Kmitclubs123"
                        extraInfo={
                          <div className="flex gap-1">
                            {student.year && <Badge variant="secondary" className="text-xs">{student.year}</Badge>}
                            {student.branch && <Badge variant="outline" className="text-xs">{student.branch}</Badge>}
                          </div>
                        }
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};