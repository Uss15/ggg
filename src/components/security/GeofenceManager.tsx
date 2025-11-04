import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthorizedZone {
  id: string;
  zone_name: string;
  center_latitude: number;
  center_longitude: number;
  radius_meters: number;
  is_active: boolean;
  office_id: string | null;
  offices?: { name: string };
}

export function GeofenceManager() {
  const [zones, setZones] = useState<AuthorizedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    zone_name: '',
    center_latitude: '',
    center_longitude: '',
    radius_meters: '1000',
  });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const { data, error } = await supabase
        .from('authorized_zones')
        .select('*, offices(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error('Error loading zones:', error);
      toast.error('Failed to load authorized zones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const lat = parseFloat(formData.center_latitude);
    const lng = parseFloat(formData.center_longitude);
    const radius = parseInt(formData.radius_meters);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      toast.error('Please enter valid coordinates and radius');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Invalid coordinates');
      return;
    }

    try {
      const { error } = await supabase.from('authorized_zones').insert({
        zone_name: formData.zone_name,
        center_latitude: lat,
        center_longitude: lng,
        radius_meters: radius,
      });

      if (error) throw error;

      toast.success('Authorized zone created');
      setShowForm(false);
      setFormData({
        zone_name: '',
        center_latitude: '',
        center_longitude: '',
        radius_meters: '1000',
      });
      loadZones();
    } catch (error) {
      console.error('Error creating zone:', error);
      toast.error('Failed to create zone');
    }
  };

  const toggleZoneStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('authorized_zones')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Zone ${!isActive ? 'activated' : 'deactivated'}`);
      loadZones();
    } catch (error) {
      console.error('Error toggling zone:', error);
      toast.error('Failed to update zone');
    }
  };

  const deleteZone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;

    try {
      const { error } = await supabase
        .from('authorized_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Zone deleted');
      loadZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Failed to delete zone');
    }
  };

  if (loading) return <Card><CardContent className="p-6">Loading...</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geo-Fencing Zones
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zone_name">Zone Name</Label>
              <Input
                id="zone_name"
                value={formData.zone_name}
                onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                placeholder="e.g., Main Office"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.center_latitude}
                  onChange={(e) => setFormData({ ...formData, center_latitude: e.target.value })}
                  placeholder="40.7128"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.center_longitude}
                  onChange={(e) => setFormData({ ...formData, center_longitude: e.target.value })}
                  placeholder="-74.0060"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Radius (meters)</Label>
              <Input
                id="radius"
                type="number"
                value={formData.radius_meters}
                onChange={(e) => setFormData({ ...formData, radius_meters: e.target.value })}
                placeholder="1000"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Create Zone</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No authorized zones configured
            </p>
          ) : (
            zones.map((zone) => (
              <div
                key={zone.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{zone.zone_name}</h4>
                    {zone.offices && (
                      <p className="text-sm text-muted-foreground">{zone.offices.name}</p>
                    )}
                  </div>
                  <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                    {zone.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Latitude:</span>
                    <p className="font-mono">{zone.center_latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Longitude:</span>
                    <p className="font-mono">{zone.center_longitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Radius:</span>
                    <p>{zone.radius_meters}m</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={zone.is_active}
                      onCheckedChange={() => toggleZoneStatus(zone.id, zone.is_active)}
                    />
                    <span className="text-sm">{zone.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteZone(zone.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
