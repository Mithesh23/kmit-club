import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus } from 'lucide-react';
import { z } from 'zod';

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
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    roll_number: '',
    branch: '',
    year: '',
  });

  const isRollNumberValid = formData.roll_number === '' || rollNumberRegex.test(formData.roll_number);
  const showRollNumberError = rollNumberTouched && formData.roll_number !== '' && !isRollNumberValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      const { data: insertedData, error } = await supabase
        .from('event_registrations')
        .insert([registrationData as any])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Registered',
            description: 'You have already registered for this event with this email.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      // Send QR code email
      try {
        console.log('Sending QR code email...');
        const { error: qrError } = await supabase.functions.invoke('send-event-registration-qr', {
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
        });

        if (qrError) {
          console.error('Failed to send QR email:', qrError);
          // Registration succeeded, but QR email failed - still show success
          toast({
            title: 'Registration Successful!',
            description: `You have been registered for ${eventTitle}. QR code email may be delayed.`,
          });
        } else {
          toast({
            title: 'Registration Successful! 🎉',
            description: `Check your email for your entry QR code!`,
          });
        }
      } catch (qrEmailError) {
        console.error('QR email error:', qrEmailError);
        toast({
          title: 'Registration Successful!',
          description: `You have been registered for ${eventTitle}.`,
        });
      }

      setFormData({
        student_name: '',
        student_email: '',
        roll_number: '',
        branch: '',
        year: '',
      });
      
      setOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to register for the event. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!registrationOpen) {
    return (
      <Button disabled className="w-full" size="lg">
        Registration Closed
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="student_name">Full Name *</Label>
            <Input
              id="student_name"
              value={formData.student_name}
              onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
              placeholder="Enter your full name"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student_email">Email *</Label>
            <Input
              id="student_email"
              type="email"
              value={formData.student_email}
              onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
              placeholder="your.email@example.com"
              required
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roll_number">Roll Number *</Label>
            <Input
              id="roll_number"
              value={formData.roll_number}
              onChange={(e) => setFormData({ ...formData, roll_number: e.target.value.toUpperCase() })}
              onBlur={() => setRollNumberTouched(true)}
              placeholder="e.g., 24BD1A2345 or 24BD1A23AB"
              required
              maxLength={10}
              className={showRollNumberError ? 'border-destructive' : ''}
            />
            {showRollNumberError && (
              <p className="text-xs text-destructive">Invalid format. Example: 24BD1A2345 or 24BD1A23AB</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">Branch *</Label>
            <Select 
              value={formData.branch} 
              onValueChange={(value) => setFormData({ ...formData, branch: value })}
            >
              <SelectTrigger id="branch">
                <SelectValue placeholder="Select your branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSE">Computer Science Engineering</SelectItem>
                <SelectItem value="ECE">Electronics & Communication Engineering</SelectItem>
                <SelectItem value="EEE">Electrical & Electronics Engineering</SelectItem>
                <SelectItem value="MECH">Mechanical Engineering</SelectItem>
                <SelectItem value="CIVIL">Civil Engineering</SelectItem>
                <SelectItem value="IT">Information Technology</SelectItem>
                <SelectItem value="AIDS">Artificial Intelligence & Data Science</SelectItem>
                <SelectItem value="CSBS">Computer Science & Business Systems</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Select 
              value={formData.year} 
              onValueChange={(value) => setFormData({ ...formData, year: value })}
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

          <Button type="submit" className="w-full" disabled={loading}>
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
      </DialogContent>
    </Dialog>
  );
};
