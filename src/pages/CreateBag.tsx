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
import { PhotoUpload } from "@/components/evidence/PhotoUpload";
import { LocationCapture } from "@/components/LocationCapture";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateBagId, createEvidenceBag, addChainOfCustodyEntry } from "@/lib/supabase";
import { Loader2, CheckCircle2, Upload, X, Image, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

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
        latitude: gpsCoordinates?.latitude || null,
        longitude: gpsCoordinates?.longitude || null,
      });

      // Add initial chain of custody entry
      await addChainOfCustodyEntry({
        bag_id: bag.id,
        action: "collected",
        performed_by: user.id,
        timestamp: new Date().toISOString(),
        location: data.location,
        notes: `Evidence bag created and collected at ${data.location}`,
        latitude: gpsCoordinates?.latitude || null,
        longitude: gpsCoordinates?.longitude || null,
      });

      setCreatedBag({ bag_id: bagId, id: bag.id });
      
      // Upload photos and videos if any were selected
      if (selectedPhotos.length > 0 || selectedVideos.length > 0) {
        setUploadingMedia(true);
        try {
          const allFiles = [...selectedPhotos, ...selectedVideos];
          for (const file of allFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${bag.id}/${fileName}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
              .from('evidence-photos')
              .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Save metadata to database
            await supabase
              .from('evidence_photos')
              .insert({
                bag_id: bag.id,
                photo_url: filePath,
                uploaded_by: user.id,
                notes: `${file.type.startsWith('video') ? 'Video' : 'Photo'} uploaded during evidence creation`,
              });
          }
          toast.success(`Uploaded ${allFiles.length} file(s) successfully`);
        } catch (error: any) {
          console.error("Error uploading media:", error);
          toast.error("Evidence bag created but some files failed to upload");
        } finally {
          setUploadingMedia(false);
        }
      }
      
      setShowPhotoUpload(true);
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
            <Card className="border-primary bg-primary/5">
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-3">
                  <CheckCircle2 className="h-16 w-16 text-primary" />
                </div>
                <CardTitle className="text-2xl">Evidence Bag Created Successfully!</CardTitle>
                <CardDescription className="text-base">
                  Bag ID: <span className="font-mono font-semibold text-foreground">{createdBag.bag_id}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  The evidence bag has been registered in the system and is ready for tracking.
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => navigate(`/bag/${createdBag.bag_id}`)} className="flex-1">
                    View Evidence Bag
                  </Button>
                  <Button onClick={() => setCreatedBag(null)} variant="outline" className="flex-1">
                    Create Another
                  </Button>
                </div>
              </CardContent>
            </Card>

            <QRCodeDisplay bagId={createdBag.bag_id} url={`${window.location.origin}/bag/${createdBag.bag_id}`} />
            
            {showPhotoUpload && (
              <PhotoUpload
                bagId={createdBag.id}
                onUploadComplete={() => {
                  toast.success("Files uploaded successfully");
                }}
              />
            )}
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

              <LocationCapture
                onLocationCapture={(lat, lng) => setGpsCoordinates({ latitude: lat, longitude: lng })}
                autoCapture={true}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Photos & Videos</CardTitle>
                  <CardDescription>Upload photos and videos of the evidence (optional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <FormLabel>Photos (JPG, PNG, WEBP)</FormLabel>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setSelectedPhotos(prev => [...prev, ...files]);
                        }}
                        className="cursor-pointer"
                      />
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {selectedPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedPhotos.map((file, idx) => (
                          <div key={idx} className="relative group">
                            <div className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm">
                              <Image className="h-3 w-3" />
                              <span className="max-w-[100px] truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedPhotos(prev => prev.filter((_, i) => i !== idx))}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Video Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <FormLabel>Videos (MP4, MOV, AVI)</FormLabel>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setSelectedVideos(prev => [...prev, ...files]);
                        }}
                        className="cursor-pointer"
                      />
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {selectedVideos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedVideos.map((file, idx) => (
                          <div key={idx} className="relative group">
                            <div className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm">
                              <Video className="h-3 w-3" />
                              <span className="max-w-[100px] truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedVideos(prev => prev.filter((_, i) => i !== idx))}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {(selectedPhotos.length > 0 || selectedVideos.length > 0) && (
                    <p className="text-sm text-muted-foreground">
                      {selectedPhotos.length + selectedVideos.length} file(s) selected
                    </p>
                  )}
                </CardContent>
              </Card>

              <Button type="submit" disabled={isLoading || uploadingMedia} className="w-full">
                {(isLoading || uploadingMedia) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploadingMedia ? "Uploading Media..." : "Create Evidence Bag"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
