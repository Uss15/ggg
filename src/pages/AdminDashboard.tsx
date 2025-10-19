import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Users, Package, FileText, TrendingUp } from "lucide-react";
import { UserRoleManager } from "@/components/admin/UserRoleManager";
import { StatsChart } from "@/components/admin/StatsChart";
import { getProfile, hasRole } from "@/lib/supabase";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalBags: 0,
    collected: 0,
    inTransport: 0,
    inLab: 0,
    analyzed: 0,
    archived: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    const [profileData, adminStatus] = await Promise.all([
      getProfile(user.id),
      hasRole(user.id, 'admin'),
    ]);

    if (!adminStatus) {
      toast.error("Admin access required");
      navigate("/dashboard");
      return;
    }

    setProfile(profileData);
    setIsAdmin(true);
    loadStats();
  };

  const loadStats = async () => {
    const { data: bags } = await supabase
      .from('evidence_bags')
      .select('current_status');

    if (bags) {
      setStats({
        totalBags: bags.length,
        collected: bags.filter(b => b.current_status === 'collected').length,
        inTransport: bags.filter(b => b.current_status === 'in_transport').length,
        inLab: bags.filter(b => b.current_status === 'in_lab').length,
        analyzed: bags.filter(b => b.current_status === 'analyzed').length,
        archived: bags.filter(b => b.current_status === 'archived').length,
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header userName={profile?.full_name} />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Checking permissions...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header userName={profile?.full_name} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">System management and oversight</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Evidence
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Evidence Bags</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBags}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collected</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.collected}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Transport</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inTransport}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Lab</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inLab}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyzed</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.analyzed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Archived</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.archived}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                <TrendingUp className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <StatsChart stats={stats} />
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <UserRoleManager />
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Export and reporting features coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
