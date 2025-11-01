import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RandomAuditModal } from "@/components/audit/RandomAuditModal";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { exportToCSV } from "@/lib/csv-export";

export default function Audits() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const fetchAudits = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_checks")
        .select(`
          *,
          profiles:created_by(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAudits(data || []);
    } catch (error: any) {
      console.error("Error fetching audits:", error);
      toast.error("Failed to load audits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleExportAudit = (audit: any) => {
    const exportData = [{
      audit_name: audit.audit_name,
      status: audit.status,
      total_items: audit.total_items,
      checked_items: audit.checked_items,
      discrepancies: audit.discrepancies,
      created_by: audit.profiles?.full_name || 'Unknown',
      created_at: new Date(audit.created_at).toLocaleString(),
      completed_at: audit.completed_at ? new Date(audit.completed_at).toLocaleString() : 'N/A'
    }];

    exportToCSV(exportData, `audit-${audit.id}.csv`);
    toast.success("Audit exported to CSV");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName="Admin" />
      
      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Random Audits</h1>
            <p className="text-muted-foreground">
              Conduct random audits to verify evidence integrity
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Random Audit
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading audits...</p>
          </div>
        ) : audits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No audits created yet</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Audit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {audits.map((audit) => (
              <Card key={audit.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(audit.status)}
                        {audit.audit_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created by {audit.profiles?.full_name || 'Unknown'} on{' '}
                        {new Date(audit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(audit.status)}>
                      {audit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                      <p className="text-2xl font-bold">{audit.total_items}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Checked</p>
                      <p className="text-2xl font-bold">{audit.checked_items}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Discrepancies</p>
                      <p className="text-2xl font-bold text-destructive">{audit.discrepancies}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="text-2xl font-bold">
                        {audit.total_items > 0 
                          ? Math.round((audit.checked_items / audit.total_items) * 100) 
                          : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/audit/${audit.id}`)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExportAudit(audit)}
                    >
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <RandomAuditModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={fetchAudits}
        />
      </main>
    </div>
  );
}
