import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  FileText,
  Settings,
  Database
} from "lucide-react";
import type { EvidenceBag } from "@/lib/supabase";

interface AdminDashboardViewProps {
  bags: EvidenceBag[];
  userCount?: number;
  recentActivity?: number;
}

export function AdminDashboardView({ bags, userCount = 0, recentActivity = 0 }: AdminDashboardViewProps) {
  const navigate = useNavigate();

  const stats = {
    totalBags: bags.length,
    activeCases: bags.filter(b => ["collected", "in_transport", "in_lab"].includes(b.current_status)).length,
    criticalAlerts: 0, // Would come from security_events
    userCount,
  };

  const recentBags = bags.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Admin Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Evidence
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBags}</div>
            <p className="text-xs text-muted-foreground">System-wide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
            <p className="text-xs text-muted-foreground">Registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Cases
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCases}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Security Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Administrator Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              onClick={() => navigate('/admin')}
              className="h-auto flex-col gap-2 py-4"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">User Management</span>
            </Button>
            <Button 
              onClick={() => navigate('/cases')}
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Cases</span>
            </Button>
            <Button 
              onClick={() => navigate('/analytics')}
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Analytics</span>
            </Button>
            <Button 
              onClick={() => navigate('/disposal-requests')}
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <Database className="h-6 w-6" />
              <span className="text-sm">Disposal Requests</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent System Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evidence Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {recentBags.map((bag) => (
                <div
                  key={bag.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/bag/${bag.bag_id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium font-mono text-sm">{bag.bag_id}</p>
                    <p className="text-xs text-muted-foreground truncate">{bag.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs capitalize px-2 py-1 bg-muted rounded">
                      {bag.current_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
