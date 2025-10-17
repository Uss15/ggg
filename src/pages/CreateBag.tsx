import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateBagId, createEvidenceBag, addChainOfCustodyEntry } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const bagSchema = z.object({
  type: z.enum(["weapon", "clothing", "biological_sample", "documents", "electronics", "other"]),
  description: z.string().min(1, "Description is required").max(500),
  location: z.string().min(1, "Location is required"),
  notes: z.string().max(1000).optional(),
});

type BagFormData = z.infer<typeof bagSchema>;

export default function CreateBag() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [createdBag, setCreatedBag] = useState<{ bag_id: string; id: string } | null>(null);
  const [userName, setUserName] = useState<string>();

  const form = useForm<BagFormData>({
    resolver: zodResolver(bagSchema),
    defaultValues: {
      type: "other",
      description: "",
      location: "",
      notes: "",
    },
  });

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile) setUserName(profile.full_name);
          });
      }
    });
  });

  const onSubmit = async (data: BagFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Generate bag ID
      const bagId = await generateBagId();
      const qrUrl = `${window.location.origin}/bag/${bagId}`;

      // Create evidence bag
      const bag = await createEvidenceBag({
        bag_id: bagId,
        type: data.type,
        description: data.description,
        initial_collector: user.id,
        date_collected: new Date().toISOString(),
        location: data.location,
        notes: data.notes || null,
        current_status: "collected",
        qr_data: qrUrl,
      });

      // Add initial chain of custody entry
      await addChainOfCustodyEntry({
        bag_id: bag.id,
        action: "collected",
        performed_by: user.id,
        timestamp: new Date().toISOString(),
        location: data.location,
        notes: `Evidence bag created and collected at ${data.location}`,
      });

      setCreatedBag({ bag_id: bagId, id: bag.id });
      toast.success("Evidence bag created successfully");
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error creating bag:", error);
      }
      toast.error(error.message || "Failed to create evidence bag");
    } finally {
      setIsLoading(false);
    }
  };

  if (createdBag) {
    return (
      <div className="min-h-screen bg-background">
        <Header userName={userName} />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Evidence Bag Created!</h1>
              <p className="text-muted-foreground">Bag ID: {createdBag.bag_id}</p>
            </div>

            <QRCodeDisplay bagId={createdBag.bag_id} url={`${window.location.origin}/bag/${createdBag.bag_id}`} />

            <div className="flex gap-4">
              <Button onClick={() => navigate(`/bag/${createdBag.bag_id}`)} className="flex-1">
                View Bag Details
              </Button>
              <Button onClick={() => navigate("/create")} variant="outline" className="flex-1">
                Create Another Bag
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Evidence Bag</h1>
            <p className="text-muted-foreground">Fill in the details to create a new evidence bag</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select evidence type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weapon">Weapon</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="biological_sample">Biological Sample</SelectItem>
                        <SelectItem value="documents">Documents</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the evidence..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
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
                      <Input placeholder="Where was the evidence collected?" {...field} />
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

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Evidence Bag
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
