import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserPlus, Users, Eye, EyeOff, Mail, User, ShieldCheck, KeyRound } from 'lucide-react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

      setFormData({ name: '', email: '', password: '' });
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

  function getInitials(name: string | null): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      {/* Add Mentor Form */}
      <Card className="border-border/50 shadow-lg bg-background/95 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            Add New Credential
          </CardTitle>
          <CardDescription>Create a new principal or mentor login credential</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="mentor-name" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name *
              </Label>
              <Input
                id="mentor-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
                maxLength={100}
                className="rounded-lg h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentor-email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address *
              </Label>
              <Input
                id="mentor-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="mentor@example.com"
                required
                maxLength={255}
                className="rounded-lg h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentor-password" className="text-sm font-medium flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Password *
              </Label>
              <div className="relative">
                <Input
                  id="mentor-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  maxLength={50}
                  className="rounded-lg h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
            </div>

            <Separator className="my-4" />

            <Button 
              type="submit" 
              className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 font-medium" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Credential...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Create Credential
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mentors List */}
      <Card className="border-border/50 shadow-lg bg-background/95 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                Existing Credentials
              </CardTitle>
              <CardDescription className="mt-1.5">
                {mentors.length} credential{mentors.length !== 1 ? 's' : ''} registered
              </CardDescription>
            </div>
            <Badge variant="secondary" className="h-7 px-3">
              {mentors.length} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">Loading credentials...</p>
            </div>
          ) : mentors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="p-4 rounded-full bg-muted">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">No credentials found</p>
                <p className="text-sm text-muted-foreground mt-1">Add your first credential using the form</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {mentors.map((mentor, index) => (
                <div
                  key={mentor.id}
                  className="p-4 border border-border/50 rounded-xl bg-background hover:bg-muted/30 hover:border-primary/30 transition-all duration-200 group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(mentor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">
                          {mentor.name || 'Unnamed Mentor'}
                        </h4>
                        <Badge variant="outline" className="text-xs shrink-0 bg-success/10 text-success border-success/30">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {mentor.email}
                      </p>
                    </div>
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
