import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2 } from "lucide-react";
import { getAllEvidenceBags, linkEvidenceToCase } from "@/lib/supabase-enhanced";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logError, sanitizeError } from "@/lib/errors";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";

interface LinkEvidenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  onSuccess: () => void;
}

export function LinkEvidenceModal({ open, onOpenChange, caseId, onSuccess }: LinkEvidenceModalProps) {
  const [bags, setBags] = useState<any[]>([]);
  const [filteredBags, setFilteredBags] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBagId, setSelectedBagId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableBags();
    } else {
      // Reset state when modal closes
      setSearchQuery("");
      setSelectedBagId(null);
      setNotes("");
    }
  }, [open]);

  useEffect(() => {
    filterBags();
  }, [searchQuery, bags]);

  const loadAvailableBags = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all accessible evidence bags directly
      const { data: allBags, error: bagsError } = await supabase
        .from('evidence_bags')
        .select('id, bag_id, description, type, current_status');
      if (bagsError) throw bagsError;

      // Get bags already linked to this case
      const { data: linkedBags } = await supabase
        .from('case_evidence')
        .select('bag_id')
        .eq('case_id', caseId);

      const linkedBagIds = new Set((linkedBags || []).map((l: any) => l.bag_id));

      // Filter out already linked bags
      const availableBags = (allBags || []).filter((bag: any) => !linkedBagIds.has(bag.id));

      setBags(availableBags);
      setFilteredBags(availableBags);
    } catch (error) {
      logError('LoadAvailableBags', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const filterBags = () => {
    if (!searchQuery.trim()) {
      setFilteredBags(bags);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = bags.filter(
      bag =>
        bag.bag_id.toLowerCase().includes(query) ||
        bag.description.toLowerCase().includes(query) ||
        bag.type.toLowerCase().includes(query)
    );
    setFilteredBags(filtered);
  };

  const handleSubmit = async () => {
    if (!selectedBagId) {
      toast.error("Please select an evidence bag");
      return;
    }

    try {
      setIsSubmitting(true);
      await linkEvidenceToCase(caseId, selectedBagId, notes || undefined);
      toast.success("Evidence linked to case successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      logError('LinkEvidence', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Evidence to Case</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Evidence Bags</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by bag ID, description, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading available evidence...</p>
            </div>
          ) : filteredBags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {bags.length === 0
                  ? "All evidence bags are already linked to this case"
                  : "No evidence bags match your search"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
              {filteredBags.map((bag) => (
                <Card
                  key={bag.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedBagId === bag.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedBagId(bag.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-mono font-semibold">{bag.bag_id}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {bag.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm mt-1 line-clamp-2">{bag.description}</p>
                    </div>
                    <StatusBadge status={bag.current_status} />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {selectedBagId && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about linking this evidence..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

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
              disabled={!selectedBagId || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link Evidence"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}