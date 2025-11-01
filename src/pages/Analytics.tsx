import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Package, FileText, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

export default function Analytics() {
  const navigate = useNavigate();
  const [bags, setBags] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvidence: 0,
    totalCases: 0,
    activeUsers: 0,
    avgResolutionTime: 0
  });

  useEffect(() => {
    checkAccess();
    loadData();
  }, []);

  const checkAccess = async () => {
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
    }
  };

  const loadData = async () => {
    try {
      const [bagsData, casesData, usersData] = await Promise.all([
        supabase.from("evidence_bags").select("*"),
        supabase.from("cases").select("*"),
        supabase.from("profiles_public").select("*")
      ]);

      if (bagsData.error) throw bagsData.error;
      if (casesData.error) throw casesData.error;

      const evidenceBags = bagsData.data || [];
      const casesList = casesData.data || [];

      setBags(evidenceBags);
      setCases(casesList);

      // Calculate average case resolution time
      const closedCases = casesList.filter(c => c.is_closed && c.closed_at);
      let avgResolution = 0;
      if (closedCases.length > 0) {
        const totalDays = closedCases.reduce((sum, c) => {
          const created = new Date(c.created_at);
          const closed = new Date(c.closed_at);
          const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        avgResolution = Math.round(totalDays / closedCases.length);
      }

      setStats({
        totalEvidence: evidenceBags.length,
        totalCases: casesList.length,
        activeUsers: usersData.data?.length || 0,
        avgResolutionTime: avgResolution
      });
    } catch (error: any) {
      toast.error("Failed to load analytics data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8">
          <div className="text-center">Loading analytics...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            System performance and statistics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvidence}</div>
              <p className="text-xs text-muted-foreground">Bags tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCases}</div>
              <p className="text-xs text-muted-foreground">Cases managed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">System users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResolutionTime}</div>
              <p className="text-xs text-muted-foreground">Days per case</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <AnalyticsCharts bags={bags} cases={cases} />
      </main>
    </div>
  );
}
