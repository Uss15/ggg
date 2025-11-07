import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CaseAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  caseNumber: string;
  existingAssignments?: string[];
  onSuccess: () => void;
}

interface User {
  id: string;
  full_name: string;
  badge_number?: string;
  roles: string[];
}

export function CaseAssignmentModal({
  open,
  onOpenChange,
  caseId,
  caseNumber,
  existingAssignments = [],
  onSuccess,
}: CaseAssignmentModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set(existingAssignments));
  const [leadOfficer, setLeadOfficer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (open) {
      loadUsers();
      setSelectedUsers(new Set(existingAssignments));
    }
  }, [open, existingAssignments]);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      
      // Get all users with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, badge_number');
      
      if (profilesError) throw profilesError;

      // Get roles for each user
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = profiles?.map(profile => {
        const roles = userRoles
          ?.filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role) || [];
        
        return {
          ...profile,
          roles
        };
      }) || [];

      // Filter to only show collectors and lab techs
      const relevantUsers = usersWithRoles.filter(user => 
        user.roles.includes('collector') || user.roles.includes('lab_tech')
      );

      setUsers(relevantUsers);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAssign = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsLoading(true);
    try {
      // Update lead officer if selected
      if (leadOfficer) {
        const { error: updateError } = await supabase
          .from('cases')
          .update({ lead_officer: leadOfficer })
          .eq('id', caseId);

        if (updateError) throw updateError;
      }

      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from('case_assignments')
        .delete()
        .eq('case_id', caseId);

      if (deleteError && deleteError.code !== 'PGRST116') throw deleteError;

      // Insert new assignments
      const assignments = Array.from(selectedUsers).map(userId => ({
        case_id: caseId,
        user_id: userId,
        assigned_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('case_assignments')
        .insert(assignments);

      if (insertError) throw insertError;

      toast.success("Case assignments updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning users:', error);
      toast.error(error.message || "Failed to assign users");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Personnel to Case</DialogTitle>
          <p className="text-sm text-muted-foreground">{caseNumber}</p>
        </DialogHeader>

        {isLoadingUsers ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading personnel...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Lead Officer</Label>
              <Select value={leadOfficer} onValueChange={setLeadOfficer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead officer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} {user.badge_number && `(${user.badge_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Assigned Personnel</Label>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No collectors or lab techs available</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-muted"
                    >
                      <Checkbox
                        id={user.id}
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                      />
                      <label
                        htmlFor={user.id}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.badge_number && `Badge: ${user.badge_number} • `}
                          {user.roles.map(r => r.replace('_', ' ')).join(', ')}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedUsers.size} personnel selected
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isLoading || isLoadingUsers || selectedUsers.size === 0}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Personnel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
