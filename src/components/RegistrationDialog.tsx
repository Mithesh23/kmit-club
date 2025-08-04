import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegisterForClub } from '@/hooks/useClubs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
import { Club } from '@/types/club';

interface RegistrationDialogProps {
  club: Club;
}

export const RegistrationDialog = ({ club }: RegistrationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { mutate: register, isPending } = useRegisterForClub();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    register(
      {
        club_id: club.id,
        student_name: studentName,
        student_email: studentEmail,
        phone: phone || null
      },
      {
        onSuccess: () => {
          toast({
            title: "Registration Successful!",
            description: `You have successfully registered for ${club.name}`,
          });
          setOpen(false);
          setStudentName('');
          setStudentEmail('');
          setPhone('');
        },
        onError: (error: any) => {
          toast({
            title: "Registration Failed",
            description: error.message || "Failed to register. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (!club.registration_open) {
    return (
      <Button disabled variant="secondary" className="w-full">
        No registration for now!!
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
          <UserPlus className="h-4 w-4" />
          Register to Join Club
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register for {club.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              'Register'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};