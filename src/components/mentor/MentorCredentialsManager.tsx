import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus, Users, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

const mentorSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(50, 'Password must be less than 50 characters'),
});

interface Mentor {
  id: string;
  name: string | null;
  email: string;
}

export default function MentorCredentialsManager() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    loadMentors();
  }, []);

  async function loadMentors() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mentors')
        .select('id, name, email')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading mentors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load mentors',
          variant: 'destructive',
        });
        return;
      }

      setMentors(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // Validate form data
      const validatedData = mentorSchema.parse(formData);
      
      setSubmitting(true);

      const { data, error } = await supabase.functions.invoke('create-mentor-account', {
        body: {
          email: validatedData.email,
          password: validatedData.password,
          name: validatedData.name,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        toast({
          title: 'Error',
          description: data.message || 'Failed to create mentor account',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Mentor credential created successfully',
      });

      // Reset form
      setFormData({ name: '', email: '', password: '' });
      
      // Reload mentors list
      loadMentors();

    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Error creating mentor:', error);
        toast({
          title: 'Error',
          description: 'Failed to create mentor account',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Add Mentor Form */}
      <Card className="card-neon rounded-2xl shadow-xl bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Principal/Mentor Credential
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mentor-name">Full Name *</Label>
              <Input
                id="mentor-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentor-email">Email *</Label>
              <Input
                id="mentor-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                required
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentor-password">Password *</Label>
              <div className="relative">
                <Input
                  id="mentor-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password (min 6 characters)"
                  required
                  minLength={6}
                  maxLength={50}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Mentor Credential
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mentors List */}
      <Card className="rounded-2xl shadow-xl bg-white/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Existing Principal/Mentors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          ) : mentors.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No mentors found</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {mentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="p-4 border rounded-lg bg-white flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{mentor.name || 'No Name'}</div>
                    <div className="text-sm text-muted-foreground">{mentor.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
