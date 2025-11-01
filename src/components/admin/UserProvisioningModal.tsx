import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logError, sanitizeError } from "@/lib/errors";

interface UserProvisioningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offices: any[];
  onSuccess: () => void;
}

export function UserProvisioningModal({ 
  open, 
  onOpenChange, 
  offices,
  onSuccess 
}: UserProvisioningModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    badgeNumber: "",
    phone: "",
    role: "collector" as 'admin' | 'officer' | 'investigator' | 'collector' | 'lab_tech',
    officeId: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.email || !formData.fullName) {
      toast.error("Email and full name are required");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create user via admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        email_confirm: true,
        user_metadata: {
          full_name: formData.fullName,
          badge_number: formData.badgeNumber,
          phone: formData.phone
        }
      });

      if (authError) throw authError;

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles' as any)
        .insert({
          user_id: authData.user.id,
          role: formData.role
        });

      if (roleError) throw roleError;

      toast.success(`User ${formData.email} created successfully. Password reset link sent to their email.`);
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        email: "",
        fullName: "",
        badgeNumber: "",
        phone: "",
        role: "collector",
        officeId: ""
      });
    } catch (error) {
      logError('CreateUser', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Provision New User</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="officer@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="badgeNumber">Badge Number</Label>
            <Input
              id="badgeNumber"
              placeholder="BD-12345"
              value={formData.badgeNumber}
              onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+964 XXX XXX XXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collector">Collector</SelectItem>
                <SelectItem value="officer">Officer</SelectItem>
                <SelectItem value="investigator">Investigator</SelectItem>
                <SelectItem value="lab_tech">Lab Technician</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="office">Office (Optional)</Label>
            <Select value={formData.officeId} onValueChange={(value) => setFormData({ ...formData, officeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select office" />
              </SelectTrigger>
              <SelectContent>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name} - {office.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="text-muted-foreground">
              A password reset link will be sent to the user's email address. They will set their own password on first login.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.email || !formData.fullName}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}