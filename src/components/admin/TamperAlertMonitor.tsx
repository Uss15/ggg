import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface TamperAlert {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: any;
  new_data: any;
  detected_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_at: string | null;
  notes: string | null;
}

export function TamperAlertMonitor() {
  const [alerts, setAlerts] = useState<TamperAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<TamperAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadAlerts();

    // Subscribe to new alerts
    const channel = supabase
      .channel('tamper-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tamper_alerts',
        },
        () => {
          loadAlerts();
          toast.error('New security alert detected!', {
            icon: <AlertTriangle className="h-4 w-4" />,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('tamper_alerts')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts((data as TamperAlert[]) || []);
    } catch (error) {
      console.error('Failed to load tamper alerts:', error);
      toast.error('Failed to load security alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string, resolved: boolean) => {
    setResolving(true);
    try {
      const { error } = await supabase
        .from('tamper_alerts')
        .update({
          resolved,
          resolved_at: resolved ? new Date().toISOString() : null,
          notes: resolutionNotes || null,
        })
        .eq('id', alertId);

      if (error) throw error;

      toast.success(resolved ? 'Alert resolved' : 'Alert reopened');
      setSelectedAlert(null);
      setResolutionNotes('');
      loadAlerts();
    } catch (error) {
      console.error('Failed to update alert:', error);
      toast.error('Failed to update alert');
    } finally {
      setResolving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const unresolvedCount = alerts.filter(a => !a.resolved).length;
  const criticalCount = alerts.filter(a => !a.resolved && a.severity === 'critical').length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tamper Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading alerts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tamper Detection
            </div>
            <div className="flex gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {criticalCount} Critical
                </Badge>
              )}
              {unresolvedCount > 0 && (
                <Badge variant="outline">
                  {unresolvedCount} Unresolved
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No security alerts detected. All systems operating normally.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${
                    alert.resolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      {alert.resolved && (
                        <Badge variant="secondary">Resolved</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{alert.action}</p>
                    <p className="text-sm text-muted-foreground">
                      Table: {alert.table_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.detected_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Security Alert Details</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Severity</Label>
                  <Badge variant={getSeverityColor(selectedAlert.severity)} className="mt-1">
                    {selectedAlert.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedAlert.resolved ? 'secondary' : 'destructive'} className="mt-1">
                    {selectedAlert.resolved ? 'Resolved' : 'Active'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Action</Label>
                <p className="text-sm mt-1">{selectedAlert.action}</p>
              </div>

              <div>
                <Label>Table</Label>
                <p className="text-sm mt-1">{selectedAlert.table_name}</p>
              </div>

              {selectedAlert.record_id && (
                <div>
                  <Label>Record ID</Label>
                  <p className="text-sm mt-1 font-mono">{selectedAlert.record_id}</p>
                </div>
              )}

              <div>
                <Label>Detected At</Label>
                <p className="text-sm mt-1">
                  {new Date(selectedAlert.detected_at).toLocaleString()}
                </p>
              </div>

              {selectedAlert.old_data && (
                <div>
                  <Label>Original Data</Label>
                  <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedAlert.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedAlert.new_data && (
                <div>
                  <Label>Modified Data</Label>
                  <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedAlert.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {!selectedAlert.resolved && (
                <div>
                  <Label htmlFor="notes">Resolution Notes</Label>
                  <Textarea
                    id="notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add notes about how this alert was resolved..."
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex gap-2">
                {!selectedAlert.resolved ? (
                  <Button
                    onClick={() => handleResolve(selectedAlert.id, true)}
                    disabled={resolving}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleResolve(selectedAlert.id, false)}
                    disabled={resolving}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reopen Alert
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
