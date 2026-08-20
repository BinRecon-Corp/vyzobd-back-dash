import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRefundById, approveRefund, rejectRefund } from "../../../services/refund.service";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ArrowLeft, Check, X } from "lucide-react";

export function RefundDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  
  const { data: refund, isLoading } = useQuery({
    queryKey: ["refund", id],
    queryFn: () => getRefundById(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveRefund(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["refund", id] })
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectRefund(id!, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["refund", id] })
  });

  if (isLoading) return <LoadingSpinner />;
  if (!refund) return <div>Refund not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/refunds">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Refund Details</h2>
          <p className="text-muted-foreground">ID: {refund.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Refund Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="font-medium">৳{refund.amount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">{refund.status}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Reason</p>
              <p className="font-medium">{refund.reason || 'No reason provided'}</p>
            </div>
          </div>
          
          {refund.status === 'PENDING' && (
            <div className="pt-4 border-t flex items-center gap-2">
              <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending} variant="destructive" className="flex-1">
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Context</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Order ID</p>
              <Link to={`/admin/orders/${refund.orderId}`} className="font-medium text-primary hover:underline">
                {refund.orderId?.split("-")[0]}
              </Link>
            </div>
            <div>
              <p className="text-muted-foreground">Payment ID</p>
              <Link to={`/admin/payments/${refund.paymentId}`} className="font-medium text-primary hover:underline">
                {refund.paymentId?.split("-")[0]}
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
