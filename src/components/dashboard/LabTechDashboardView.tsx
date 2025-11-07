import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Microscope, 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  Package,
  FileSearch,
  FlaskConical
} from "lucide-react";
import type { EvidenceBag } from "@/lib/supabase";

interface LabTechDashboardViewProps {
  bags: EvidenceBag[];
}

export function LabTechDashboardView({ bags }: LabTechDashboardViewProps) {
  const navigate = useNavigate();

  const stats = {
    inLab: bags.filter(b => b.current_status === 'in_lab').length,
    analyzing: bags.filter(b => b.current_status === 'in_lab').length, // Would filter by assigned tech in real scenario
    analyzed: bags.filter(b => b.current_status === 'analyzed').length,
    pending: bags.filter(b => ['collected', 'in_transport'].includes(b.current_status)).length,
  };

  // Show ALL bags in lab/analyzed status (not filtered by user)
  const labBags = bags.filter(b => ['in_lab', 'analyzed'].includes(b.current_status)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Lab Tech Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Laboratory
            </CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inLab}</div>
            <p className="text-xs text-muted-foreground">Ready for analysis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Analysis
            </CardTitle>
            <Microscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.analyzing}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
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
            <div className="text-2xl font-bold">{stats.analyzed}</div>
            <p className="text-xs text-muted-foreground">Analysis done</p>
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
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Lab Tech Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Laboratory Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button 
              onClick={() => {
                // Navigate to dashboard with lab filter
                navigate('/dashboard');
              }}
              size="lg"
              className="h-auto flex-col gap-2 py-6"
            >
              <Microscope className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">View Lab Queue</div>
                <div className="text-xs opacity-90">Evidence in lab</div>
              </div>
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="lg"
              className="h-auto flex-col gap-2 py-6"
            >
              <ClipboardCheck className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Update Status</div>
                <div className="text-xs opacity-70">View evidence</div>
              </div>
            </Button>
            <Button 
              onClick={() => navigate('/cases')}
              variant="outline"
              size="lg"
              className="h-auto flex-col gap-2 py-6"
            >
              <FileSearch className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Cases</div>
                <div className="text-xs opacity-70">View cases</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lab Evidence Queue */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Laboratory Queue</CardTitle>
            <Button variant="link" onClick={() => navigate('/dashboard')}>
              View All Evidence
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {labBags.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No evidence in laboratory</p>
              <p className="text-xs text-muted-foreground mt-2">
                Evidence will appear here when it arrives at the lab
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {labBags.map((bag) => (
                <div
                  key={bag.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/bag/${bag.bag_id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium font-mono text-sm">{bag.bag_id}</p>
                    <p className="text-xs text-muted-foreground truncate">{bag.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: <span className="capitalize">{bag.type.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs capitalize px-2 py-1 bg-muted rounded whitespace-nowrap">
                      {bag.current_status.replace('_', ' ')}
                    </span>
                    {bag.current_status === 'in_lab' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/bag/${bag.bag_id}`);
                        }}
                      >
                        Analyze
                      </Button>
                    )}
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
