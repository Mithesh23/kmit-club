import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Phone, Edit } from 'lucide-react';

const SUPABASE_URL = "https://qvsrhfzdkjygjuwmfwmh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c";

interface StudentProfileDialogProps {
  rollNumber: string;
  currentEmail?: string;
  currentPhone?: string;
  onUpdate?: () => void;
}

export const StudentProfileDialog = ({
  rollNumber,
  currentEmail,
  currentPhone,
  onUpdate
}: StudentProfileDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(currentEmail || '');
  const [phone, setPhone] = useState(currentPhone || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Sync state when props change (e.g. after data refetch)
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setEmail(currentEmail || '');
      setPhone(currentPhone || '');
    }
    setOpen(newOpen);
  };

  const handleUpdate = async () => {
    if (!email.trim()) {
      toast({ title: "Validation Error", description: "Email is required.", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Validation Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    if (phone && !/^[0-9]{10}$/.test(phone.replace(/\D/g, ''))) {
      toast({ title: "Validation Error", description: "Please enter a valid 10-digit phone number.", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('student_auth_token');
      if (!token) throw new Error('Not authenticated. Please login again.');

      // Update student_accounts using direct fetch with x-student-token header
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/student_accounts?roll_number=eq.${encodeURIComponent(rollNumber)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'x-student-token': token,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            student_email: email.trim(),
            phone: phone.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Update failed (${response.status})`);
      }

      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
      setOpen(false);
      onUpdate?.();
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message || "Failed to update profile.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Update Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roll">Roll Number</Label>
            <Input id="roll" value={rollNumber} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
