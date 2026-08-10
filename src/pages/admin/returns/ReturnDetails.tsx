import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReturnById, updateReturnStatus } from "../../../services/return.service";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ArrowLeft, Check, X, PackageCheck } from "lucide-react";

export function ReturnDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  const { data: rma, isLoading } = useQuery({
    queryKey: ["return", id],
    queryFn: () => getReturnById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updateReturnStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["return", id] })
  });

  if (isLoading) return <LoadingSpinner />;
  if (!rma) return <div>Return request not found.</div>;

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
            <h3 className="font-semibold text-lg mb-4">Return Items</h3>
            <div className="space-y-4">
              {rma.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">Item ID: {item.orderItemId.split("-")[0]}</p>
                    <p className="text-sm text-muted-foreground">Reason: {item.reason}</p>
                    <p className="text-sm text-muted-foreground">Condition: {item.condition}</p>
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
            <h3 className="font-semibold text-lg">Status</h3>
            <p className="font-medium text-lg">{rma.status}</p>
            
            <div className="space-y-2 pt-4 border-t">
              {rma.status === 'REQUESTED' && (
                <>
                  <Button onClick={() => updateStatusMutation.mutate('APPROVED')} disabled={updateStatusMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button onClick={() => updateStatusMutation.mutate('REJECTED')} disabled={updateStatusMutation.isPending} variant="destructive" className="w-full">
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </>
              )}
              {rma.status === 'APPROVED' && (
                <Button onClick={() => updateStatusMutation.mutate('RECEIVED')} disabled={updateStatusMutation.isPending} className="w-full">
                  <PackageCheck className="w-4 h-4 mr-2" /> Mark as Received
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Context</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Order ID</p>
                <Link to={`/admin/orders/${rma.orderId}`} className="font-medium text-primary hover:underline">
                  {rma.orderId?.split("-")[0]}
                </Link>
              </div>
              <div>
                <p className="text-muted-foreground">Customer</p>
                <Link to={`/admin/customers/${rma.customerId}`} className="font-medium text-primary hover:underline">
                  {rma.customer?.email || rma.customerId?.split("-")[0]}
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
