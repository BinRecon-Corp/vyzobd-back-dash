import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markAsRead } from "../../../services/notification.service";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { Bell, Check, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";

export function NotificationsList() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => getNotifications({ page, limit: 10 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">System alerts and messages.</p>
        </div>
      </div>

      <Card className="divide-y">
        {data?.data?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No notifications found.
          </div>
        )}
        {data?.data?.map((notification: any) => (
          <div key={notification.id} className={cn(
            "p-4 flex items-start gap-4 transition-colors hover:bg-muted/50",
            !notification.isRead && "bg-muted/20"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full mt-2 shrink-0",
              !notification.isRead ? "bg-primary" : "bg-transparent"
            )} />
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-sm">{notification.title}</p>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
            </div>
            {!notification.isRead && (
              <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate(notification.id)} disabled={markReadMutation.isPending}>
                <Check className="w-4 h-4 mr-2" /> Mark Read
              </Button>
            )}
          </div>
        ))}
        
        <div className="p-4 flex items-center justify-between border-t">
          <p className="text-sm text-muted-foreground">
            Page {page} of {data?.pagination?.totalPages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (data?.pagination?.totalPages || 1)}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
