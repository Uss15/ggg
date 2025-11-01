import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";

interface RandomAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const RandomAuditModal = ({ open, onOpenChange, onSuccess }: RandomAuditModalProps) => {
  const [auditName, setAuditName] = useState("");
  const [sampleSize, setSampleSize] = useState("10");
  const [loading, setLoading] = useState(false);

  const handleCreateAudit = async () => {
    if (!auditName.trim()) {
      toast.error("Please enter an audit name");
      return;
    }

    const size = parseInt(sampleSize);
    if (isNaN(size) || size < 1 || size > 100) {
      toast.error("Sample size must be between 1 and 100");
      return;
    }

    setLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Get random evidence bags
      const { data: bags, error: bagsError } = await supabase
        .from("evidence_bags")
        .select("id, bag_id, current_status, location, description")
        .limit(size);

      if (bagsError) throw bagsError;
      if (!bags || bags.length === 0) {
        toast.error("No evidence bags found");
        setLoading(false);
        return;
      }

      // Shuffle and take sample
      const shuffled = bags.sort(() => 0.5 - Math.random());
      const sample = shuffled.slice(0, Math.min(size, bags.length));

      // Create audit check
      const { data: audit, error: auditError } = await supabase
        .from("audit_checks")
        .insert({
          audit_name: auditName,
          created_by: user.user.id,
          total_items: sample.length,
          status: 'in_progress'
        })
        .select()
        .single();

      if (auditError) throw auditError;

      // Create audit check items
      const items = sample.map(bag => ({
        audit_id: audit.id,
        bag_id: bag.id,
        expected_status: bag.current_status,
        expected_location: bag.location
      }));

      const { error: itemsError } = await supabase
        .from("audit_check_items")
        .insert(items);

      if (itemsError) throw itemsError;

      toast.success(`Random audit created with ${sample.length} items`);
      setAuditName("");
      setSampleSize("10");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating audit:", error);
      toast.error(error.message || "Failed to create audit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Create Random Audit
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="auditName">Audit Name</Label>
            <Input
              id="auditName"
              value={auditName}
              onChange={(e) => setAuditName(e.target.value)}
              placeholder="Monthly Random Audit - January 2025"
            />
          </div>
          <div>
            <Label htmlFor="sampleSize">Sample Size (1-100)</Label>
            <Input
              id="sampleSize"
              type="number"
              min="1"
              max="100"
              value={sampleSize}
              onChange={(e) => setSampleSize(e.target.value)}
              placeholder="10"
            />
          </div>
          <Button
            onClick={handleCreateAudit}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Audit...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Create Random Audit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
