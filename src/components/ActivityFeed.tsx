import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Package, FolderOpen, FileCheck, Trash2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  user: {
    full_name: string;
  };
  details?: any;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('audit-log-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_log',
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select(`
          id,
          action,
          entity_type,
          created_at,
          details,
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      setActivities(data as any || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (entityType: string) => {
    switch (entityType) {
      case 'evidence_bag':
        return Package;
      case 'case':
        return FolderOpen;
      case 'custody':
        return FileCheck;
      case 'disposal':
        return Trash2;
      case 'user':
        return User;
      default:
        return Activity;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'default';
    if (action.includes('update')) return 'secondary';
    if (action.includes('delete')) return 'destructive';
    return 'outline';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              activities.map((activity) => {
                const Icon = getIcon(activity.entity_type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getActionColor(activity.action) as any} className="text-xs">
                          {activity.action.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.entity_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.user?.full_name || 'System'}</span>
                        {activity.details?.description && (
                          <span className="text-muted-foreground"> • {activity.details.description}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
