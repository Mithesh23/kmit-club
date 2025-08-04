import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useUpdateClub } from '@/hooks/useAdminClubData';
import { useToast } from '@/hooks/use-toast';
import { Club } from '@/types/club';
import { Save, Loader2 } from 'lucide-react';

interface ClubInfoEditProps {
  club: Club;
}

export const ClubInfoEdit = ({ club }: ClubInfoEditProps) => {
  const [name, setName] = useState(club.name);
  const [shortDescription, setShortDescription] = useState(club.short_description || '');
  const [detailedDescription, setDetailedDescription] = useState(club.detailed_description || '');
  const [registrationOpen, setRegistrationOpen] = useState(club.registration_open);
  
  const { mutate: updateClub, isPending } = useUpdateClub();
  const { toast } = useToast();

  const handleSave = () => {
    updateClub(
      {
        clubId: club.id,
        updates: {
          name,
          short_description: shortDescription,
          detailed_description: detailedDescription,
          registration_open: registrationOpen
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
      <CardContent className="space-y-4">
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