import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReturnById, approveReturn, rejectReturn, receiveReturn } from "../../../services/return.service";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ArrowLeft, Check, X, PackageCheck } from "lucide-react";

export function ReturnDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState("");
  
  const { data: rma, isLoading, isError } = useQuery({
    queryKey: ["return", id],
    queryFn: () => getReturnById(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveReturn(id!, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["return", id] });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectReturn(id!, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["return", id] });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    }
  });

  const receiveMutation = useMutation({
    mutationFn: () => receiveReturn(id!, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["return", id] });
      queryClient.invalidateQueries({ queryKey: ["returns"] });
    }
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !rma) return <div className="p-6">Return request not found.</div>;

  const isPending = approveMutation.isPending || rejectMutation.isPending || receiveMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/returns">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Return Details</h2>
          <p className="text-muted-foreground">RMA: {rma.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Return Reason & Notes</h3>
            <div className="space-y-2 text-sm mb-6">
              <p><span className="font-medium text-muted-foreground">Reason:</span> {rma.reason}</p>
              {rma.adminNotes && (
                <p><span className="font-medium text-muted-foreground">Admin Notes:</span> {rma.adminNotes}</p>
              )}
            </div>

            <h3 className="font-semibold text-lg mb-4">Return Items</h3>
            <div className="space-y-4">
              {rma.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.orderItem?.product?.name || `Item ${item.orderItemId.split("-")[0]}`}</p>
                    <p className="text-sm text-muted-foreground">Reason: {item.reason || rma.reason}</p>
                    <p className="text-sm text-muted-foreground">Condition: {item.condition || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Status & Actions</h3>
            <p className="font-semibold text-xl text-primary">{rma.status}</p>
            
            <div className="space-y-3 pt-4 border-t">
              <label className="text-xs font-medium text-muted-foreground block">Admin Notes (Optional)</label>
              <Input
                placeholder="Internal notes or rejection reason..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="text-sm"
              />

              {rma.status === 'REQUESTED' && (
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => approveMutation.mutate()}
                    disabled={isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve Return
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate()}
                    disabled={isPending}
                    variant="destructive"
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" /> Reject Return
                  </Button>
                </div>
              )}

              {rma.status === 'APPROVED' && (
                <Button
                  onClick={() => receiveMutation.mutate()}
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PackageCheck className="w-4 h-4 mr-2" /> Mark as Received & Restock
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Context</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Order ID</p>
                <Link to={`/orders`} className="font-medium text-primary hover:underline">
                  #{rma.orderId?.split("-")[0]}
                </Link>
              </div>
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">
                  {rma.customer?.email || rma.customerId?.split("-")[0]}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
