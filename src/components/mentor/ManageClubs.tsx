import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  Search,
  Building2,
  UserCheck,
  ClipboardList,
  Loader2,
  Plus,
  Power,
  PowerOff,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ManageClubs() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Add club dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubDescription, setNewClubDescription] = useState("");
  const [addingClub, setAddingClub] = useState(false);

  // Confirmation dialogs
  const [confirmAddDialog, setConfirmAddDialog] = useState(false);
  const [toggleClubDialog, setToggleClubDialog] = useState<{ club: any; action: 'enable' | 'disable' } | null>(null);
  const [togglingClub, setTogglingClub] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);

    const [clubsRes, membersRes, reportsRes, registrationsRes] = await Promise.all([
      supabase.from("clubs").select("*").order("name"),
      supabase.from("club_members").select("*").order("name"),
      supabase.from("club_reports").select("*").order("created_at", { ascending: false }),
      supabase.from("club_registrations").select("*").order("created_at", { ascending: false }),
    ]);

    if (clubsRes.data) setClubs(clubsRes.data);
    if (membersRes.data) setMembers(membersRes.data);
    if (reportsRes.data) setReports(reportsRes.data);
    if (registrationsRes.data) setRegistrations(registrationsRes.data);

    setLoading(false);
  }

  const filteredClubs = clubs.filter((club) =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getApprovedCount = (clubId: string) =>
    registrations.filter((r) => r.club_id === clubId && r.status === "approved").length;

  const totalStats = {
    clubs: clubs.length,
    activeClubs: clubs.filter((c) => c.is_active !== false).length,
    executiveMembers: members.length,
    reports: reports.length,
    approvedStudents: registrations.filter((r) => r.status === "approved").length,
    pendingRegistrations: registrations.filter((r) => r.status === "pending").length,
  };

  // Handle Add Club
  const handleAddClubSubmit = () => {
    if (!newClubName.trim()) {
      toast.error("Club name is required");
      return;
    }
    setConfirmAddDialog(true);
  };

  const confirmAddClub = async () => {
    setAddingClub(true);
    setConfirmAddDialog(false);

    try {
      const { error } = await supabase.from("clubs").insert({
        name: newClubName.trim(),
        short_description: newClubDescription.trim() || null,
        is_active: true,
        registration_open: true,
      });

      if (error) throw error;

      toast.success(`Club "${newClubName}" created successfully!`);
      setNewClubName("");
      setNewClubDescription("");
      setShowAddDialog(false);
      loadAllData();
    } catch (error: any) {
      toast.error("Failed to create club: " + error.message);
    } finally {
      setAddingClub(false);
    }
  };

  // Handle Toggle Club Status
  const handleToggleClub = async () => {
    if (!toggleClubDialog) return;

    setTogglingClub(true);
    const { club, action } = toggleClubDialog;
    const newStatus = action === 'enable';

    try {
      const { error } = await supabase
        .from("clubs")
        .update({ is_active: newStatus })
        .eq("id", club.id);

      if (error) throw error;

      toast.success(`Club "${club.name}" has been ${action}d successfully!`);
      loadAllData();
    } catch (error: any) {
      toast.error(`Failed to ${action} club: ` + error.message);
    } finally {
      setTogglingClub(false);
      setToggleClubDialog(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ANALYTICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
          <CardContent className="p-4 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-700">{totalStats.clubs}</div>
            <div className="text-sm text-muted-foreground">Total Clubs</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-700">{totalStats.executiveMembers}</div>
            <div className="text-sm text-muted-foreground">Executives</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
          <CardContent className="p-4 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-700">{totalStats.approvedStudents}</div>
            <div className="text-sm text-muted-foreground">Approved Students</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200">
          <CardContent className="p-4 text-center">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 text-amber-600" />
            <div className="text-2xl font-bold text-amber-700">
              {totalStats.pendingRegistrations}
            </div>
            <div className="text-sm text-muted-foreground">Pending Reg.</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-200">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-rose-600" />
            <div className="text-2xl font-bold text-rose-700">{totalStats.reports}</div>
            <div className="text-sm text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH + ADD CLUB */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clubs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Club
        </Button>
      </div>

      {/* GRID CLUB BOXES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredClubs.map((club) => {
          const isActive = club.is_active !== false;
          return (
            <Card
              key={club.id}
              className={`relative hover:shadow-lg transition rounded-xl ${!isActive ? 'opacity-60 bg-muted/50' : ''}`}
            >
              <CardContent className="p-4 text-center">
                {/* Status Badge */}
                {!isActive && (
                  <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                    Disabled
                  </Badge>
                )}

                {/* Logo */}
                <div 
                  className="mx-auto h-20 w-20 rounded-full overflow-hidden border mb-3 flex items-center justify-center bg-white cursor-pointer"
                  onClick={() => navigate(`/mentor/clubs/${club.id}`)}
                >
                  {club.logo_url ? (
                    <img src={club.logo_url} alt={club.name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <h3 
                  className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/mentor/clubs/${club.id}`)}
                >
                  {club.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {club.short_description || "No description"}
                </p>

                <div className="mt-3 flex justify-center gap-2">
                  <Badge variant={club.registration_open ? "default" : "secondary"}>
                    {club.registration_open ? "Open" : "Closed"}
                  </Badge>
                </div>

                {/* Enable/Disable Button */}
                <div className="mt-4">
                  {isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToggleClubDialog({ club, action: 'disable' });
                      }}
                    >
                      <PowerOff className="h-4 w-4 mr-2" />
                      Disable Club
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-green-600 border-green-600/30 hover:bg-green-600/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToggleClubDialog({ club, action: 'enable' });
                      }}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      Enable Club
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredClubs.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No clubs match "{searchTerm}"
        </div>
      )}

      {/* Add Club Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Club</DialogTitle>
            <DialogDescription>
              Create a new club. Default admin credentials will be generated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clubName">Club Name *</Label>
              <Input
                id="clubName"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                placeholder="e.g., Robotics Club"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubDesc">Short Description</Label>
              <Textarea
                id="clubDesc"
                value={newClubDescription}
                onChange={(e) => setNewClubDescription(e.target.value)}
                placeholder="Brief description of the club..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClubSubmit} disabled={addingClub}>
              {addingClub && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Club
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Add Club Dialog */}
      <AlertDialog open={confirmAddDialog} onOpenChange={setConfirmAddDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Club Creation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create the club "{newClubName}"?
              <br /><br />
              Default admin credentials will be generated:
              <br />
              <strong>Email:</strong> {newClubName.toLowerCase().replace(/\s+/g, '')}@admin.com
              <br />
              <strong>Password:</strong> Kmit123$
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddClub}>
              Create Club
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Club Status Dialog */}
      <AlertDialog open={!!toggleClubDialog} onOpenChange={() => setToggleClubDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleClubDialog?.action === 'disable' ? 'Disable Club' : 'Enable Club'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleClubDialog?.action === 'disable' ? (
                <>
                  Are you sure you want to disable "{toggleClubDialog?.club.name}"?
                  <br /><br />
                  <strong>This will:</strong>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Hide the club from the home page</li>
                    <li>Deactivate the club admin's login credentials</li>
                    <li>Prevent new registrations</li>
                  </ul>
                </>
              ) : (
                <>
                  Are you sure you want to enable "{toggleClubDialog?.club.name}"?
                  <br /><br />
                  <strong>This will:</strong>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Show the club on the home page</li>
                    <li>Reactivate the club admin's login credentials</li>
                    <li>Allow new registrations</li>
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingClub}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleClub}
              disabled={togglingClub}
              className={toggleClubDialog?.action === 'disable' ? 'bg-destructive hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700'}
            >
              {togglingClub && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {toggleClubDialog?.action === 'disable' ? 'Disable' : 'Enable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
