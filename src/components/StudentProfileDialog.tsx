import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Mail, Phone, Edit } from 'lucide-react';

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

  const handleUpdate = async () => {
    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic phone validation (optional but if provided should be valid)
    if (phone && !/^[0-9]{10}$/.test(phone.replace(/\D/g, ''))) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('student_auth_token');
      
      // Create a client with the custom x-student-token header for RLS
      const { createClient } = await import('@supabase/supabase-js');
      const authClient = createClient(
        'https://qvsrhfzdkjygjuwmfwmh.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c',
        {
          global: {
            headers: {
              'x-student-token': token || ''
            }
          }
        }
      );
      
      const { error } = await authClient
        .from('student_accounts')
        .update({
          student_email: email.trim(),
          phone: phone.trim() || null
        })
        .eq('roll_number', rollNumber);

      if (error) throw error;

      // Also update club_registrations for consistency
      await authClient
        .from('club_registrations')
        .update({
          student_email: email.trim(),
          phone: phone.trim() || null
        })
        .eq('roll_number', rollNumber);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      setOpen(false);
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <Input
              id="roll"
              value={rollNumber}
              disabled
              className="bg-muted"
            />
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
