import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { isPast, parseISO, startOfDay } from 'date-fns';

// Roll number validation: 2 digits + "BD" + 1 digit + "A" + 2 digits + 2 alphanumeric (case-insensitive)
const rollNumberRegex = /^\d{2}[bB][dD]\d[aA]\d{2}[0-9A-Za-z]{2}$/;

const registrationSchema = z.object({
  student_name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  student_email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  roll_number: z.string().trim()
    .min(1, 'Roll number is required')
    .length(10, 'Roll number must be exactly 10 characters')
    .regex(rollNumberRegex, 'Roll number must follow format: e.g., 24BD1A2345 or 24BD1A23AB'),
  branch: z.string().min(1, 'Branch is required'),
  year: z.string().min(1, 'Year is required'),
});

interface EventRegistrationDialogProps {
  eventId: string;
  eventTitle: string;
  registrationOpen: boolean;
  eventDate?: string | null;
  clubName?: string;
}

export const EventRegistrationDialog = ({ 
  eventId, 
  eventTitle, 
  registrationOpen,
  eventDate,
  clubName = 'KMIT Club'
}: EventRegistrationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rollNumberTouched, setRollNumberTouched] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { toast } = useToast();
  const isSubmittingRef = useRef(false); // Prevent double submissions
  
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    roll_number: '',
    branch: '',
    year: '',
  });

  const isRollNumberValid = formData.roll_number === '' || rollNumberRegex.test(formData.roll_number);
  const showRollNumberError = rollNumberTouched && formData.roll_number !== '' && !isRollNumberValid;

  // Check if event date has passed - auto-close registration
  const isEventDatePassed = eventDate ? isPast(startOfDay(parseISO(eventDate))) : false;
  const isRegistrationActuallyOpen = registrationOpen && !isEventDatePassed;

  const resetForm = useCallback(() => {
    setFormData({
      student_name: '',
      student_email: '',
      roll_number: '',
      branch: '',
      year: '',
    });
    setRollNumberTouched(false);
    setRegistrationSuccess(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    
    try {
      // Validate form data
      const validatedData = registrationSchema.parse(formData);
      
      setLoading(true);

      const registrationData = {
        event_id: eventId,
        student_name: validatedData.student_name,
        student_email: validatedData.student_email,
        roll_number: validatedData.roll_number.toUpperCase(),
        branch: validatedData.branch,
        year: validatedData.year,
      };

      // Fast database insert - this is the critical path
      const { data: insertedData, error } = await supabase
        .from('event_registrations')
        .insert([registrationData as any])
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Registered',
            description: 'You have already registered for this event.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      // Show immediate success - registration is complete
      setRegistrationSuccess(true);
      toast({
        title: 'Registration Successful! 🎉',
        description: 'Check your email shortly for your entry QR code.',
      });

      // Send QR email ASYNCHRONOUSLY - don't block the UI
      // This fires and forgets - the user sees success immediately
      supabase.functions.invoke('send-event-registration-qr', {
        body: {
          registration_id: insertedData.id,
          event_id: eventId,
          event_title: eventTitle,
          event_date: eventDate,
          student_name: validatedData.student_name,
          student_email: validatedData.student_email,
          roll_number: validatedData.roll_number.toUpperCase(),
          club_name: clubName,
        },
      }).then(({ error: qrError }) => {
        if (qrError) {
          console.error('QR email failed (async):', qrError);
          // Email failed but registration succeeded - log for monitoring
        }
      }).catch(err => {
        console.error('QR email error (async):', err);
      });

      // Close dialog after a brief moment to show success state
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1500);

    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Registration error:', error);
        toast({
          title: 'Error',
          description: 'Failed to register. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }, [formData, eventId, eventTitle, eventDate, clubName, loading, toast, resetForm]);

  // Reset form when dialog closes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  }, [resetForm]);

  if (!isRegistrationActuallyOpen) {
    return (
      <Button disabled className="w-full" size="lg">
        {isEventDatePassed ? 'Event Completed' : 'Registration Closed'}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-primary hover:shadow-elegant transition-all" size="lg">
          <UserPlus className="h-5 w-5 mr-2" />
          Register for Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Register for {eventTitle}</DialogTitle>
        </DialogHeader>
        
        {registrationSuccess ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-in zoom-in duration-300" />
            <h3 className="text-xl font-semibold text-green-600">Registration Complete!</h3>
            <p className="text-muted-foreground">Check your email for your QR code entry pass.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="student_name">Full Name *</Label>
              <Input
                id="student_name"
                value={formData.student_name}
                onChange={(e) => setFormData(prev => ({ ...prev, student_name: e.target.value }))}
                placeholder="Enter your full name"
                required
                maxLength={100}
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_email">Email *</Label>
              <Input
                id="student_email"
                type="email"
                value={formData.student_email}
                onChange={(e) => setFormData(prev => ({ ...prev, student_email: e.target.value }))}
                placeholder="your.email@example.com"
                required
                maxLength={255}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roll_number">Roll Number *</Label>
              <Input
                id="roll_number"
                value={formData.roll_number}
                onChange={(e) => setFormData(prev => ({ ...prev, roll_number: e.target.value.toUpperCase() }))}
                onBlur={() => setRollNumberTouched(true)}
                placeholder="e.g., 24BD1A2345"
                required
                maxLength={10}
                disabled={loading}
                className={showRollNumberError ? 'border-destructive' : ''}
                autoComplete="off"
              />
              {showRollNumberError && (
                <p className="text-xs text-destructive">Invalid format. Example: 24BD1A2345</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch *</Label>
              <Select 
                value={formData.branch} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}
                disabled={loading}
              >
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select your branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSE">Computer Science Engineering</SelectItem>
                  <SelectItem value="CSE (AI & ML)">CSE (AI & ML)</SelectItem>
                  <SelectItem value="CSE (DS)">CSE (DS)</SelectItem>
                  <SelectItem value="IT">Information Technology</SelectItem>
                  <SelectItem value="ECE">Electronics & Communication</SelectItem>
                  <SelectItem value="EEE">Electrical & Electronics</SelectItem>
                  <SelectItem value="MECH">Mechanical Engineering</SelectItem>
                  <SelectItem value="CIVIL">Civil Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Select 
                value={formData.year} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
                disabled={loading}
              >
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isRollNumberValid}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Submit Registration'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
