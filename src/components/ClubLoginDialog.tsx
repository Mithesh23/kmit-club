import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClubAuth } from '@/hooks/useClubAuth';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ClubLoginDialog = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: clubLogin } = useClubAuth();
  const { login: studentLogin } = useStudentAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await clubLogin(email, password);
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: result.message,
        });
        setOpen(false);
        setEmail('');
        setPassword('');
        navigate('/admin');
      } else {
        toast({
          title: "Login Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await studentLogin(rollNumber, studentPassword);
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: result.message,
        });
        setOpen(false);
        setRollNumber('');
        setStudentPassword('');
        navigate('/student/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LogIn className="h-4 w-4" />
          Club Login
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="club" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="club">Club Admin</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
          </TabsList>
          
          <TabsContent value="club" className="space-y-4">
            <form onSubmit={handleClubSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="club-email">Email</Label>
                <Input
                  id="club-email"
                  type="email"
                  placeholder="Enter your club admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club-password">Password</Label>
                <Input
                  id="club-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login as Club Admin'
                )}
              </Button>
            </form>
            <div className="text-xs text-muted-foreground">
              <p>Demo credentials:</p>
              <p>Email: organizingcommity@kmit.ac.in</p>
              <p>Password: Kmit123$</p>
            </div>
          </TabsContent>

          <TabsContent value="student" className="space-y-4">
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roll-number">Roll Number</Label>
                <Input
                  id="roll-number"
                  type="text"
                  placeholder="Enter your roll number"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-password">Password</Label>
                <Input
                  id="student-password"
                  type="password"
                  placeholder="Enter your password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login as Student'
                )}
              </Button>
            </form>
            <div className="text-xs text-muted-foreground">
              <p>Use your registered roll number and password</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
