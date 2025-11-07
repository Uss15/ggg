import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Package, 
  Clock, 
  CheckCircle2, 
  MapPin,
  FolderPlus
} from "lucide-react";
import type { EvidenceBag } from "@/lib/supabase";

interface CollectorDashboardViewProps {
  bags: EvidenceBag[];
  userId: string;
}

export function CollectorDashboardView({ bags, userId }: CollectorDashboardViewProps) {
  const navigate = useNavigate();

  // Filter bags collected by this user
  const myBags = bags.filter(b => b.initial_collector === userId);

  const stats = {
    myTotal: myBags.length,
    collected: myBags.filter(b => b.current_status === 'collected').length,
    inTransit: myBags.filter(b => b.current_status === 'in_transport').length,
    completed: myBags.filter(b => ['analyzed', 'archived'].includes(b.current_status)).length,
  };

  const recentCollections = myBags.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Collector Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Collections
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myTotal}</div>
            <p className="text-xs text-muted-foreground">Total collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collected}</div>
            <p className="text-xs text-muted-foreground">Awaiting transfer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Transit
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">Being transported</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Collector Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button 
              onClick={() => navigate('/create')}
              size="lg"
              className="h-auto flex-col gap-2 py-6"
            >
              <Plus className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">New Evidence</div>
                <div className="text-xs opacity-90">Create new bag</div>
              </div>
            </Button>
            <Button 
              onClick={() => navigate('/cases')}
              variant="outline"
              size="lg"
              className="h-auto flex-col gap-2 py-6"
            >
              <FolderPlus className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Cases</div>
                <div className="text-xs opacity-70">View cases</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Recent Collections */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Recent Collections</CardTitle>
            <Button variant="link" onClick={() => navigate('/dashboard')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentCollections.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No collections yet</p>
              <Button onClick={() => navigate('/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Evidence Bag
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCollections.map((bag) => (
                <div
                  key={bag.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/bag/${bag.bag_id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium font-mono text-sm">{bag.bag_id}</p>
                    <p className="text-xs text-muted-foreground truncate">{bag.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">📍 {bag.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs capitalize px-2 py-1 bg-muted rounded whitespace-nowrap">
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
