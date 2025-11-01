import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { CustodyTimeline } from "@/components/evidence/CustodyTimeline";
import { AddCustodyModal } from "@/components/evidence/AddCustodyModal";
import { PhotoUpload } from "@/components/evidence/PhotoUpload";
import { PhotoGallery } from "@/components/evidence/PhotoGallery";
import { ArrowLeft, Plus, Upload, RefreshCw, Link2, Trash2, FileText } from "lucide-react";
import { getEvidenceCases } from "@/lib/supabase-enhanced";
import { DisposalRequestModal } from "@/components/disposal/DisposalRequestModal";
import { UpdateStatusModal } from "@/components/evidence/UpdateStatusModal";
import { toast } from "sonner";
import { getEvidenceBag, getChainOfCustody, getEvidencePhotos } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import type { EvidenceBag, ChainOfCustodyLog, EvidencePhoto } from "@/lib/supabase";
import { z } from "zod";

const bagIdSchema = z.string().regex(/^BAG-\d{4}-\d{4}$/, "Invalid bag ID format");

export default function BagDetail() {
  const { bagId } = useParams<{ bagId: string }>();
  const navigate = useNavigate();
  const [bag, setBag] = useState<EvidenceBag | null>(null);
  const [custody, setCustody] = useState<any[]>([]);
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCustody, setShowAddCustody] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [showDisposalRequest, setShowDisposalRequest] = useState(false);
  const [linkedCases, setLinkedCases] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>();

  useEffect(() => {
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
  }, []);

  const loadBagData = async () => {
    if (!bagId) return;
    
    const validation = bagIdSchema.safeParse(bagId);
    if (!validation.success) {
      toast.error("Invalid bag ID format. Expected format: BAG-YYYY-NNNN");
      navigate("/dashboard");
      return;
    }
    
    setIsLoading(true);
    try {
      const bagData = await getEvidenceBag(bagId);
      
      if (!bagData) {
        toast.error("Evidence bag not found");
        navigate("/dashboard");
        return;
      }

      const [custodyData, photosData, casesData] = await Promise.all([
        getChainOfCustody(bagId),
        getEvidencePhotos(bagId),
        getEvidenceCases(bagData.id),
      ]);

      setBag(bagData);
      setCustody(custodyData || []);
      setPhotos(photosData || []);
      setLinkedCases(casesData || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error loading bag:", error);
      }
      toast.error("Failed to load evidence bag");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBagData();
  }, [bagId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header userName={userName} />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (!bag) {
    return (
      <div className="min-h-screen bg-background">
        <Header userName={userName} />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Evidence bag not found</p>
        </main>
      </div>
    );
  }

  const evidenceTypeLabels = {
    weapon: "Weapon",
    clothing: "Clothing",
    biological_sample: "Biological Sample",
    documents: "Documents",
    electronics: "Electronics",
    other: "Other",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName={userName} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{bag.bag_id}</h1>
              <p className="text-muted-foreground">Evidence Bag Details</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={bag.current_status} />
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const { generateCustodyReport } = await import('@/lib/pdf-reports');
                  generateCustodyReport(bag, custody, photos);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowUpdateStatus(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Status
              </Button>
              {bag.current_status !== 'archived' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDisposalRequest(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Request Disposal
                </Button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{evidenceTypeLabels[bag.type]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{bag.description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{bag.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collected</p>
                  <p className="font-medium">
                    {new Date(bag.date_collected).toLocaleString()}
                  </p>
                </div>
                {bag.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{bag.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <QRCodeDisplay bagId={bag.bag_id} url={bag.qr_data || ""} />
          </div>

          {linkedCases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Cases ({linkedCases.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {linkedCases.map((item) => (
                    <Card
                      key={item.id}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => navigate(`/cases/${item.case_id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{item.cases.case_number}</p>
                          <p className="text-sm text-muted-foreground">{item.cases.offense_type}</p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                          )}
                        </div>
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <PhotoGallery photos={photos} />

          {showPhotoUpload ? (
            <PhotoUpload 
              bagId={bag.id} 
              onUploadComplete={() => {
                loadBagData();
                setShowPhotoUpload(false);
              }}
            />
          ) : (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowPhotoUpload(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Evidence Photos
            </Button>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Chain of Custody</CardTitle>
              <Button onClick={() => setShowAddCustody(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </CardHeader>
            <CardContent>
              <CustodyTimeline entries={custody} />
            </CardContent>
          </Card>
        </div>
      </main>

      <AddCustodyModal
        open={showAddCustody}
        onOpenChange={setShowAddCustody}
        bagId={bag.id}
        onSuccess={loadBagData}
      />

      <UpdateStatusModal
        open={showUpdateStatus}
        onOpenChange={setShowUpdateStatus}
        bagId={bag.id}
        currentStatus={bag.current_status}
        onSuccess={loadBagData}
      />

      <DisposalRequestModal
        open={showDisposalRequest}
        onOpenChange={setShowDisposalRequest}
        bagId={bag.id}
        bagName={bag.bag_id}
        onSuccess={loadBagData}
      />
    </div>
  );
}
