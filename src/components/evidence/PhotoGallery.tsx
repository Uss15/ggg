import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight, X } from "lucide-react";
import { EvidencePhoto } from "@/lib/supabase";
import { format } from "date-fns";

interface PhotoGalleryProps {
  photos: EvidencePhoto[];
}

export const PhotoGallery = ({ photos }: PhotoGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const downloadPhoto = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  if (photos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evidence Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evidence Photos ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={photo.photo_url}
                  alt={`Evidence photo ${index + 1}`}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-sm">Click to view</p>
                </div>
                {photo.notes && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                    <p className="text-white text-xs truncate">{photo.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl p-0">
          {selectedPhoto && (
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={closeLightbox}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Navigation buttons */}
              {selectedIndex !== null && selectedIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              {selectedIndex !== null && selectedIndex < photos.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Image */}
              <img
                src={selectedPhoto.photo_url}
                alt={`Evidence photo ${(selectedIndex || 0) + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {/* Metadata */}
              <div className="p-4 bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Photo {(selectedIndex || 0) + 1} of {photos.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Uploaded: {format(new Date(selectedPhoto.uploaded_at), "PPpp")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPhoto(
                      selectedPhoto.photo_url,
                      `evidence-photo-${selectedPhoto.id}.jpg`
                    )}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                {selectedPhoto.notes && (
                  <div>
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm text-muted-foreground">{selectedPhoto.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
