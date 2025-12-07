import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Edit2, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ManageClubs from "@/components/mentor/ManageClubs";
import MentorCredentialsManager from "@/components/mentor/MentorCredentialsManager";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { useMentorAuth } from "@/hooks/useMentorAuth";

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
  });

  // upload
  const [uploading, setUploading] = useState(false);

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

    const { error } = await supabase.from("kmit_events").insert({
      name,
      description,
      category,
      date: eventDate,
      year,
      drive_link: driveLink,
    });

    if (error) {
      alert("Error adding: " + error.message);
      return;
    }

    setCategory("");
    setName("");
    setDescription("");
    setEventDate("");
    setDriveLink("");

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
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEdit() {
    if (!editingId) return;

    const { name: en, description: ed, category: ec, date: edate, drive_link } = editValues;

    if (!en || !ec || !edate) {
      alert("Category, Name & Date required");
      return;
    }

    const year = new Date(edate).getFullYear();

    const { error } = await supabase
      .from("kmit_events")
      .update({ name: en, description: ed, category: ec, date: edate, year, drive_link })
      .eq("id", editingId);

    if (error) {
      alert("Update failed: " + error.message);
      return;
    }

    setEditingId(null);
    setEditValues({ name: "", description: "", category: "", date: "", drive_link: "" });
    loadEvents();
    alert("Event updated!");
  }

  async function cancelEdit() {
    setEditingId(null);
    setEditValues({ name: "", description: "", category: "", date: "", drive_link: "" });
  }

  async function deleteEvent(id: number) {
    const ok = confirm("Delete this event?");
    if (!ok) return;

    const { error } = await supabase.from("kmit_events").delete().eq("id", id);
    if (error) return alert(error.message);

    loadEvents();
    alert("Deleted");
  }

  async function uploadImages(eventId: number, files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);

    try {
      for (let file of Array.from(files)) {
        const path = `kmit-events/${eventId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

        const { error } = await supabase.storage.from("kmit-events-gallery").upload(path, file);
        if (error) continue;

        const { data: urlData } = supabase.storage
          .from("kmit-events-gallery")
          .getPublicUrl(path);

        await supabase.from("kmit_event_images").insert({
          event_id: eventId,
          image_url: urlData.publicUrl,
        });
      }

      alert("Images uploaded!");
      loadEvents();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-orange-50/20 py-12">
      <div className="container mx-auto px-6">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-display font-bold text-gradient">
            KMIT Mentor Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <ChangePasswordDialog 
              userType="mentor" 
              identifier={mentorEmail} 
            />
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </div>

        {/* ⭐ TABS SYSTEM */}
        <Tabs defaultValue="clubs" className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-8">
            <TabsTrigger value="clubs">Manage Clubs</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="mentors">Mentor Credentials</TabsTrigger>
          </TabsList>

          {/* ============================================================
             EVENTS TAB
          ============================================================ */}
          <TabsContent value="events">

            {/* EDIT PANEL */}
            {editingId && (
              <Card className="mb-8 card-neon rounded-2xl shadow-xl bg-white/80">
                <CardContent className="p-6">

                  <h3 className="text-xl font-semibold mb-4">Edit Event</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <select
                        value={editValues.category}
                        onChange={(e) =>
                          setEditValues((s) => ({ ...s, category: e.target.value }))
                        }
                        className="border rounded-md p-2 w-full"
                      >
                        <option value="">Select</option>
                        <option>KMIT Evening</option>
                        <option>NAVRAAS</option>
                        <option>PATANG UTHSAV</option>
                      </select>
                    </div>

                    <div>
                      <Label>Event Date</Label>
                      <Input
                        type="date"
                        value={editValues.date}
                        onChange={(e) =>
                          setEditValues((s) => ({ ...s, date: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label>Event Name</Label>
                    <Input
                      value={editValues.name}
                      onChange={(e) =>
                        setEditValues((s) => ({ ...s, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <Label>Description</Label>
                    <Textarea
                      value={editValues.description}
                      onChange={(e) =>
                        setEditValues((s) => ({ ...s, description: e.target.value }))
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <Label>Drive Link</Label>
                    <Input
                      value={editValues.drive_link}
                      onChange={(e) =>
                        setEditValues((s) => ({ ...s, drive_link: e.target.value }))
                      }
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button onClick={saveEdit}>Save</Button>
                    <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* ADD & LIST PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* ADD EVENT FORM */}
              <Card className="card-neon rounded-2xl shadow-xl bg-white/80">
                <CardContent className="p-6">

                  <h3 className="text-2xl font-semibold mb-4">Add Event</h3>

                  <Label>Category</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="border rounded-md p-2 w-full"
                  >
                    <option value="">Select category</option>
                    <option>KMIT Evening</option>
                    <option>NAVRAAS</option>
                    <option>PATANG UTHSAV</option>
                  </select>

                  <div className="mt-3">
                    <Label>Event Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  <div className="mt-3">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>

                  <div className="mt-3">
                    <Label>Event Date</Label>
                    <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  </div>

                  <div className="mt-3">
                    <Label>Drive Link</Label>
                    <Input
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      placeholder="Google Drive folder link"
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button onClick={addEvent}>Add Event</Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCategory("");
                        setName("");
                        setDescription("");
                        setEventDate("");
                        setDriveLink("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>

                </CardContent>
              </Card>

              {/* EVENT LIST */}
              <Card className="rounded-2xl shadow-xl bg-white/80">
                <CardContent className="p-6">

                  <h3 className="text-2xl font-semibold mb-4">Existing Events</h3>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin h-6 w-6 text-primary" />
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-muted-foreground">No events yet</p>
                  ) : (
                    <div className="space-y-4 max-h-[520px] overflow-y-auto">

                      {events.map((ev) => (
                        <div key={ev.id} className="p-4 border rounded-lg bg-white">

                          <div className="flex items-start justify-between">
                            {/* LEFT — DETAILS */}
                            <div>
                              <div className="font-semibold text-lg">{ev.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {ev.category} • {ev.date}
                              </div>
                              <div className="text-sm mt-2">{ev.description}</div>

                              {ev.drive_link && (
                                <a
                                  className="text-primary underline text-sm block mt-1"
                                  target="_blank"
                                  href={ev.drive_link}
                                >
                                  Drive Folder
                                </a>
                              )}
                            </div>

                            {/* RIGHT — ACTION BUTTONS */}
                            <div className="flex flex-col items-end gap-2">

                              {/* IMAGE UPLOAD */}
                              <input
                                id={`file-${ev.id}`}
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={(e) => uploadImages(ev.id, e.target.files)}
                              />

                              <label htmlFor={`file-${ev.id}`}>
                                <Button size="sm" variant="outline">
                                  <Camera className="mr-2" /> Upload Images
                                </Button>
                              </label>

                              {/* EDIT + DELETE */}
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => beginEdit(ev)}>
                                  <Edit2 />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteEvent(ev.id)}
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <EventImagesPreview eventId={ev.id} />

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
function EventImagesPreview({ eventId }: { eventId: number }) {
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
  }, [eventId]);

  if (!images.length) return null;

  return (
    <div className="mt-3 flex gap-3 overflow-x-auto">
      {images.map((im) => (
        <img
          key={im.id}
          src={im.image_url}
          className="h-20 w-28 object-cover rounded-md shadow-sm"
          alt=""
        />
      ))}
    </div>
  );
}

