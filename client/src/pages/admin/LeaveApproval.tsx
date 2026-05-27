import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { toast } from "sonner";

export default function LeaveApproval() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");

  const { data: requests = [], refetch } = trpc.leave.getAllRequests.useQuery();
  const approveMutation = trpc.leave.approveRequest.useMutation();
  const rejectMutation = trpc.leave.rejectRequest.useMutation();

  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync({
        requestId: id,
        approvalNotes,
      });
      toast.success("Leave request approved");
      setSelectedId(null);
      setApprovalNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve request");
    }
  };

  const handleReject = async (id: number) => {
    if (!approvalNotes) {
      toast.error("Please provide rejection reason");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        requestId: id,
        approvalNotes,
      });
      toast.success("Leave request rejected");
      setSelectedId(null);
      setApprovalNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leave Request Approvals</h1>
          <p className="text-muted-foreground mt-1">Review and approve employee leave requests</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-green-600">{approvedRequests.length}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-red-600">{rejectedRequests.length}</span>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-muted-foreground">No pending leave requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium capitalize">{request.leaveType} Leave</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.startDate), "MMM d, yyyy")} to{" "}
                          {format(new Date(request.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>

                    <p className="text-sm">{request.reason}</p>

                    <Dialog
                      open={selectedId === request.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setSelectedId(null);
                          setApprovalNotes("");
                        } else {
                          setSelectedId(request.id);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review Leave Request</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <p className="font-medium capitalize">{request.leaveType} Leave</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(request.startDate), "MMM d, yyyy")} to{" "}
                              {format(new Date(request.endDate), "MMM d, yyyy")}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-medium">Reason:</p>
                            <p className="text-sm text-muted-foreground">{request.reason}</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Approval Notes</label>
                            <Textarea
                              placeholder="Add any notes or conditions..."
                              value={approvalNotes}
                              onChange={(e) => setApprovalNotes(e.target.value)}
                              className="mt-1 min-h-20"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(request.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleReject(request.id)}
                              variant="destructive"
                              className="flex-1"
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approved Requests */}
        {approvedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approved Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {approvedRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium capitalize text-sm">{request.leaveType} Leave</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.startDate), "MMM d")} -{" "}
                        {format(new Date(request.endDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Approved</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rejected Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rejectedRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium capitalize text-sm">{request.leaveType} Leave</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.startDate), "MMM d")} -{" "}
                        {format(new Date(request.endDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
