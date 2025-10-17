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

  const form = useForm<CustodyFormData>({
    resolver: zodResolver(custodySchema),
    defaultValues: {
      action: "transferred",
      location: "",
      notes: "",
    },
  });

  const onSubmit = async (data: CustodyFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Add custody entry
      await addChainOfCustodyEntry({
        bag_id: bagId,
        action: data.action,
        performed_by: user.id,
        timestamp: new Date().toISOString(),
        location: data.location,
        notes: data.notes || null,
      });

      // Update bag status
      const newStatus = actionToStatus[data.action];
      await updateEvidenceBagStatus(bagId, newStatus);

      toast.success("Chain of custody entry added");
      form.reset();
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
