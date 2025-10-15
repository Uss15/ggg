import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { getAllEvidenceBags, getProfile } from "@/lib/supabase";
import { Plus, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [bags, setBags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error: any) {
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header userName={profile?.full_name} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Evidence Bags</h2>
            <p className="text-muted-foreground">Manage and track all evidence bags</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/scan")}>
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
            <Button onClick={() => navigate("/create")}>
              <Plus className="h-4 w-4 mr-2" />
              New Bag
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bags.map((bag) => (
            <Card key={bag.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/bag/${bag.bag_id}`)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{bag.bag_id}</CardTitle>
                  <StatusBadge status={bag.current_status} />
                </div>
                <CardDescription className="capitalize">{bag.type.replace('_', ' ')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{bag.description}</p>
                <p className="text-xs text-muted-foreground mt-2">Collected by: {bag.collector?.full_name || 'Unknown'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}