import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { uploadEvidencePhoto } from "@/lib/supabase";
import { toast } from "sonner";

interface PhotoUploadProps {
  bagId: string;
  onUploadComplete: () => void;
}

export const PhotoUpload = ({ bagId, onUploadComplete }: PhotoUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      return `${file.name}: Only JPG, PNG, and WEBP images are allowed`;
    }
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return `${file.name}: File size must be less than 10MB`;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate max 10 files
    if (files.length > 10) {
      toast.error("Maximum 10 files can be uploaded at once");
      return;
    }

    // Validate each file
    const errors: string[] = [];
    const validFiles: File[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast.error("File validation failed", {
        description: errors.join("\n")
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one photo");
      return;
    }

    setIsUploading(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const file of selectedFiles) {
        try {
          await uploadEvidencePhoto(bagId, file, notes);
          successCount++;
        } catch (error) {
          failCount++;
          if (import.meta.env.DEV) {
            console.error(`Error uploading ${file.name}:`, error);
          }
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} photo(s)`);
        setSelectedFiles([]);
        setNotes("");
        onUploadComplete();
      }

      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} photo(s)`);
      }
    } catch (error) {
      toast.error("Upload failed");
      if (import.meta.env.DEV) {
        console.error("Error uploading photos:", error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload Evidence Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="photo-upload">Select Photos (Max 10, JPG/PNG/WEBP, 10MB each)</Label>
          <Input
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
            className="mt-2"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Files ({selectedFiles.length})</Label>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground mx-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="photo-notes">Notes (Optional)</Label>
          <Textarea
            id="photo-notes"
            placeholder="Add notes about these photos..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isUploading}
            maxLength={500}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {notes.length}/500 characters
          </p>
        </div>

        <Button
          onClick={handleUpload}
          disabled={isUploading || selectedFiles.length === 0}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} Photo(s)`}
        </Button>
      </CardContent>
    </Card>
  );
};
