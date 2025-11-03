import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusFilter } from "@/components/StatusFilter";
import { DashboardStats } from "@/components/DashboardStats";
import { QuickActions } from "@/components/QuickActions";
import { OfflineSyncStatus } from "@/components/OfflineSyncStatus";
import { AdvancedFilters } from "@/components/AdvancedFilters";
import { EvidenceMap } from "@/components/map/EvidenceMap";
import { getAllEvidenceBags, getProfile } from "@/lib/supabase";
import { exportToCSV } from "@/lib/csv-export";
import type { EvidenceStatus } from "@/lib/supabase";
import { Plus, Search, Package, SlidersHorizontal, Download, Map } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [bags, setBags] = useState<any[]>([]);
  const [filteredBags, setFilteredBags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EvidenceStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadData();

    // Set up real-time subscription for new bags
    const channel = supabase
      .channel("evidence-bags-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "evidence_bags",
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const [profileData, bagsData] = await Promise.all([
        getProfile(user.id),
        getAllEvidenceBags(),
      ]);

      setProfile(profileData);
      setBags(bagsData || []);
      setFilteredBags(bagsData || []);
    } catch (error: any) {
      console.error("Dashboard error:", error);
      toast.error(error.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = bags;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((bag) => bag.current_status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((bag) => bag.type === typeFilter);
    }

    // Apply date range filter
    if (dateFrom) {
      filtered = filtered.filter((bag) => new Date(bag.date_collected) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter((bag) => new Date(bag.date_collected) <= new Date(dateTo + "T23:59:59"));
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bag) =>
          bag.bag_id.toLowerCase().includes(query) ||
          bag.description.toLowerCase().includes(query) ||
          bag.location.toLowerCase().includes(query) ||
          bag.type.toLowerCase().includes(query)
      );
    }

    setFilteredBags(filtered);
  }, [searchQuery, statusFilter, typeFilter, dateFrom, dateTo, bags]);

  const getStatusCounts = () => {
    const counts: Record<EvidenceStatus | "all", number> = {
      all: bags.length,
      collected: 0,
      in_transport: 0,
      in_lab: 0,
      analyzed: 0,
      archived: 0,
    };

    bags.forEach((bag) => {
      counts[bag.current_status] = (counts[bag.current_status] || 0) + 1;
    });

    return counts;
  };

  const handleExportCSV = () => {
    try {
      const exportData = filteredBags.map(bag => ({
        bag_id: bag.bag_id,
        type: bag.type,
        description: bag.description,
        status: bag.current_status,
        location: bag.location,
        date_collected: new Date(bag.date_collected).toLocaleString(),
        notes: bag.notes || '',
      }));
      
      exportToCSV(exportData, `evidence-bags-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success("Evidence data exported to CSV");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header userName={profile?.full_name} />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header userName={profile?.full_name} />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Evidence Bags</h2>
              <p className="text-muted-foreground">Manage and track all evidence bags</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => navigate("/create")}>
                <Plus className="h-4 w-4 mr-2" />
                New Bag
              </Button>
            </div>
          </div>

          <OfflineSyncStatus />
          
          <DashboardStats bags={bags} />
          
          <QuickActions />

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, description, location, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <Collapsible open={showAdvancedFilters}>
              <CollapsibleContent>
                <AdvancedFilters
                  selectedType={typeFilter}
                  onTypeChange={setTypeFilter}
                  dateFrom={dateFrom}
                  onDateFromChange={setDateFrom}
                  dateTo={dateTo}
                  onDateToChange={setDateTo}
                  onClearFilters={() => {
                    setTypeFilter("all");
                    setDateFrom("");
                    setDateTo("");
                  }}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <StatusFilter
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
            counts={getStatusCounts()}
          />
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">
              <Package className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="map">
              <Map className="h-4 w-4 mr-2" />
              Map View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {filteredBags.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              {searchQuery ? (
                <>
                  <p className="text-muted-foreground mb-2">No bags match your search</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try different keywords or clear the search
                  </p>
                  <Button onClick={() => setSearchQuery("")} variant="outline">
                    Clear Search
                  </Button>
                </>
              ) : bags.length === 0 ? (
                <>
                  <p className="text-muted-foreground mb-4">No evidence bags yet</p>
                  <Button onClick={() => navigate("/create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Evidence Bag
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBags.map((bag) => (
              <Card key={bag.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/bag/${bag.bag_id}`)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-mono">{bag.bag_id}</CardTitle>
                    <StatusBadge status={bag.current_status} />
                  </div>
                  <CardDescription className="capitalize">{bag.type.replace('_', ' ')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{bag.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                    <span>📍 {bag.location}</span>
                    <span>👤 {bag.collector?.full_name || 'Unknown'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            )}
          </TabsContent>

          <TabsContent value="map">
            <EvidenceMap
              locations={filteredBags
                .filter(bag => bag.latitude && bag.longitude)
                .map(bag => ({
                  id: bag.id,
                  bag_id: bag.bag_id,
                  latitude: bag.latitude!,
                  longitude: bag.longitude!,
                  description: bag.description,
                  status: bag.current_status,
                }))}
              onMarkerClick={(location) => {
                navigate(`/bag/${location.bag_id}`);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}