import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface EvidenceLocation {
  id: string;
  bag_id: string;
  latitude: number;
  longitude: number;
  description: string;
  status: string;
}

interface EvidenceMapProps {
  locations: EvidenceLocation[];
  onMarkerClick?: (location: EvidenceLocation) => void;
}

export const EvidenceMap = ({ locations, onMarkerClick }: EvidenceMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // For now, we'll use a simple implementation
    // In production, integrate with Google Maps, Mapbox, or Leaflet
    if (!mapRef.current || locations.length === 0) return;

    // Calculate center point
    const centerLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
    const centerLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;

    console.log('Map center:', centerLat, centerLng);
    console.log('Locations:', locations);
  }, [locations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Evidence Locations Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center relative overflow-hidden"
        >
          {locations.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No evidence locations to display</p>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="p-4 space-y-2 overflow-y-auto max-h-full">
                {locations.map((location, index) => (
                  <div
                    key={location.id}
                    className="bg-card p-3 rounded-lg shadow-sm border cursor-pointer hover:border-primary transition-colors"
                    onClick={() => onMarkerClick?.(location)}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{location.bag_id}</p>
                        <p className="text-xs text-muted-foreground truncate">{location.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-4 right-4 bg-card px-3 py-2 rounded-lg shadow-md border text-xs">
                {locations.length} location{locations.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Map integration placeholder - Connect Google Maps, Mapbox, or Leaflet for full functionality
        </p>
      </CardContent>
    </Card>
  );
};
