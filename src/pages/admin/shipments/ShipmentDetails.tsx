import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShipmentById, updateShipmentStatus } from "../../../services/shipment.service";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ArrowLeft, Truck, CheckCircle } from "lucide-react";

export function ShipmentDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  
  const { data: shipment, isLoading } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => getShipmentById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (vars: {status: string, trackingInfo?: any}) => updateShipmentStatus(id!, vars.status, vars.trackingInfo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shipment", id] })
  });

  if (isLoading) return <LoadingSpinner />;
  if (!shipment) return <div>Shipment not found.</div>;

  const handleShip = () => {
    updateMutation.mutate({
      status: 'SHIPPED',
      trackingInfo: { trackingNumber, courier }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/shipments">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Shipment Details</h2>
          <p className="text-muted-foreground">ID: {shipment.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Tracking Info</h3>
          {shipment.status === 'PENDING' ? (
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Courier Name</label>
                <Input value={courier} onChange={e => setCourier(e.target.value)} placeholder="e.g. FedEx, UPS" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tracking Number</label>
                <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Tracking code" />
              </div>
              <Button onClick={handleShip} disabled={updateMutation.isPending || !trackingNumber || !courier} className="w-full">
                <Truck className="w-4 h-4 mr-2" /> Mark as Shipped
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm pt-4">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium text-lg">{shipment.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Courier</p>
                <p className="font-medium text-lg">{shipment.courier || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Tracking Number</p>
                <p className="font-medium text-lg font-mono">{shipment.trackingNumber || 'N/A'}</p>
              </div>
            </div>
          )}
          
          {shipment.status === 'SHIPPED' && (
             <Button onClick={() => updateMutation.mutate({status: 'DELIVERED'})} disabled={updateMutation.isPending} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
               <CheckCircle className="w-4 h-4 mr-2" /> Mark as Delivered
             </Button>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Context</h3>
          <div className="grid grid-cols-2 gap-4 text-sm pt-4">
            <div>
              <p className="text-muted-foreground">Order ID</p>
              <Link to={`/admin/orders/${shipment.orderId}`} className="font-medium text-primary hover:underline">
                {shipment.orderId?.split("-")[0]}
              </Link>
            </div>
            <div>
              <p className="text-muted-foreground">Created At</p>
              <p className="font-medium">{new Date(shipment.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
