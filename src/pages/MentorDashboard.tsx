import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Edit2, Camera, Plus, Calendar, Link2, FolderOpen, ImageIcon, X, Home, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ManageClubs from "@/components/mentor/ManageClubs";
import MentorCredentialsManager from "@/components/mentor/MentorCredentialsManager";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { useMentorAuth } from "@/hooks/useMentorAuth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import kmitLogo from '@/assets/kmit-logo.png';
import { transformImageUrl } from '@/lib/utils';

/* ⭐ TABS */
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function MentorDashboard() {
  const navigate = useNavigate();
  const { session } = useMentorAuth();
  const mentorEmail = localStorage.getItem('mentor_email') || '';

  // form fields
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");

  // list & loading
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({
    name: "",
    description: "",
    category: "",
    date: "",
    drive_link: "",
    ticket_url: "",
  });

  // Image URL input state
  const [imageUrlInputs, setImageUrlInputs] = useState<Record<number, string>>({});
  const [addingImage, setAddingImage] = useState<number | null>(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (category === "KMIT Evening") setName("KMIT Evening");
    if (category === "NAVRAAS") setName("NAVRAAS");
    if (category === "PATANG UTHSAV") setName("PATANG UTHSAV");
  }, [category]);

  async function loadEvents() {
    setLoading(true);
    const { data } = await supabase
      .from("kmit_events")
      .select("*")
      .order("date", { ascending: true });

    if (data) setEvents(data);
    setLoading(false);
  }

  async function addEvent() {
    if (!category || !name || !eventDate) {
      alert("Category, Name, and Date required.");
      return;
    }

    const year = new Date(eventDate).getFullYear();
    const token = localStorage.getItem('mentor_auth_token');
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c';

    try {
      const response = await fetch(
        'https://qvsrhfzdkjygjuwmfwmh.supabase.co/rest/v1/kmit_events',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'x-mentor-token': token || '',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            name,
            description,
            category,
            date: eventDate,
            year,
            drive_link: driveLink,
            ticket_url: category === "NAVRAAS" ? ticketUrl : null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert("Error adding: " + (errorData.message || 'Failed to add event'));
        return;
      }
    } catch (err: any) {
      alert("Error adding: " + err.message);
      return;
    }

    setCategory("");
    setName("");
    setDescription("");
    setEventDate("");
    setDriveLink("");
    setTicketUrl("");

    loadEvents();
    alert("Event added!");
  }

  function beginEdit(ev: any) {
    setEditingId(ev.id);
    setEditValues({
      name: ev.name,
      description: ev.description,
      category: ev.category,
      date: ev.date,
      drive_link: ev.drive_link,
      ticket_url: ev.ticket_url || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEdit() {
    if (!editingId) return;

    const { name: en, description: ed, category: ec, date: edate, drive_link, ticket_url } = editValues;

    if (!en || !ec || !edate) {
      alert("Category, Name & Date required");
      return;
    }

    const year = new Date(edate).getFullYear();
    const token = localStorage.getItem('mentor_auth_token');
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c';

    try {
      const response = await fetch(
        `https://qvsrhfzdkjygjuwmfwmh.supabase.co/rest/v1/kmit_events?id=eq.${editingId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'x-mentor-token': token || '',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            name: en,
            description: ed,
            category: ec,
            date: edate,
            year,
            drive_link,
            ticket_url: ec === "NAVRAAS" ? ticket_url : null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert("Update failed: " + (errorData.message || 'Failed to update event'));
        return;
      }
    } catch (err: any) {
      alert("Update failed: " + err.message);
      return;
    }

    setEditingId(null);
    setEditValues({ name: "", description: "", category: "", date: "", drive_link: "", ticket_url: "" });
    loadEvents();
    alert("Event updated!");
  }

  async function cancelEdit() {
    setEditingId(null);
    setEditValues({ name: "", description: "", category: "", date: "", drive_link: "", ticket_url: "" });
  }

  async function deleteEvent(id: number) {
    const ok = confirm("Delete this event?");
    if (!ok) return;

    const token = localStorage.getItem('mentor_auth_token');
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c';

    try {
      const response = await fetch(
        `https://qvsrhfzdkjygjuwmfwmh.supabase.co/rest/v1/kmit_events?id=eq.${id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'x-mentor-token': token || '',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert("Delete failed: " + (errorData.message || 'Failed to delete event'));
        return;
      }
    } catch (err: any) {
      alert("Delete failed: " + err.message);
      return;
    }

    loadEvents();
    alert("Deleted");
  }

  async function addImageUrl(eventId: number) {
    const imageUrl = imageUrlInputs[eventId]?.trim();
    if (!imageUrl) {
      alert("Please enter an image URL");
      return;
    }

    setAddingImage(eventId);
    const token = localStorage.getItem('mentor_auth_token');

    try {
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c';
      
      // Use fetch with mentor token in custom header (x-mentor-token)
      // Authorization header uses anon key JWT to pass Supabase validation
      const response = await fetch(
        'https://qvsrhfzdkjygjuwmfwmh.supabase.co/rest/v1/kmit_event_images',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'x-mentor-token': token || '',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            event_id: eventId,
            image_url: imageUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert("Failed to add image: " + (errorData.message || 'Unknown error'));
        return;
      }

      // Clear the input and trigger image preview refresh
      setImageUrlInputs(prev => ({ ...prev, [eventId]: '' }));
      setImageRefreshKey(prev => prev + 1);
      alert("Image added!");
    } catch (err: any) {
      alert("Failed to add image: " + (err.message || 'Unknown error'));
    } finally {
      setAddingImage(null);
    }
  }

  async function deleteImage(imageId: number) {
    const ok = confirm("Delete this image?");
    if (!ok) return;

    const token = localStorage.getItem('mentor_auth_token');
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c3JoZnpka2p5Z2p1d21md21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTExNDksImV4cCI6MjA2OTg2NzE0OX0.PC03FIARScFmY1cJmlW8H7rLppcjVXKKUzErV7XA5_c';

    try {
      const response = await fetch(
        `https://qvsrhfzdkjygjuwmfwmh.supabase.co/rest/v1/kmit_event_images?id=eq.${imageId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'x-mentor-token': token || '',
          },
        }
      );

      if (!response.ok) {
        alert("Failed to delete image");
        return;
      }

      setImageRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert("Failed to delete image: " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50 to-accent-light">
      <div className="container mx-auto px-4 md:px-6 py-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <img src={kmitLogo} alt="KMIT Logo" className="h-14 w-auto" />
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient">
                Mentor Dashboard
              </h1>
              <p className="text-muted-foreground">Manage clubs, events, and credentials</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ChangePasswordDialog 
              userType="mentor" 
              identifier={mentorEmail} 
            />
            <Button variant="outline" className="gap-2" onClick={() => navigate("/")}>
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>
        </div>

        {/* ⭐ TABS SYSTEM */}
        <Tabs defaultValue="clubs" className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-8 h-12 p-1 bg-muted/50 backdrop-blur-sm rounded-xl">
            <TabsTrigger value="clubs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              Manage Clubs
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              Events
            </TabsTrigger>
            <TabsTrigger value="mentors" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              Credentials
            </TabsTrigger>
          </TabsList>

          {/* ============================================================
             EVENTS TAB
          ============================================================ */}
          <TabsContent value="events" className="animate-fade-in">

            {/* EDIT PANEL */}
            {editingId && (
              <Card className="mb-8 border-primary/20 shadow-xl bg-background/95 backdrop-blur-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Edit2 className="h-5 w-5 text-primary" />
                      Edit Event
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Category</Label>
                      <select
                        value={editValues.category}
                        onChange={(e) => setEditValues((s) => ({ ...s, category: e.target.value }))}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Select category</option>
                        <option>KMIT Evening</option>
                        <option>NAVRAAS</option>
                        <option>PATANG UTHSAV</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Event Date
                      </Label>
                      <Input
                        type="date"
                        value={editValues.date}
                        onChange={(e) => setEditValues((s) => ({ ...s, date: e.target.value }))}
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Event Name</Label>
                    <Input
                      value={editValues.name}
                      onChange={(e) => setEditValues((s) => ({ ...s, name: e.target.value }))}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      value={editValues.description}
                      onChange={(e) => setEditValues((s) => ({ ...s, description: e.target.value }))}
                      className="rounded-lg min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      Drive Link
                    </Label>
                    <Input
                      value={editValues.drive_link}
                      onChange={(e) => setEditValues((s) => ({ ...s, drive_link: e.target.value }))}
                      className="rounded-lg"
                      placeholder="Google Drive folder link"
                    />
                  </div>

                  {/* Ticket URL field - only for NAVRAAS */}
                  {editValues.category === "NAVRAAS" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        Ticket Booking URL
                      </Label>
                      <Input
                        value={editValues.ticket_url}
                        onChange={(e) => setEditValues((s) => ({ ...s, ticket_url: e.target.value }))}
                        className="rounded-lg"
                        placeholder="Ticket booking URL for NAVRAAS"
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={cancelEdit} className="rounded-lg">
                      Cancel
                    </Button>
                    <Button onClick={saveEdit} className="rounded-lg bg-primary hover:bg-primary/90">
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ADD & LIST PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* ADD EVENT FORM */}
              <Card className="border-border/50 shadow-lg bg-background/95 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    Add New Event
                  </CardTitle>
                  <CardDescription>Create a new KMIT event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category *</Label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select category</option>
                      <option>KMIT Evening</option>
                      <option>NAVRAAS</option>
                      <option>PATANG UTHSAV</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Event Name *</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Enter event name"
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Brief description of the event"
                      className="rounded-lg min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Event Date *
                    </Label>
                    <Input 
                      type="date" 
                      value={eventDate} 
                      onChange={(e) => setEventDate(e.target.value)} 
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      Drive Link
                    </Label>
                    <Input
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      placeholder="Google Drive folder link"
                      className="rounded-lg"
                    />
                  </div>

                  {/* Ticket URL field - only for NAVRAAS */}
                  {category === "NAVRAAS" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        Ticket Booking URL
                      </Label>
                      <Input
                        value={ticketUrl}
                        onChange={(e) => setTicketUrl(e.target.value)}
                        placeholder="Ticket booking URL for NAVRAAS"
                        className="rounded-lg"
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-3">
                    <Button onClick={addEvent} className="flex-1 rounded-lg bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => {
                        setCategory("");
                        setName("");
                        setDescription("");
                        setEventDate("");
                        setDriveLink("");
                        setTicketUrl("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* EVENT LIST */}
              <Card className="border-border/50 shadow-lg bg-background/95 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Calendar className="h-5 w-5 text-accent" />
                        </div>
                        Existing Events
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {events.length} event{events.length !== 1 ? 's' : ''} created
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="animate-spin h-8 w-8 text-primary" />
                      <p className="text-sm text-muted-foreground">Loading events...</p>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <div className="p-4 rounded-full bg-muted">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No events created yet</p>
                      <p className="text-sm text-muted-foreground">Add your first event using the form</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {events.map((ev) => (
                        <div 
                          key={ev.id} 
                          className="p-4 border border-border/50 rounded-xl bg-background hover:bg-muted/30 hover:border-primary/30 transition-all duration-200 group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-foreground truncate">{ev.name}</h4>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {ev.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(ev.date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              {ev.description && (
                                <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{ev.description}</p>
                              )}
                              {ev.drive_link && (
                                <a
                                  className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm mt-2 underline-offset-4 hover:underline"
                                  target="_blank"
                                  href={ev.drive_link}
                                  rel="noopener noreferrer"
                                >
                                  <FolderOpen className="h-3 w-3" />
                                  View Drive Folder
                                </a>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                            {/* Image URL Input */}
                            <div className="flex gap-2 flex-1">
                              <Input
                                placeholder="Enter image URL (supports Google Drive)"
                                value={imageUrlInputs[ev.id] || ''}
                                onChange={(e) => setImageUrlInputs(prev => ({ ...prev, [ev.id]: e.target.value }))}
                                className="flex-1 h-8 text-sm"
                              />
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-lg gap-1.5"
                                onClick={() => addImageUrl(ev.id)}
                                disabled={addingImage === ev.id || !imageUrlInputs[ev.id]?.trim()}
                              >
                                {addingImage === ev.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Link2 className="h-3.5 w-3.5" />
                                    Add
                                  </>
                                )}
                              </Button>
                            </div>

                              <div className="flex gap-1.5">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                  onClick={() => beginEdit(ev)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => deleteEvent(ev.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <EventImagesPreview eventId={ev.id} refreshKey={imageRefreshKey} onDeleteImage={deleteImage} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============================================================
             MANAGE CLUBS TAB
          ============================================================ */}
          <TabsContent value="clubs">
            <ManageClubs />
          </TabsContent>

          {/* ============================================================
             MENTOR CREDENTIALS TAB
          ============================================================ */}
          <TabsContent value="mentors">
            <MentorCredentialsManager />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

/* ============================================================
   IMAGE PREVIEW COMPONENT
============================================================ */
function EventImagesPreview({ eventId, refreshKey, onDeleteImage }: { eventId: number; refreshKey: number; onDeleteImage?: (imageId: number) => void }) {
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase
        .from("kmit_event_images")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (active && data) setImages(data);
    })();

    return () => { active = false; };
  }, [eventId, refreshKey]);

  if (!images.length) return null;

  return (
    <div className="mt-3 flex gap-3 overflow-x-auto">
      {images.map((im) => (
        <div key={im.id} className="relative group shrink-0">
          <img
            src={transformImageUrl(im.image_url)}
            className="h-20 w-28 object-cover rounded-md shadow-sm"
            alt=""
          />
          {onDeleteImage && (
            <button
              onClick={() => onDeleteImage(im.id)}
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

