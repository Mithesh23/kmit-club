import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserX, Search, Download, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface PastMembersDialogProps {
  clubId: string;
  clubName?: string;
}

interface PastMember {
  id: string;
  student_name: string;
  student_email: string;
  roll_number: string | null;
  phone: string | null;
  branch: string | null;
  created_at: string;
}

export const PastMembersDialog = ({ clubId, clubName }: PastMembersDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pastMembers, setPastMembers] = useState<PastMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open && clubId) {
      fetchPastMembers();
    }
  }, [open, clubId]);

  const fetchPastMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('club_registrations')
        .select('id, student_name, student_email, roll_number, phone, branch, created_at')
        .eq('club_id', clubId)
        .eq('status', 'approved')
        .eq('year', 'Pass Out')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPastMembers(data || []);
    } catch (error) {
      console.error('Failed to fetch past members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = pastMembers.filter(member =>
    member.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.student_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadCSV = () => {
    if (filteredMembers.length === 0) return;

    const csvContent = [
      ['Name', 'Email', 'Phone', 'Roll Number', 'Branch', 'Joined Date'],
      ...filteredMembers.map(member => [
        member.student_name,
        member.student_email,
        member.phone || '',
        member.roll_number || '',
        member.branch || '',
        format(new Date(member.created_at), 'PP')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `past_members_${clubName || 'club'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserX className="h-4 w-4 mr-2" />
          View Past Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Past Members (Pass Out Students)
            {clubName && <span className="text-muted-foreground font-normal">- {clubName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll number, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {filteredMembers.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {filteredMembers.length} Past Member{filteredMembers.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="p-4 border rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{member.student_name}</span>
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                        Pass Out
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {member.student_email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                      )}
                      {member.roll_number && (
                        <div>
                          <span className="font-medium">Roll:</span> {member.roll_number}
                        </div>
                      )}
                      {member.branch && (
                        <div>
                          <span className="font-medium">Branch:</span> {member.branch}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joined: {format(new Date(member.created_at), 'PP')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">No Past Members</h4>
                <p className="text-sm text-muted-foreground">
                  {searchQuery 
                    ? 'No past members match your search criteria.' 
                    : 'No students have passed out from this club yet.'}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
