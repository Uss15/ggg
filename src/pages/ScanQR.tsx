import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, QrCode } from "lucide-react";
import { toast } from "sonner";
import { getEvidenceBag } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const bagIdSchema = z.string().regex(/^BAG-\d{4}-\d{4}$/, "Invalid bag ID format");

export default function ScanQR() {
  const navigate = useNavigate();
  const [bagId, setBagId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>();

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile) setUserName(profile.full_name);
          });
      }
    });
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bagId.trim()) {
      toast.error("Please enter a Bag ID");
      return;
    }

    const validation = bagIdSchema.safeParse(bagId.trim());
    if (!validation.success) {
      toast.error("Invalid bag ID format. Expected format: BAG-YYYY-NNNN");
      return;
    }

    setIsLoading(true);
    try {
      const bag = await getEvidenceBag(bagId.trim());
      if (bag) {
        navigate(`/bag/${bag.bag_id}`);
      } else {
        toast.error("Evidence bag not found");
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error finding bag:", error);
      }
      toast.error("Failed to find evidence bag");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <QrCode className="h-16 w-16 mx-auto text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Scan QR Code</h1>
            <p className="text-muted-foreground">Enter the Bag ID to access evidence details</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Find Evidence Bag</CardTitle>
              <CardDescription>Enter the Bag ID from the QR code sticker</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="BAG-2025-0001"
                    value={bagId}
                    onChange={(e) => setBagId(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>Camera-based QR scanning coming soon</p>
          </div>
        </div>
      </main>
    </div>
  );
}
