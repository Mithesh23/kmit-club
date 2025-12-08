import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateClub } from '@/hooks/useAdminClubData';
import { useToast } from '@/hooks/use-toast';
import { Club } from '@/types/club';
import { Save, Loader2, Instagram, Youtube, Facebook, Linkedin, Twitter, X, ExternalLink, ArrowLeft, MessageCircle, Globe } from 'lucide-react';

interface SocialMediaManagerProps {
  club: Club;
  onBack?: () => void;
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram_url', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourclub', pattern: /^https?:\/\/(www\.)?instagram\.com\/.+/i },
  { key: 'youtube_url', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourclub', pattern: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i },
  { key: 'facebook_url', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourclub', pattern: /^https?:\/\/(www\.)?facebook\.com\/.+/i },
  { key: 'linkedin_url', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/yourclub', pattern: /^https?:\/\/(www\.)?linkedin\.com\/.+/i },
  { key: 'twitter_url', label: 'X (Twitter)', icon: Twitter, placeholder: 'https://x.com/yourclub', pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i },
  { key: 'whatsapp_url', label: 'WhatsApp Channel', icon: MessageCircle, placeholder: 'https://whatsapp.com/channel/yourclub', pattern: /^https?:\/\/(www\.)?(whatsapp\.com|wa\.me)\/.+/i },
  { key: 'website_url', label: 'Website', icon: Globe, placeholder: 'https://yourclub.com', pattern: /^https?:\/\/.+/i },
] as const;

type SocialKey = typeof SOCIAL_PLATFORMS[number]['key'];

export const SocialMediaManager = ({ club, onBack }: SocialMediaManagerProps) => {
  const [socialLinks, setSocialLinks] = useState<Record<SocialKey, string>>({
    instagram_url: club.instagram_url || '',
    youtube_url: club.youtube_url || '',
    facebook_url: club.facebook_url || '',
    linkedin_url: club.linkedin_url || '',
    twitter_url: club.twitter_url || '',
    whatsapp_url: (club as any).whatsapp_url || '',
    website_url: (club as any).website_url || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { mutate: updateClub, isPending } = useUpdateClub();
  const { toast } = useToast();

  const validateUrl = (key: SocialKey, value: string): boolean => {
    if (!value.trim()) return true; // Empty is valid (optional)
    
    const platform = SOCIAL_PLATFORMS.find(p => p.key === key);
    if (!platform) return true;
    
    // Basic URL validation
    try {
      new URL(value);
    } catch {
      return false;
    }
    
    return platform.pattern.test(value);
  };

  const handleChange = (key: SocialKey, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleClear = (key: SocialKey) => {
    setSocialLinks(prev => ({ ...prev, [key]: '' }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  const handleSave = () => {
    // Validate all URLs
    const newErrors: Record<string, string> = {};
    
    SOCIAL_PLATFORMS.forEach(({ key, label }) => {
      const value = socialLinks[key].trim();
      if (value && !validateUrl(key, value)) {
        newErrors[key] = `Please enter a valid ${label} URL`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the invalid URLs before saving.",
        variant: "destructive",
      });
      return;
    }

    const updates: Record<string, string | null> = {};
    SOCIAL_PLATFORMS.forEach(({ key }) => {
      updates[key] = socialLinks[key].trim() || null;
    });

    updateClub(
      { clubId: club.id, updates },
      {
        onSuccess: () => {
          toast({
            title: "Social Media Updated",
            description: "Social media links have been successfully saved.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Update Failed",
            description: error.message || "Failed to update social media links.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Social Media Handles
        </CardTitle>
        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Club Info
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Add your club's social media links. Only platforms with valid URLs will be displayed on your club page.
        </p>

        <div className="space-y-4">
          {SOCIAL_PLATFORMS.map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    id={key}
                    type="url"
                    placeholder={placeholder}
                    value={socialLinks[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={errors[key] ? 'border-destructive' : ''}
                  />
                </div>
                {socialLinks[key] && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClear(key)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors[key] && (
                <p className="text-sm text-destructive">{errors[key]}</p>
              )}
            </div>
          ))}
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
              Save Social Media Links
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
