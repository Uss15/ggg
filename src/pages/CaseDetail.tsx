import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Link2, Package, MapPin, Calendar, User, FileText } from "lucide-react";
import { getCaseById, getCaseEvidenceBags, unlinkEvidenceFromCase } from "@/lib/supabase-enhanced";
import { LinkEvidenceModal } from "@/components/case/LinkEvidenceModal";
import { toast } from "sonner";
import { logError, sanitizeError } from "@/lib/errors";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors = {
  open: "bg-green-500",
  under_investigation: "bg-blue-500",
  closed: "bg-gray-500",
  archived: "bg-yellow-500"
};

const statusLabels = {
  open: "Open",
  under_investigation: "Under Investigation",
  closed: "Closed",
  archived: "Archived"
};

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unlinkBagId, setUnlinkBagId] = useState<string | null>(null);

  useEffect(() => {
    if (caseId) loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    if (!caseId) return;
    
    try {
      setIsLoading(true);
      const [caseInfo, evidenceList] = await Promise.all([
        getCaseById(caseId),
        getCaseEvidenceBags(caseId)
      ]);

      setCaseData(caseInfo);
      setEvidence(evidenceList || []);
    } catch (error) {
      logError('LoadCaseDetail', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!unlinkBagId || !caseId) return;

    try {
      await unlinkEvidenceFromCase(caseId, unlinkBagId);
      toast.success("Evidence unlinked from case");
      loadCaseData();
    } catch (error) {
      logError('UnlinkEvidence', error);
      toast.error(sanitizeError(error));
    } finally {
      setUnlinkBagId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading case details...</p>
        </main>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Case not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cases")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{caseData.case_number}</h1>
              <p className="text-muted-foreground">{caseData.offense_type}</p>
            </div>
            <Badge className={statusColors[caseData.status as keyof typeof statusColors]}>
              {statusLabels[caseData.status as keyof typeof statusLabels]}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{caseData.location}</p>
                  </div>
                </div>

                {caseData.offices && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Office</p>
                      <p className="font-medium">
                        {caseData.offices.name} - {caseData.offices.city}
                      </p>
                    </div>
                  </div>
                )}

                {caseData.profiles && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lead Officer</p>
                      <p className="font-medium">{caseData.profiles.full_name}</p>
                      {caseData.profiles.badge_number && (
                        <p className="text-sm text-muted-foreground">
                          Badge: {caseData.profiles.badge_number}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {new Date(caseData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {caseData.description && (
                  <div>
                    <Separator className="my-4" />
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{caseData.description}</p>
                  </div>
                )}

                {caseData.notes && (
                  <div>
                    <Separator className="my-4" />
                    <p className="text-sm text-muted-foreground mb-2">Internal Notes</p>
                    <p className="text-sm">{caseData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Linked Evidence ({evidence.length})</CardTitle>
                <Button size="sm" onClick={() => setShowLinkModal(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Link Evidence
                </Button>
              </CardHeader>
              <CardContent>
                {evidence.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No evidence linked to this case yet
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowLinkModal(true)}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Link First Evidence
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evidence.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className="flex-1"
                              onClick={() => navigate(`/bag/${item.evidence_bags.bag_id}`)}
                            >
                              <p className="font-mono font-semibold">
                                {item.evidence_bags.bag_id}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {item.evidence_bags.type.replace('_', ' ')}
                              </p>
                              <p className="text-sm mt-1 line-clamp-1">
                                {item.evidence_bags.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <StatusBadge status={item.evidence_bags.current_status} />
                                <span className="text-xs text-muted-foreground">
                                  Linked {new Date(item.linked_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUnlinkBagId(item.bag_id);
                              }}
                            >
                              Unlink
                            </Button>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                              Note: {item.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <LinkEvidenceModal
        open={showLinkModal}
        onOpenChange={setShowLinkModal}
        caseId={caseId!}
        onSuccess={loadCaseData}
      />

      <AlertDialog open={!!unlinkBagId} onOpenChange={() => setUnlinkBagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Evidence?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this evidence from the case? This action can be reversed by linking it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink}>Unlink</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}