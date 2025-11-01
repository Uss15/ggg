import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Search, Download, Calendar, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/csv-export";

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
  user_name?: string;
}

export default function AuditLog() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkRole();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    const filtered = logs.filter(log => 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!roles || !roles.some(r => r.role === "admin")) {
      toast.error("Access denied: Admin privileges required");
      navigate("/dashboard");
      return;
    }
    setUserRole("admin");
  };

  const fetchAuditLogs = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      // Get unique user IDs
      const userIds = [...new Set(logsData?.map(log => log.user_id) || [])];
      
      // Fetch user names
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const enrichedLogs = logsData?.map(log => ({
        ...log,
        user_name: profileMap.get(log.user_id) || "Unknown User"
      })) || [];

      setLogs(enrichedLogs);
      setFilteredLogs(enrichedLogs);
    } catch (error: any) {
      toast.error("Failed to load audit logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredLogs.map(log => ({
      Timestamp: format(new Date(log.created_at), "PPpp"),
      User: log.user_name,
      Action: log.action,
      Entity: log.entity_type,
      EntityID: log.entity_id || "N/A",
      Details: JSON.stringify(log.details)
    }));

    exportToCSV(csvData, `audit-log-${format(new Date(), "yyyy-MM-dd")}`);
    toast.success("Audit log exported to CSV");
  };

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("insert")) return "default";
    if (action.includes("update")) return "secondary";
    if (action.includes("delete")) return "destructive";
    return "outline";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8">
          <div className="text-center">Loading audit logs...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              System Audit Log
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete timeline of all system activities
            </p>
          </div>
          <Button onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by action, entity, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredLogs.length} of {logs.length} log entries
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No audit logs found</p>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        <span className="text-sm font-medium">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-xs text-muted-foreground">
                            ID: {log.entity_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {log.user_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(log.created_at), "PPpp")}
                        </span>
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-muted-foreground flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            View Details
                          </summary>
                          <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
