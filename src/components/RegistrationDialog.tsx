import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRegisterForClub } from '@/hooks/useClubs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';
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
  const [rollNumberTouched, setRollNumberTouched] = useState(false);
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [whyJoin, setWhyJoin] = useState('');
  const [pastExperience, setPastExperience] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { mutate: register, isPending } = useRegisterForClub();
  const { toast } = useToast();
  const isSubmittingRef = useRef(false); // Prevent double submissions

  // Roll number validation: 2 digits + "BD" + 1 digit + "A" + 2 digits + 2 alphanumeric (case-insensitive)
  const rollNumberRegex = /^\d{2}[bB][dD]\d[aA]\d{2}[0-9A-Za-z]{2}$/;
  const validateRollNumber = (rollNo: string): boolean => {
    return rollNumberRegex.test(rollNo);
  };
  const isRollNumberValid = rollNumber === '' || validateRollNumber(rollNumber);
  const showRollNumberError = rollNumberTouched && rollNumber !== '' && !isRollNumberValid;

  const resetForm = useCallback(() => {
    setStudentName('');
    setStudentEmail('');
    setPhone('');
    setRollNumber('');
    setYear('');
    setBranch('');
    setWhyJoin('');
    setPastExperience('');
    setRollNumberTouched(false);
    setRegistrationSuccess(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submissions
    if (isSubmittingRef.current || isPending) return;
    isSubmittingRef.current = true;

    // Validate roll number format
    if (!validateRollNumber(rollNumber)) {
      toast({
        title: "Invalid Roll Number",
        description: "Roll number must follow format: e.g., 24BD1A2345 or 24BD1A23AB",
        variant: "destructive",
      });
      isSubmittingRef.current = false;
      return;
    }

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive",
      });
      isSubmittingRef.current = false;
      return;
    }

    register(
      {
        club_id: club.id,
        student_name: studentName,
        student_email: studentEmail,
        phone: phone || null,
        roll_number: rollNumber.toUpperCase() || null,
        year: year || null,
        branch: branch || null,
        why_join: whyJoin || null,
        past_experience: pastExperience || null,
        status: 'pending'
      },
      {
        onSuccess: () => {
          setRegistrationSuccess(true);
          toast({
            title: "Registration Successful! 🎉",
            description: `Your application for ${club.name} has been submitted.`,
          });
          // Close dialog after showing success
          setTimeout(() => {
            setOpen(false);
            resetForm();
          }, 1500);
        },
        onError: (error: any) => {
          const message = error?.message?.includes('duplicate') 
            ? "You have already registered for this club."
            : error.message || "Failed to register. Please try again.";
          toast({
            title: "Registration Failed",
            description: message,
            variant: "destructive",
          });
        },
        onSettled: () => {
          isSubmittingRef.current = false;
        }
      }
    );
  }, [club.id, club.name, studentName, studentEmail, phone, rollNumber, year, branch, whyJoin, pastExperience, register, toast, isPending, resetForm]);

  // Reset form when dialog closes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  }, [resetForm]);

  // Check if registration is open
  if (!club.registration_open) {
    return (
      <Button disabled variant="secondary" className="w-full">
        No registration for now!!
      </Button>
    );
  }

  // Get allowed years based on club settings
  const getAllowedYears = () => {
    const years: string[] = [];
    if (club.registration_1st_year) years.push('1st Year');
    if (club.registration_2nd_year) years.push('2nd Year');
    if (club.registration_3rd_year) years.push('3rd Year');
    if (club.registration_4th_year) years.push('4th Year');
    return years;
  };

  const allowedYears = getAllowedYears();

  // If no years are allowed, show disabled button
  if (allowedYears.length === 0) {
    return (
      <Button disabled variant="secondary" className="w-full">
        No registration for now!!
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
        
        {registrationSuccess ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-in zoom-in duration-300" />
            <h3 className="text-xl font-semibold text-green-600">Application Submitted!</h3>
            <p className="text-muted-foreground">Your registration is pending approval.</p>
          </div>
        ) : (
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
                  disabled={isPending}
                  autoComplete="name"
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
                  disabled={isPending}
                  autoComplete="email"
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
                  disabled={isPending}
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="rollNumber" className="text-sm font-semibold">Roll Number</Label>
                <Input
                  id="rollNumber"
                  placeholder="e.g., 24BD1A2345"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  onBlur={() => setRollNumberTouched(true)}
                  className={`h-12 bg-white/50 focus:border-primary ${showRollNumberError ? 'border-destructive' : 'border-primary/20'}`}
                  maxLength={10}
                  required
                  disabled={isPending}
                  autoComplete="off"
                />
                {showRollNumberError && (
                  <p className="text-xs text-destructive">Invalid format. Example: 24BD1A2345</p>
                )}
              </div>
                
              <div className="grid grid-cols-2 gap-4">
                {/* Year Dropdown */}
                <div className="space-y-3">
                  <Label htmlFor="year" className="text-sm font-semibold">Year</Label>
                  <select
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-12 bg-white/50 border border-primary/20 rounded-md px-3 focus:border-primary"
                    required
                    disabled={isPending}
                  >
                    <option value="">Select Year</option>
                    {allowedYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Branch Dropdown */}
                <div className="space-y-3">
                  <Label htmlFor="branch" className="text-sm font-semibold">Branch</Label>
                  <select
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full h-12 bg-white/50 border border-primary/20 rounded-md px-3 focus:border-primary"
                    required
                    disabled={isPending}
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
                  disabled={isPending}
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
                  disabled={isPending}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 btn-gradient text-lg font-semibold shadow-lg" 
                disabled={isPending || !isRollNumberValid}
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
        )}
      </DialogContent>
    </Dialog>
  );
};
