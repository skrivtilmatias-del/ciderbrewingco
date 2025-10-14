import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface WebhookLogsProps {
  configId: string;
}

export function WebhookLogs({ configId }: WebhookLogsProps) {
  const { data: logs } = useQuery({
    queryKey: ["webhook-logs", configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_logs")
        .select("*")
        .eq("webhook_config_id", configId)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">No delivery logs yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recent Deliveries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => {
            const status = log.delivered_at
              ? "delivered"
              : log.failed_at
              ? "failed"
              : "pending";

            return (
              <div
                key={log.id}
                className="flex justify-between items-start p-3 border rounded-lg text-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {status === "delivered" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {status === "failed" && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {status === "pending" && (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="font-medium">{log.event_type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                  </p>
                  {log.response_status && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Status: {log.response_status}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {status === "delivered" && (
                    <Badge variant="default" className="text-xs">Delivered</Badge>
                  )}
                  {status === "failed" && (
                    <Badge variant="destructive" className="text-xs">Failed</Badge>
                  )}
                  {status === "pending" && (
                    <Badge variant="secondary" className="text-xs">
                      Retry {log.attempt_count}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}