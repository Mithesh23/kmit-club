import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  rollNumber: z.string().min(1, "Roll number is required").max(20, "Roll number too long"),
  password: z.string().min(1, "Password is required").max(100, "Password too long"),
});

const StudentLogin = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('student_auth_token');
    if (token) {
      navigate('/student/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const result = loginSchema.safeParse({ rollNumber, password });
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('authenticate_student', {
        student_roll_number: rollNumber.trim(),
        student_password: password,
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].success) {
        localStorage.setItem('student_auth_token', data[0].token);
        localStorage.setItem('student_roll_number', data[0].roll_number);
        
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        
        navigate('/student/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: data?.[0]?.message || "Invalid roll number or password.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-light to-primary-100 flex items-center justify-center p-4 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="card-elegant border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-display">Student Login</CardTitle>
            <CardDescription>
              Enter your roll number and password to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  type="text"
                  placeholder="Enter your roll number"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  disabled={isLoading}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-background"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-elegant"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Your login credentials are generated automatically when your club registration is approved.
                <br /><br />
                <strong>Username:</strong> Your Roll Number
                <br />
                <strong>Default Password:</strong> Kmitclubs123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentLogin;
