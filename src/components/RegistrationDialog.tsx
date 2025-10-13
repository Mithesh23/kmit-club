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
        phone: phone || null,
        status: 'pending'
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
        <Button className="w-full btn-gradient shadow-lg text-lg py-6 font-semibold">
          <UserPlus className="h-5 w-5 mr-2" />
          Register to Join Club
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-gradient-card border-0 shadow-elegant">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-display font-bold text-gradient">
            Join {club.name}
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Start your journey with us today
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="h-12 bg-white/50 border-primary/20 focus:border-primary"
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="h-12 bg-white/50 border-primary/20 focus:border-primary"
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-sm font-semibold">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 bg-white/50 border-primary/20 focus:border-primary"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 btn-gradient text-lg font-semibold shadow-lg" 
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Registering...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};