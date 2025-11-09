import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";
import { getDisposalRequests, reviewDisposalRequest } from "@/lib/supabase-enhanced";
import { toast } from "sonner";
import { logError, sanitizeError } from "@/lib/errors";

const methodLabels = {
  released: "Released to Owner",
  destroyed: "Destroyed",
  returned: "Returned to Court"
};

export default function DisposalRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingRequest, setReviewingRequest] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await getDisposalRequests();
      setRequests(data || []);
    } catch (error) {
      logError('LoadDisposalRequests', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (approved: boolean) => {
    if (!reviewingRequest) return;

    try {
      setIsSubmitting(true);
      await reviewDisposalRequest(
        reviewingRequest.id,
        approved,
        reviewNotes || undefined
      );
      toast.success(`Disposal request ${approved ? 'approved' : 'rejected'}`);
      loadRequests();
      setReviewingRequest(null);
      setReviewNotes("");
    } catch (error) {
      logError('ReviewDisposal', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const RequestCard = ({ request }: { request: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-mono">
              {request.evidence_bags?.bag_id}
            </CardTitle>
            <p className="text-sm text-muted-foreground capitalize">
              {request.evidence_bags?.type?.replace('_', ' ')}
            </p>
          </div>
          <Badge 
            variant={
              request.status === 'pending' ? 'default' :
              request.status === 'approved' ? 'default' :
              'destructive'
            }
            className={
              request.status === 'pending' ? 'bg-yellow-500' :
              request.status === 'approved' ? 'bg-green-500' :
              'bg-red-500'
            }
          >
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Disposal Method</p>
          <p className="text-sm text-muted-foreground">
            {methodLabels[request.disposal_type as keyof typeof methodLabels]}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium">Reason</p>
          <p className="text-sm text-muted-foreground">{request.reason}</p>
        </div>

        {request.witness_name && (
          <div>
            <p className="text-sm font-medium">Witness</p>
            <p className="text-sm text-muted-foreground">{request.witness_name}</p>
          </div>
        )}

        {request.documentation_url && (
          <div>
            <p className="text-sm font-medium">Documentation</p>
            <a
              href={request.documentation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View Document
            </a>
          </div>
        )}

        <div>
          <p className="text-sm font-medium">Requested By</p>
          <p className="text-sm text-muted-foreground">
            {request.requester?.full_name} 
            {request.requester?.badge_number && ` (Badge: ${request.requester.badge_number})`}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(request.requested_at).toLocaleString()}
          </p>
        </div>

        {request.status !== 'pending' && (
          <>
            <div>
              <p className="text-sm font-medium">Approved By</p>
              <p className="text-sm text-muted-foreground">
                {request.approver?.full_name || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground">
                {request.approved_at && new Date(request.approved_at).toLocaleString()}
              </p>
            </div>

            {request.notes && (
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground">{request.notes}</p>
              </div>
            )}
          </>
        )}

        {request.status === 'pending' && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setReviewingRequest(request)}
          >
            Review Request
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Disposal Requests</h1>
          <p className="text-muted-foreground">
            Review and approve evidence disposal requests
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading requests...</p>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending disposal requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No approved disposal requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {approvedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejectedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No rejected disposal requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rejectedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!reviewingRequest} onOpenChange={() => setReviewingRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Disposal Request</DialogTitle>
          </DialogHeader>

          {reviewingRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Evidence Bag</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {reviewingRequest.evidence_bags?.bag_id}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Disposal Method</p>
                <p className="text-sm text-muted-foreground">
                  {methodLabels[reviewingRequest.disposal_type as keyof typeof methodLabels]}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Reason</p>
                <p className="text-sm text-muted-foreground">{reviewingRequest.reason}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_notes">Review Notes (Optional)</Label>
                <Textarea
                  id="review_notes"
                  placeholder="Add notes about your decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setReviewingRequest(null);
                setReviewNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview(false)}
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleReview(true)}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}