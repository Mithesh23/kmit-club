import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [rollNumber, setRollNumber] = useState('');
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [whyJoin, setWhyJoin] = useState('');
  const [pastExperience, setPastExperience] = useState('');
  const { mutate: register, isPending } = useRegisterForClub();
  const { toast } = useToast();

  // Roll number validation: 2 digits + "bd" + "a" + 4 digits (case-insensitive)
  const validateRollNumber = (rollNo: string): boolean => {
    const rollNumberRegex = /^\d{2}[bB][dD][aA]\d{4}$/;
    return rollNumberRegex.test(rollNo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate roll number format
    if (!validateRollNumber(rollNumber)) {
      toast({
        title: "Invalid Roll Number",
        description: "Roll number must follow format: 2 digits + BD + A + 4 digits (e.g., 24BDA1234)",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }

    register(
      {
        club_id: club.id,
        student_name: studentName,
        student_email: studentEmail,
        phone: phone || null,
        roll_number: rollNumber || null,
        year: year || null,
        branch: branch || null,
        why_join: whyJoin || null,
        past_experience: pastExperience || null,
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
          setRollNumber('');
          setYear('');
          setBranch('');
          setWhyJoin('');
          setPastExperience('');
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
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-display font-bold text-gradient">
            Join {club.name}
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Start your journey with us today
          </p>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
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
            <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter 10 digit phone number"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setPhone(value);
                }
              }}
              className="h-12 bg-white/50 border-primary/20 focus:border-primary"
              pattern="\d{10}"
              maxLength={10}
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="rollNumber" className="text-sm font-semibold">Roll Number</Label>
            <Input
              id="rollNumber"
              placeholder="e.g., 24BDA1234"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
              className="h-12 bg-white/50 border-primary/20 focus:border-primary"
              maxLength={10}
              required
            />
            <p className="text-xs text-muted-foreground">Format: 2 digits + BD + A + 4 digits</p>
          </div>
            
          <div className="grid grid-cols-2 gap-4">
  {/* Year Dropdown */}
  <div className="space-y-3">
    <Label htmlFor="year" className="text-sm font-semibold">Year</Label>
    <select
      id="year"
      value={year}
      onChange={(e) => setYear(e.target.value)}
      className="h-12 bg-white/50 border border-primary/20 rounded-md px-3 focus:border-primary"
      required
    >
      <option value="">Select Year</option>
      <option value="1st Year">1st Year</option>
      <option value="2nd Year">2nd Year</option>
      <option value="3rd Year">3rd Year</option>
      <option value="4th Year">4th Year</option>
    </select>
  </div>

  {/* Branch Dropdown */}
  <div className="space-y-3">
    <Label htmlFor="branch" className="text-sm font-semibold">Branch</Label>
    <select
      id="branch"
      value={branch}
      onChange={(e) => setBranch(e.target.value)}
      className="h-12 bg-white/50 border border-primary/20 rounded-md px-3 focus:border-primary"
      required
    >
      <option value="">Select Branch</option>
      <option value="CSE">CSE</option>
      <option value="CSE (AI & ML)">CSE (AI & ML)</option>
      <option value="CSE (DS)">CSE (DS)</option>
      <option value="IT">IT</option>
    </select>
  </div>
</div>

            
          <div className="space-y-3">
            <Label htmlFor="whyJoin" className="text-sm font-semibold">Why do you want to join this club?</Label>
            <Textarea
              id="whyJoin"
              placeholder="Tell us your motivation..."
              value={whyJoin}
              onChange={(e) => setWhyJoin(e.target.value)}
              className="min-h-[100px] bg-white/50 border-primary/20 focus:border-primary resize-none"
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="pastExperience" className="text-sm font-semibold">Any past experience in clubs?</Label>
            <Textarea
              id="pastExperience"
              placeholder="Share your club experience..."
              value={pastExperience}
              onChange={(e) => setPastExperience(e.target.value)}
              className="min-h-[100px] bg-white/50 border-primary/20 focus:border-primary resize-none"
              required
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
