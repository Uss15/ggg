import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type UserRole = 'admin' | 'collector' | 'lab_tech';

interface User {
  id: string;
  full_name: string;
  badge_number?: string;
  email?: string;
  roles: UserRole[];
}

export const UserRoleManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, badge_number');

      if (!profiles) return;

      // Get all user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get emails from auth.users (if accessible)
      const usersWithRoles: User[] = profiles.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        badge_number: profile.badge_number || undefined,
        roles: userRoles
          ?.filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role as UserRole) || []
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, role: UserRole, currentlyHas: boolean) => {
    setSavingUserId(userId);
    try {
      if (currentlyHas) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;
        toast.success(`Removed ${role} role`);
      } else {
        // Add role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
        toast.success(`Added ${role} role`);
      }

      await loadUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Failed to update role");
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead className="text-center">Admin</TableHead>
              <TableHead className="text-center">Collector</TableHead>
              <TableHead className="text-center">Lab Tech</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.badge_number || '-'}</TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={user.roles.includes('admin')}
                    onCheckedChange={() => toggleRole(user.id, 'admin', user.roles.includes('admin'))}
                    disabled={savingUserId === user.id}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={user.roles.includes('collector')}
                    onCheckedChange={() => toggleRole(user.id, 'collector', user.roles.includes('collector'))}
                    disabled={savingUserId === user.id}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={user.roles.includes('lab_tech')}
                    onCheckedChange={() => toggleRole(user.id, 'lab_tech', user.roles.includes('lab_tech'))}
                    disabled={savingUserId === user.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
