import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Clock, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SecurityEvent {
  id: string;
  user_id: string;
  action: string;
  ip_address?: string;
  timestamp: string;
  success: boolean;
  details?: any;
}

export const SecurityMonitor = () => {
  const [activeSessions, setActiveSessions] = useState(0);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Get recent security events
      const { data: securityData, error: secError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (secError) throw secError;

      // Transform security data to events
      const events: SecurityEvent[] = (securityData || []).map(entry => ({
        id: entry.id,
        user_id: entry.user_id,
        action: entry.event_type,
        ip_address: entry.ip_address || undefined,
        timestamp: entry.created_at,
        success: entry.event_status === 'success',
        details: entry.metadata
      }));

      setRecentEvents(events);

      // Calculate metrics
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentFailed = events.filter(e => 
        !e.success && new Date(e.timestamp) > last24h
      ).length;
      setFailedAttempts(recentFailed);

      // Get actual active sessions (unique users in last 30 minutes)
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      const uniqueUsers = new Set(
        events
          .filter(e => new Date(e.timestamp) > thirtyMinAgo)
          .map(e => e.user_id)
      );
      setActiveSessions(uniqueUsers.size);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading security data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Attempts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedAttempts}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Logins
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEvents.length}</div>
            <p className="text-xs text-muted-foreground">Recent activity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suspicious Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent security events.</p>
            ) : (
              recentEvents.slice(0, 10).map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between border-b pb-2 cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{event.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                        {event.ip_address && ` • ${event.ip_address}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={event.success ? "default" : "destructive"}>
                    {event.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Security Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Event Type</p>
                <p className="font-medium">{selectedEvent.action}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-sm">{selectedEvent.user_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timestamp</p>
                <p className="font-medium">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
              </div>
              {selectedEvent.ip_address && (
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-mono text-sm">{selectedEvent.ip_address}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={selectedEvent.success ? "default" : "destructive"}>
                  {selectedEvent.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
              {selectedEvent.details && (
                <div>
                  <p className="text-sm text-muted-foreground">Additional Details</p>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
