import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shield, Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IPAccessEntry {
  id: string;
  ip_address: string;
  access_type: 'whitelist' | 'blacklist';
  reason: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function IPAccessControl() {
  const [entries, setEntries] = useState<IPAccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    ip_address: '',
    access_type: 'whitelist' as 'whitelist' | 'blacklist',
    reason: '',
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('ip_access_control')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries((data || []) as IPAccessEntry[]);
    } catch (error) {
      console.error('Error loading IP entries:', error);
      toast.error('Failed to load IP access control list');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(formData.ip_address)) {
      toast.error('Please enter a valid IP address');
      return;
    }

    try {
      const { error } = await supabase.from('ip_access_control').insert({
        ip_address: formData.ip_address,
        access_type: formData.access_type,
        reason: formData.reason,
      });

      if (error) throw error;

      toast.success(`IP address ${formData.access_type === 'whitelist' ? 'whitelisted' : 'blacklisted'}`);
      setShowForm(false);
      setFormData({
        ip_address: '',
        access_type: 'whitelist',
        reason: '',
      });
      loadEntries();
    } catch (error) {
      console.error('Error creating IP entry:', error);
      toast.error('Failed to add IP address');
    }
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ip_access_control')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Entry ${!isActive ? 'activated' : 'deactivated'}`);
      loadEntries();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update entry');
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('ip_access_control')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Entry deleted');
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  if (loading) return <Card><CardContent className="p-6">Loading...</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            IP Access Control
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add IP Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                placeholder="192.168.1.1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_type">Access Type</Label>
              <select
                id="access_type"
                value={formData.access_type}
                onChange={(e) => setFormData({ ...formData, access_type: e.target.value as 'whitelist' | 'blacklist' })}
                className="w-full border rounded-md p-2"
              >
                <option value="whitelist">Whitelist (Allow)</option>
                <option value="blacklist">Blacklist (Block)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for this IP rule..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Add Rule</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No IP access rules configured
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`border rounded-lg p-4 space-y-3 ${
                  entry.access_type === 'blacklist' ? 'border-destructive/50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <code className="font-mono font-semibold">{entry.ip_address}</code>
                      {entry.access_type === 'blacklist' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {entry.reason && (
                      <p className="text-sm text-muted-foreground">{entry.reason}</p>
                    )}
                  </div>
                  <Badge
                    variant={entry.access_type === 'whitelist' ? 'default' : 'destructive'}
                  >
                    {entry.access_type}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={entry.is_active}
                      onCheckedChange={() => toggleStatus(entry.id, entry.is_active)}
                    />
                    <span className="text-sm">{entry.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEntry(entry.id)}
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
