import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import type { EvidencePhoto } from "@/lib/supabase";

interface PhotoLightboxProps {
  photos: EvidencePhoto[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoLightbox({ photos, initialIndex, open, onOpenChange }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = async () => {
    const photo = photos[currentIndex];
    try {
      const response = await fetch(photo.photo_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evidence-photo-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0">
        <div className="relative w-full h-full flex flex-col bg-black">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleDownload}
              className="bg-black/50 hover:bg-black/70"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="bg-black/50 hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={currentPhoto.photo_url}
              alt={`Evidence photo ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {photos.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          <div className="bg-black/80 p-4 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm text-gray-400">
                  Photo {currentIndex + 1} of {photos.length}
                </p>
                {currentPhoto.notes && (
                  <p className="mt-2 text-sm">{currentPhoto.notes}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Uploaded {new Date(currentPhoto.uploaded_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
