import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserCog, Clock, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface RoleChange {
  id: string;
  user_id: string;
  changed_by: string;
  old_roles: string[];
  new_roles: string[];
  reason: string;
  ip_address: string;
  created_at: string;
  profiles?: { full_name: string };
  changer_profile?: { full_name: string };
}

interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_status: string;
  ip_address: string;
  location_authorized: boolean;
  created_at: string;
  profiles?: { full_name: string };
}

export function RoleAuditDashboard() {
  const [roleChanges, setRoleChanges] = useState<RoleChange[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    try {
      const [roleChangesRes, securityEventsRes] = await Promise.all([
        supabase
          .from('role_changes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('security_events')
          .select('*')
          .in('event_type', ['login', 'role_change', 'api_access'])
          .order('created_at', { ascending: false })
          .limit(30)
      ]);

      if (roleChangesRes.error) throw roleChangesRes.error;
      if (securityEventsRes.error) throw securityEventsRes.error;

      // Get unique user IDs
      const userIds = new Set<string>();
      roleChangesRes.data?.forEach(r => {
        userIds.add(r.user_id);
        if (r.changed_by) userIds.add(r.changed_by);
      });
      securityEventsRes.data?.forEach(e => {
        if (e.user_id) userIds.add(e.user_id);
      });

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Map data with profiles
      const roleChangesWithProfiles = roleChangesRes.data?.map(r => ({
        ...r,
        old_roles: (r.old_roles as any) || [],
        new_roles: (r.new_roles as any) || [],
        profiles: { full_name: profileMap.get(r.user_id) || 'Unknown' },
        changer_profile: { full_name: r.changed_by ? profileMap.get(r.changed_by) || 'System' : 'System' }
      })) || [];

      const securityEventsWithProfiles = securityEventsRes.data?.map(e => ({
        ...e,
        profiles: { full_name: profileMap.get(e.user_id || '') || 'Unknown' }
      })) || [];

      setRoleChanges(roleChangesWithProfiles as any);
      setSecurityEvents(securityEventsWithProfiles as any);
    } catch (error) {
      console.error('Error loading audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'failed': return 'destructive';
      case 'blocked': return 'destructive';
      default: return 'secondary';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'role_change': return <UserCog className="h-4 w-4" />;
      case 'api_access': return <Shield className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Role Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Role Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {roleChanges.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No role changes recorded
                </p>
              ) : (
                roleChanges.map((change) => (
                  <div
                    key={change.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {change.profiles?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Changed by: {change.changer_profile?.full_name || 'System'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(change.created_at), 'MMM d, HH:mm')}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2 items-center text-xs">
                      <Badge variant="secondary">
                        {change.old_roles.join(', ') || 'None'}
                      </Badge>
                      <span>→</span>
                      <Badge variant="default">
                        {change.new_roles.join(', ') || 'None'}
                      </Badge>
                    </div>

                    {change.reason && (
                      <p className="text-xs text-muted-foreground">
                        Reason: {change.reason}
                      </p>
                    )}
                    
                    {change.ip_address && (
                      <p className="text-xs text-muted-foreground font-mono">
                        IP: {change.ip_address}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {securityEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No security events recorded
                </p>
              ) : (
                securityEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`border rounded-lg p-3 ${
                      event.event_status === 'failed' || event.event_status === 'blocked'
                        ? 'border-destructive/50 bg-destructive/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(event.event_type)}
                        <span className="text-sm font-medium">
                          {event.event_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <Badge variant={getEventStatusColor(event.event_status)}>
                        {event.event_status}
                      </Badge>
                    </div>

                    <p className="text-sm mb-1">
                      {event.profiles?.full_name || 'Unknown User'}
                    </p>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </p>
                      {event.ip_address && (
                        <p className="text-xs text-muted-foreground font-mono">
                          IP: {event.ip_address}
                        </p>
                      )}
                      {event.location_authorized !== null && (
                        <div className="flex items-center gap-1 text-xs">
                          {event.location_authorized ? (
                            <Badge variant="default" className="text-xs">
                              Location Authorized
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Unauthorized Location
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
