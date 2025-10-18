import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { getAllEvidenceBags, getProfile } from "@/lib/supabase";
import { Plus, QrCode, Search, Package } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [bags, setBags] = useState<any[]>([]);
  const [filteredBags, setFilteredBags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
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
    if (searchQuery.trim() === "") {
      setFilteredBags(bags);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredBags(
        bags.filter(
          (bag) =>
            bag.bag_id.toLowerCase().includes(query) ||
            bag.description.toLowerCase().includes(query) ||
            bag.location.toLowerCase().includes(query) ||
            bag.type.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, bags]);

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
              <Button onClick={() => navigate("/scan")} variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
              <Button onClick={() => navigate("/create")}>
                <Plus className="h-4 w-4 mr-2" />
                New Bag
              </Button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, description, location, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

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
      </main>
    </div>
  );
}