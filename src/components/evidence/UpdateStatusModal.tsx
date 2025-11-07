import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateEvidenceBagStatus, addChainOfCustodyEntry } from "@/lib/supabase";
import type { EvidenceStatus, ActionType } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const statusSchema = z.object({
  status: z.enum(["collected", "in_transport", "in_lab", "analyzed", "archived"]),
  action: z.enum(["collected", "transferred", "received", "analyzed", "archived"]),
  location: z.string().min(1, "Location is required"),
  notes: z.string().max(500).optional(),
});

type StatusFormData = z.infer<typeof statusSchema>;

interface UpdateStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bagId: string;
  currentStatus: EvidenceStatus;
  onSuccess: () => void;
}

export function UpdateStatusModal({
  open,
  onOpenChange,
  bagId,
  currentStatus,
  onSuccess,
}: UpdateStatusModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: currentStatus,
      action: "transferred",
      location: "",
      notes: "",
    },
  });

  const onSubmit = async (data: StatusFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Get the bag to find its database ID
      const { data: bagData, error: bagError } = await supabase
        .from('evidence_bags')
        .select('id')
        .eq('id', bagId)
        .maybeSingle();

      if (bagError || !bagData) {
        toast.error("Evidence bag not found");
        return;
      }

      // Update bag status
      await updateEvidenceBagStatus(bagData.id, data.status);

      // Add custody entry
      await addChainOfCustodyEntry({
        bag_id: bagId,
        action: data.action,
        performed_by: user.id,
        timestamp: new Date().toISOString(),
        location: data.location,
        notes: data.notes || null,
      });

      toast.success("Status updated successfully");
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error updating status:", error);
      }
      toast.error(error.message || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Evidence Status</DialogTitle>
          <DialogDescription>
            Change the status and log the chain of custody
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="collected">Collected</SelectItem>
                      <SelectItem value="in_transport">In Transport</SelectItem>
                      <SelectItem value="in_lab">In Lab</SelectItem>
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
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="collected">Collected</SelectItem>
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
                    <Input placeholder="Current location" {...field} />
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
                      placeholder="Additional notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Status
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
