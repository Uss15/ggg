import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocationCapture } from "@/components/LocationCapture";
import { DigitalSignature } from "@/components/evidence/DigitalSignature";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { addChainOfCustodyEntry, updateEvidenceBagStatus } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import type { ActionType, EvidenceStatus } from "@/lib/supabase";

const custodySchema = z.object({
  action: z.enum(["collected", "packed", "transferred", "received", "analyzed", "archived"]),
  location: z.string().min(1, "Location is required"),
  notes: z.string().max(500).optional(),
});

type CustodyFormData = z.infer<typeof custodySchema>;

interface AddCustodyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bagId: string;
  onSuccess: () => void;
}

const actionToStatus: Record<ActionType, EvidenceStatus> = {
  collected: "collected",
  packed: "collected",
  transferred: "in_transport",
  received: "in_lab",
  analyzed: "analyzed",
  archived: "archived",
};

export const AddCustodyModal = ({ open, onOpenChange, bagId, onSuccess }: AddCustodyModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [requireSignature, setRequireSignature] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState<string | null>(null);

  const form = useForm<CustodyFormData>({
    resolver: zodResolver(custodySchema),
    defaultValues: {
      action: "transferred",
      location: "",
      notes: "",
    },
  });

  const onSubmit = async (data: CustodyFormData) => {
    if (requireSignature && !digitalSignature) {
      toast.error("Digital signature is required");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Add custody entry with digital signature
      await addChainOfCustodyEntry({
        bag_id: bagId,
        action: data.action,
        performed_by: user.id,
        timestamp: new Date().toISOString(),
        location: data.location,
        notes: data.notes || null,
        latitude: gpsCoordinates?.latitude || null,
        longitude: gpsCoordinates?.longitude || null,
        digital_signature: digitalSignature,
        signature_timestamp: digitalSignature ? new Date().toISOString() : null,
      });

      // Update bag status
      const newStatus = actionToStatus[data.action];
      await updateEvidenceBagStatus(bagId, newStatus);

      // Send email notification if configured
      try {
        const { data: bagData } = await supabase
          .from('evidence_bags')
          .select('bag_id, initial_collector, profiles:initial_collector(full_name)')
          .eq('id', bagId)
          .single();

        if (bagData) {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              to: 'evidence-team@sfep.gov', // In production, get from user profile
              subject: `Evidence Custody Update - ${bagData.bag_id}`,
              title: 'Chain of Custody Update',
              message: `Evidence bag ${bagData.bag_id} custody action: ${data.action} at ${data.location}. ${digitalSignature ? 'Digitally signed.' : ''}`,
              actionUrl: `${window.location.origin}/bag/${bagId}`,
              actionText: 'View Evidence Details'
            }
          });
        }
      } catch (emailError) {
        // Don't fail the custody entry if email fails
        console.error('Email notification failed:', emailError);
      }

      toast.success("Chain of custody entry added with digital signature");
      form.reset();
      setDigitalSignature(null);
      setRequireSignature(false);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error adding custody entry:", error);
      }
      toast.error(error.message || "Failed to add custody entry");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Chain of Custody Entry</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="collected">Collected</SelectItem>
                      <SelectItem value="packed">Packed</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="analyzed">Analyzed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Where is this action taking place?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this action..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LocationCapture
              onLocationCapture={(lat, lng) => setGpsCoordinates({ latitude: lat, longitude: lng })}
            />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireSignature"
                checked={requireSignature}
                onCheckedChange={(checked) => setRequireSignature(checked as boolean)}
              />
              <label
                htmlFor="requireSignature"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Require digital signature
              </label>
            </div>

            {requireSignature && (
              <DigitalSignature
                title="Officer Signature"
                onSign={(sig) => {
                  setDigitalSignature(sig);
                  toast.success("Signature captured");
                }}
                onClear={() => setDigitalSignature(null)}
              />
            )}

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Entry
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
