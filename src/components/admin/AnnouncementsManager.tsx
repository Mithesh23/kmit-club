import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useAdminClub } from '@/hooks/useAdminClubData';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Plus, Trash2, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface AnnouncementsManagerProps {
  clubId: string;
}

export const AnnouncementsManager = ({ clubId }: AnnouncementsManagerProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const { data: announcements, isLoading } = useAdminAnnouncements(clubId);
  const { data: club } = useAdminClub(clubId);
  const { mutate: createAnnouncement, isPending: isCreating } = useCreateAnnouncement();
  const { mutate: deleteAnnouncement, isPending: isDeleting } = useDeleteAnnouncement();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    createAnnouncement(
      {
        club_id: clubId,
        title: title.trim(),
        content: content.trim()
      },
      {
        onSuccess: async () => {
          toast({
            title: "Announcement Created",
            description: "New announcement has been added successfully. Sending emails...",
          });
          
          // Send email notification to all approved members
          if (club) {
            setSendingEmail(true);
            try {
              const { data, error } = await supabase.functions.invoke('send-announcement-email', {
                body: {
                  clubId,
                  clubName: club.name,
                  title: title.trim(),
                  content: content.trim(),
                },
              });

              if (error) {
                console.error('Error sending announcement emails:', error);
                toast({
                  title: "Email Notification Failed",
                  description: "Announcement created but failed to send email notifications.",
                  variant: "destructive",
                });
              } else if (data?.summary) {
                const { sent, retried, failed, total } = data.summary;
                const successCount = sent + retried;
                
                if (failed > 0) {
                  toast({
                    title: "Email Notification Summary",
                    description: `${successCount} of ${total} emails sent successfully. ${failed} failed.`,
                    variant: failed === total ? "destructive" : "default",
                  });
                } else if (total === 0) {
                  toast({
                    title: "No Members",
                    description: "No approved members to send emails to.",
                  });
                } else {
                  toast({
                    title: "All Emails Sent Successfully",
                    description: `${successCount} emails sent to club members.`,
                  });
                }
              } else {
                toast({
                  title: "Emails Sent",
                  description: "Announcement emails sent to approved members.",
                });
              }
            } catch (error) {
              console.error('Error invoking email function:', error);
              toast({
                title: "Email Error",
                description: "Failed to send email notifications.",
                variant: "destructive",
              });
            } finally {
              setSendingEmail(false);
            }
          }
          
          setTitle('');
          setContent('');
        },
        onError: (error: any) => {
          toast({
            title: "Creation Failed",
            description: error.message || "Failed to create announcement.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteAnnouncement(id, {
      onSuccess: () => {
        toast({
          title: "Announcement Deleted",
          description: "Announcement has been removed successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Deletion Failed",
          description: error.message || "Failed to delete announcement.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Announcements Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Announcement */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-semibold">Add New Announcement</h4>
          <div className="space-y-2">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-content">Content</Label>
            <Textarea
              id="ann-content"
              placeholder="Announcement content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleCreate} disabled={isCreating || sendingEmail} className="w-full">
            {isCreating || sendingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {sendingEmail ? 'Sending emails...' : 'Creating...'}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                <Mail className="mr-2 h-4 w-4" />
                Add & Send to Members
              </>
            )}
          </Button>
        </div>

        {/* Existing Announcements */}
        <div>
          <h4 className="font-semibold mb-3">Existing Announcements</h4>
          <ScrollArea className="h-64 border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : announcements && announcements.length > 0 ? (
              <div className="p-4 space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="flex justify-between items-start space-x-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium">{announcement.title}</h5>
                      <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(announcement.created_at), 'PPP')}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No announcements yet.</p>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
