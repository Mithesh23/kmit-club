import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAdminMembers, useCreateMember, useDeleteMember } from '@/hooks/useAdminClubData';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Trash2, Loader2 } from 'lucide-react';

interface MembersManagerProps {
  clubId: string;
}

export const MembersManager = ({ clubId }: MembersManagerProps) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  
  const { data: members, isLoading } = useAdminMembers(clubId);
  const { mutate: createMember, isPending: isCreating } = useCreateMember();
  const { mutate: deleteMember, isPending: isDeleting } = useDeleteMember();
  const { toast } = useToast();

  const handleCreate = () => {
    if (!name.trim() || !role.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both name and role.",
        variant: "destructive",
      });
      return;
    }

    createMember(
      {
        club_id: clubId,
        name: name.trim(),
        role: role.trim()
      },
      {
        onSuccess: () => {
          toast({
            title: "Member Added",
            description: "New member has been added successfully.",
          });
          setName('');
          setRole('');
        },
        onError: (error: any) => {
          toast({
            title: "Creation Failed",
            description: error.message || "Failed to add member.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMember(id, {
      onSuccess: () => {
        toast({
          title: "Member Removed",
          description: "Member has been removed successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Deletion Failed",
          description: error.message || "Failed to remove member.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Member */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-semibold">Add New Member</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Name</Label>
              <Input
                id="member-name"
                placeholder="Member name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Role</Label>
              <Input
                id="member-role"
                placeholder="e.g., President, Secretary"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={isCreating} className="w-full">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </>
            )}
          </Button>
        </div>

        {/* Existing Members */}
        <div>
          <h4 className="font-semibold mb-3">Current Members</h4>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{member.name}</span>
                    <Badge variant="secondary" className="ml-2">{member.role}</Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(member.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No members added yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
