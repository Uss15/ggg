import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { createDisposalRequest } from "@/lib/supabase-enhanced";
import { toast } from "sonner";
import { logError, sanitizeError } from "@/lib/errors";

interface DisposalRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bagId: string;
  bagName: string;
  onSuccess: () => void;
}

export function DisposalRequestModal({ 
  open, 
  onOpenChange, 
  bagId, 
  bagName,
  onSuccess 
}: DisposalRequestModalProps) {
  const [disposalMethod, setDisposalMethod] = useState<'released' | 'destroyed' | 'returned'>('released');
  const [reason, setReason] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [documentationUrl, setDocumentationUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for disposal");
      return;
    }

    try {
      setIsSubmitting(true);
      await createDisposalRequest(
        bagId,
        disposalMethod,
        reason,
        witnessName || undefined,
        documentationUrl || undefined
      );
      toast.success("Disposal request submitted for admin review");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setReason("");
      setWitnessName("");
      setDocumentationUrl("");
      setDisposalMethod('released');
    } catch (error) {
      logError('CreateDisposalRequest', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Evidence Disposal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Evidence Bag</p>
            <p className="font-medium">{bagName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disposal_method">
              Disposal Method <span className="text-destructive">*</span>
            </Label>
            <Select value={disposalMethod} onValueChange={(value: any) => setDisposalMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="released">Released to Owner</SelectItem>
                <SelectItem value="destroyed">Destroyed</SelectItem>
                <SelectItem value="returned">Returned to Court</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Disposal <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why this evidence should be disposed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="witness">Witness Name (Optional)</Label>
            <Input
              id="witness"
              placeholder="Name of witness present"
              value={witnessName}
              onChange={(e) => setWitnessName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentation">Documentation URL (Optional)</Label>
            <Input
              id="documentation"
              type="url"
              placeholder="https://..."
              value={documentationUrl}
              onChange={(e) => setDocumentationUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Link to supporting documentation (court order, authorization form, etc.)
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
              disabled={isSubmitting || !reason.trim()}
              className="flex-1"
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}