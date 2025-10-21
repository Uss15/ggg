import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validateCoordinates } from "@/lib/validation";
import { logError, sanitizeError } from "@/lib/errors";

interface LocationCaptureProps {
  onLocationCapture: (latitude: number, longitude: number) => void;
  autoCapture?: boolean;
}

export const LocationCapture = ({ onLocationCapture, autoCapture = false }: LocationCaptureProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Validate coordinates before using them
          validateCoordinates({ latitude, longitude });
          
          setLocation({ latitude, longitude });
          onLocationCapture(latitude, longitude);
          toast.success("Location captured successfully");
          setIsLoading(false);
        } catch (error) {
          logError('LocationCapture', error);
          toast.error(sanitizeError(error));
          setIsLoading(false);
        }
      },
      (error) => {
        logError('LocationCapture', error);
        toast.error("Unable to capture location. Please check permissions.");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (autoCapture) {
      captureLocation();
    }
  }, [autoCapture]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">GPS Location</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={captureLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <MapPin className="h-3 w-3 mr-2" />
                  Capture Location
                </>
              )}
            </Button>
          </div>

          {location && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <div>Lat: {location.latitude.toFixed(6)}</div>
              <div>Long: {location.longitude.toFixed(6)}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
