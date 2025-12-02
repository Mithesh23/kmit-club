
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClubAuth } from '@/hooks/useClubAuth';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

// Tabs
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const ClubLoginDialog = () => {
  const [open, setOpen] = useState(false);

  // Club login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useClubAuth();

  // Password visibility toggles
  const [showClubPass, setShowClubPass] = useState(false);
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [showMentorPass, setShowMentorPass] = useState(false);

  // Student login
  const [studentRoll, setStudentRoll] = useState('');
  const [studentPass, setStudentPass] = useState('');

  // Mentor login
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorPassword, setMentorPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  /* ------------------------ CLUB LOGIN HANDLER ------------------------ */
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

  /* ------------------------ STUDENT LOGIN HANDLER ------------------------ */
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();

    toast({
      title: "Student Login",
      description: "Student login functionality will be added soon.",
    });
  };

  /* ------------------------ MENTOR LOGIN HANDLER ------------------------ */
  const handleMentorLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mentorEmail || !mentorPassword) {
      toast({
        title: "Missing Details",
        description: "Please enter mentor email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("mentors")
      .select("*")
      .eq("email", mentorEmail)
      .eq("password", mentorPassword)
      .single();

    setLoading(false);

    if (error || !data) {
      toast({
        title: "Login Failed",
        description: "Invalid mentor credentials",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Login Successful",
      description: "Welcome Mentor!",
    });

    localStorage.setItem("mentor_email", mentorEmail);

    setOpen(false);
    navigate("/mentor/dashboard");
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
            <TabsTrigger value="faculty">Principal</TabsTrigger>
          </TabsList>

          {/* ---------------- CLUB LOGIN TAB ---------------- */}
          <TabsContent value="club">
            <form onSubmit={handleClubLogin} className="space-y-4 mt-4">
              
              {/* Email */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Enter club admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password with Eye Toggle */}
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showClubPass ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowClubPass(!showClubPass)}
                  >
                    {showClubPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* ---------------- STUDENT LOGIN TAB ---------------- */}
          <TabsContent value="student">
            <form onSubmit={handleStudentLogin} className="space-y-4 mt-4">

              {/* Roll Number */}
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input
                  placeholder="Enter roll number"
                  value={studentRoll}
                  onChange={(e) => setStudentRoll(e.target.value)}
                />
              </div>

              {/* Password with Eye Toggle */}
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showStudentPass ? "text" : "password"}
                    placeholder="Enter password"
                    value={studentPass}
                    onChange={(e) => setStudentPass(e.target.value)}
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowStudentPass(!showStudentPass)}
                  >
                    {showStudentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Login as Student
              </Button>
            </form>
          </TabsContent>

          {/* ---------------- MENTOR LOGIN TAB ---------------- */}
          <TabsContent value="faculty">
            <form onSubmit={handleMentorLogin} className="space-y-4 mt-4">

              {/* Mentor Email */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Enter Principal email"
                  value={mentorEmail}
                  onChange={(e) => setMentorEmail(e.target.value)}
                />
              </div>

              {/* Password with Eye Toggle */}
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showMentorPass ? "text" : "password"}
                    placeholder="Enter password"
                    value={mentorPassword}
                    onChange={(e) => setMentorPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowMentorPass(!showMentorPass)}
                  >
                    {showMentorPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Login as Principal"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
