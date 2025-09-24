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
import { Save, Loader2, Upload, ImageIcon, X } from 'lucide-react';

interface ClubInfoEditProps {
  club: Club;
}

export const ClubInfoEdit = ({ club }: ClubInfoEditProps) => {
  const [name, setName] = useState(club.name);
  const [shortDescription, setShortDescription] = useState(club.short_description || '');
  const [detailedDescription, setDetailedDescription] = useState(club.detailed_description || '');
  const [registrationOpen, setRegistrationOpen] = useState(club.registration_open);
  const [logoUrl, setLogoUrl] = useState(club.logo_url || '');
  const [isUploading, setIsUploading] = useState(false);
  
  const { mutate: updateClub, isPending } = useUpdateClub();
  const { toast } = useToast();

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${club.id}/logo.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('club-logos')
        .upload(fileName, file, {
          upsert: true, // Replace existing file
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('club-logos')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);

      // Update club with new logo URL
      updateClub(
        {
          clubId: club.id,
          updates: {
            logo_url: publicUrl
          }
        },
        {
          onSuccess: () => {
            toast({
              title: "Logo Uploaded",
              description: "Club logo has been successfully updated.",
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

    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setIsUploading(true);

    try {
      // Remove from storage if exists
      if (logoUrl) {
        const fileName = `${club.id}/logo.jpg`; // Try common extensions
        await supabase.storage.from('club-logos').remove([fileName]);
      }

      setLogoUrl('');

      // Update club to remove logo URL
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

    } catch (error: any) {
      toast({
        title: "Remove Failed",
        description: error.message || "Failed to remove logo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
      <CardHeader>
        <CardTitle>Club Information</CardTitle>
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
                    disabled={isUploading}
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
            
            {/* Upload Controls */}
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={isUploading}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a square image (recommended: 200x200px or larger). Max size: 5MB
              </p>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
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