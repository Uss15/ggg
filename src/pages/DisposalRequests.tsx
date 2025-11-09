import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, Trash2, FileText, User, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import { getDisposalRequests, reviewDisposalRequest } from "@/lib/supabase-enhanced";
import { toast } from "sonner";
import { logError, sanitizeError } from "@/lib/errors";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-base font-mono mb-1">
              {request.evidence_bags?.bag_id}
            </CardTitle>
            <CardDescription className="capitalize text-xs">
              {request.evidence_bags?.type?.replace('_', ' ')}
            </CardDescription>
          </div>
          <Badge 
            variant={
              request.status === 'pending' ? 'default' :
              request.status === 'approved' ? 'default' :
              'destructive'
            }
            className={
              request.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' :
              request.status === 'approved' ? 'bg-green-500 hover:bg-green-600' :
              ''
            }
          >
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-start gap-2">
            <Trash2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Disposal Method</p>
              <p className="text-sm font-medium">
                {methodLabels[request.disposal_type as keyof typeof methodLabels]}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Reason</p>
              <p className="text-sm break-words">{request.reason}</p>
            </div>
          </div>

          {request.witness1_name && (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Witness</p>
                <p className="text-sm">{request.witness1_name}</p>
              </div>
            </div>
          )}

          {request.disposal_documentation && (
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Documentation</p>
                <a
                  href={request.disposal_documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Document
                </a>
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Requested By</p>
                <p className="text-sm font-medium">
                  {request.requester?.full_name || 'Unknown User'}
                  {request.requester?.badge_number && (
                    <span className="text-muted-foreground text-xs ml-2">
                      Badge: {request.requester.badge_number}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.requested_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {request.status !== 'pending' && (
            <div className="pt-2 border-t">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {request.status === 'approved' ? 'Approved By' : 'Rejected By'}
                  </p>
                  <p className="text-sm font-medium">
                    {request.approver?.full_name || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {request.approved_at && new Date(request.approved_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {request.notes && (
                <div className="mt-3 p-2 bg-muted/50 rounded-md">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{request.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {request.status === 'pending' && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setReviewingRequest(request)}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Review Request
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Disposal Requests</h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadRequests}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-muted-foreground">
            Review and manage evidence disposal requests
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved
              {approvedRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {approvedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
              {rejectedRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {rejectedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading requests...</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  No pending disposal requests. All submitted requests have been reviewed.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pendingRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedRequests.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  No approved disposal requests yet.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {approvedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejectedRequests.length === 0 ? (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  No rejected disposal requests.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rejectedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!reviewingRequest} onOpenChange={() => setReviewingRequest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Disposal Request</DialogTitle>
          </DialogHeader>

          {reviewingRequest && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Carefully review all details before approving or rejecting this disposal request.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Evidence Bag</p>
                  <p className="text-sm font-mono font-medium">
                    {reviewingRequest.evidence_bags?.bag_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Disposal Method</p>
                  <p className="text-sm font-medium">
                    {methodLabels[reviewingRequest.disposal_type as keyof typeof methodLabels]}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Reason</p>
                  <p className="text-sm">{reviewingRequest.reason}</p>
                </div>

                {reviewingRequest.witness1_name && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Witness</p>
                    <p className="text-sm">{reviewingRequest.witness1_name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_notes">Review Notes (Optional)</Label>
                <Textarea
                  id="review_notes"
                  placeholder="Add notes about your decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setReviewingRequest(null);
                setReviewNotes("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
            <Button
              onClick={() => handleReview(true)}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}