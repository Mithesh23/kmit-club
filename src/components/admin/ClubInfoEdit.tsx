import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useUpdateClub } from '@/hooks/useAdminClubData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types/club';
import { Save, Loader2, Link2, ImageIcon, X, Share2 } from 'lucide-react';

interface ClubInfoEditProps {
  club: Club;
  onSocialMediaClick?: () => void;
}

export const ClubInfoEdit = ({ club, onSocialMediaClick }: ClubInfoEditProps) => {
  const [name, setName] = useState(club.name);
  const [shortDescription, setShortDescription] = useState(club.short_description || '');
  const [detailedDescription, setDetailedDescription] = useState(club.detailed_description || '');
  const [registrationOpen, setRegistrationOpen] = useState(club.registration_open);
  const [logoUrl, setLogoUrl] = useState(club.logo_url || '');
  const [logoUrlInput, setLogoUrlInput] = useState(club.logo_url || '');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { mutate: updateClub, isPending } = useUpdateClub();
  const { toast } = useToast();

  const handleUpdateLogoUrl = async () => {
    if (!logoUrlInput.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid logo URL.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      setLogoUrl(logoUrlInput.trim());

      updateClub(
        {
          clubId: club.id,
          updates: {
            logo_url: logoUrlInput.trim()
          }
        },
        {
          onSuccess: () => {
            toast({
              title: "Logo Updated",
              description: "Club logo URL has been successfully updated.",
            });
          },
          onError: (error: any) => {
            toast({
              title: "Update Failed",
              description: error.message || "Failed to update club logo.",
              variant: "destructive",
            });
          }
        }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveLogo = async () => {
    setIsUpdating(true);

    try {
      setLogoUrl('');
      setLogoUrlInput('');

      updateClub(
        {
          clubId: club.id,
          updates: {
            logo_url: null
          }
        },
        {
          onSuccess: () => {
            toast({
              title: "Logo Removed",
              description: "Club logo has been successfully removed.",
            });
          },
          onError: (error: any) => {
            toast({
              title: "Update Failed",
              description: error.message || "Failed to remove club logo.",
              variant: "destructive",
            });
          }
        }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSave = () => {
    updateClub(
      {
        clubId: club.id,
        updates: {
          name,
          short_description: shortDescription,
          detailed_description: detailedDescription,
          registration_open: registrationOpen,
          logo_url: logoUrl || null
        }
      },
      {
        onSuccess: () => {
          toast({
            title: "Club Updated",
            description: "Club information has been successfully updated.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Update Failed",
            description: error.message || "Failed to update club information.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Club Information</CardTitle>
        {onSocialMediaClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSocialMediaClick}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Social Media
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Club Logo Section */}
        <div className="space-y-4">
          <Label>Club Logo</Label>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              {logoUrl ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border shadow-sm">
                  <img 
                    src={logoUrl} 
                    alt={`${name} logo`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={handleRemoveLogo}
                    disabled={isUpdating}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
            </div>
            
            {/* URL Input Controls */}
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter logo URL (e.g., https://example.com/logo.png)"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  disabled={isUpdating || !logoUrlInput.trim()}
                  onClick={handleUpdateLogoUrl}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      Update
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Paste the URL of your club logo image
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Club Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="short-desc">Short Description (for hover)</Label>
          <Textarea
            id="short-desc"
            placeholder="Brief description shown on club cards"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={2}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="detailed-desc">Detailed Description</Label>
          <Textarea
            id="detailed-desc"
            placeholder="Detailed description for club page"
            value={detailedDescription}
            onChange={(e) => setDetailedDescription(e.target.value)}
            rows={4}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="registration"
            checked={registrationOpen}
            onCheckedChange={setRegistrationOpen}
          />
          <Label htmlFor="registration">
            Registration Open {registrationOpen ? '(Students can register)' : '(Registration closed)'}
          </Label>
        </div>
        
        <Button onClick={handleSave} disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};