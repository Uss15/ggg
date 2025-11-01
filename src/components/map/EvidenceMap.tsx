import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;

    // Mapbox public token (safe to expose in client-side code)
    const MAPBOX_TOKEN = "pk.eyJ1IjoiYmVhdXR5aW5jaGFvcyIsImEiOiJjbWhnbmsyb20wZmFwMmpzN3JpZWFvaTlxIn0.FCBbBQAhdYI3_B-p9VLXAA";
    
    if (!MAPBOX_TOKEN) {
      setMapError("Mapbox token not configured. Please add MAPBOX_PUBLIC_TOKEN to project settings.");
      return;
    }

    try {
      // Calculate center point
      const centerLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
      const centerLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;

      // Initialize map
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      mapInstanceRef.current = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [centerLng, centerLat],
        zoom: 12,
      });

      // Add navigation controls
      mapInstanceRef.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Add markers for each location
      locations.forEach((location) => {
        const el = document.createElement('div');
        el.className = 'evidence-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontWeight = 'bold';
        el.style.color = 'white';
        el.style.fontSize = '12px';
        
        // Color based on status
        const statusColors: Record<string, string> = {
          collected: '#10b981',
          in_transport: '#f59e0b',
          in_lab: '#3b82f6',
          analyzed: '#8b5cf6',
          archived: '#6b7280',
          disposed: '#ef4444',
        };
        el.style.backgroundColor = statusColors[location.status] || '#6b7280';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([location.longitude, location.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px;">
                  <h3 style="font-weight: bold; margin-bottom: 4px;">${location.bag_id}</h3>
                  <p style="font-size: 12px; margin-bottom: 4px;">${location.description}</p>
                  <p style="font-size: 11px; color: #666;">Status: ${location.status}</p>
                </div>
              `)
          )
          .addTo(mapInstanceRef.current!);

        el.addEventListener('click', () => {
          onMarkerClick?.(location);
        });

        markersRef.current.push(marker);
      });

      // Fit bounds to show all markers
      if (locations.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(loc => bounds.extend([loc.longitude, loc.latitude]));
        mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
      }

    } catch (error) {
      console.error('Map error:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      mapInstanceRef.current?.remove();
    };
  }, [locations, onMarkerClick]);

  if (mapError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Evidence Locations Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{mapError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Evidence Locations Map ({locations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          className="w-full h-[500px] rounded-lg"
          style={{ minHeight: '500px' }}
        />
      </CardContent>
    </Card>
  );
};
