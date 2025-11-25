import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClubAuth } from '@/hooks/useClubAuth';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// NEW: For Login Tabs
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const ClubLoginDialog = () => {
  const [open, setOpen] = useState(false);

  // Club login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useClubAuth();

  // Student login
  const [studentRoll, setStudentRoll] = useState('');
  const [studentPass, setStudentPass] = useState('');

  // Faculty login
  const [facultyUser, setFacultyUser] = useState('');
  const [facultyPass, setFacultyPass] = useState('');

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleClubLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      
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

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (studentRoll === "" || studentPass === "") {
      toast({
        title: "Missing Details",
        description: "Please enter roll number and password.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Student Login",
      description: "Student login functionality will be added soon.",
    });
  };

  const handleFacultyLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (facultyUser === "" || facultyPass === "") {
      toast({
        title: "Missing Details",
        description: "Please enter username and password.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Faculty Login",
      description: "Faculty login functionality will be added soon.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LogIn className="h-4 w-4" />
          Login
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Login Type</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="club" className="w-full mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="club">Club</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="faculty">Mentor</TabsTrigger>
          </TabsList>

          {/* ---------- CLUB LOGIN (Unchanged Functionality) ---------- */}
          <TabsContent value="club">
            <form onSubmit={handleClubLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter club admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
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
                  "Login"
                )}
              </Button>
            </form>

            <div className="text-xs text-muted-foreground mt-4">
              <p>Demo credentials:</p>
              <p>Email: organizingcommity@kmit.ac.in</p>
              <p>Password: Kmit123$</p>
            </div>
          </TabsContent>

          {/* ---------- STUDENT LOGIN ---------- */}
          <TabsContent value="student">
            <form onSubmit={handleStudentLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input
                  placeholder="Enter roll number"
                  value={studentRoll}
                  onChange={(e) => setStudentRoll(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={studentPass}
                  onChange={(e) => setStudentPass(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                Login as Student
              </Button>
            </form>
          </TabsContent>

          {/* ---------- FACULTY LOGIN ---------- */}
          <TabsContent value="faculty">
            <form onSubmit={handleFacultyLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  placeholder="Enter username"
                  value={facultyUser}
                  onChange={(e) => setFacultyUser(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={facultyPass}
                  onChange={(e) => setFacultyPass(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                Login as Mentor
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
