import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Webhook, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WebhookDialog } from "@/components/webhooks/WebhookDialog";
import { WebhookLogs } from "@/components/webhooks/WebhookLogs";
import { Badge } from "@/components/ui/badge";

export default function Webhooks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_configs")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["webhook-stats"],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from("webhook_logs")
        .select("delivered_at, failed_at");
      
      const total = logs?.length || 0;
      const delivered = logs?.filter(l => l.delivered_at).length || 0;
      const failed = logs?.filter(l => l.failed_at).length || 0;
      const pending = total - delivered - failed;

      return { total, delivered, failed, pending };
    },
  });

  const handleCreate = () => {
    setSelectedWebhook(null);
    setDialogOpen(true);
  };

  const handleEdit = (webhook: any) => {
    setSelectedWebhook(webhook);
    setDialogOpen(true);
  };

  const handleToggleActive = async (webhook: any) => {
    const { error } = await supabase
      .from("webhook_configs")
      .update({ is_active: !webhook.is_active })
      .eq("id", webhook.id);
    
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Webhooks</h1>
              <p className="text-muted-foreground mt-2">
                Automate workflows with outgoing webhooks
              </p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
              <Webhook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{webhooks?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.delivered || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.failed || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Webhooks List */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : webhooks && webhooks.length > 0 ? (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <div key={webhook.id}>
                    <div
                      className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedConfigId(webhook.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{webhook.name}</h3>
                          {webhook.is_active ? (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{webhook.endpoint_url}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {webhook.events.map((event: string) => (
                            <span key={event} className="text-xs px-2 py-1 rounded-full bg-muted">
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(webhook);
                          }}
                        >
                          {webhook.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(webhook);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    
                    {selectedConfigId === webhook.id && (
                      <div className="mt-2 pl-4">
                        <WebhookLogs configId={webhook.id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No webhooks configured yet. Add your first webhook to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Verify Webhook Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Each webhook request includes a signature for verification. Use this Node.js snippet:
            </p>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`import crypto from 'crypto';

function verifyWebhook(signatureHeader, secret, body, timestamp) {
  const sig = signatureHeader.replace('sha256=', '');
  const mac = crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${body}\`)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(sig, 'hex'),
    Buffer.from(mac, 'hex')
  );
}

// Usage in your webhook receiver:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-cider-signature'];
  const timestamp = req.headers['x-cider-timestamp'];
  const body = JSON.stringify(req.body);
  
  if (verifyWebhook(signature, 'your-secret', body, timestamp)) {
    // Webhook is authentic
    res.status(200).send('OK');
  } else {
    res.status(401).send('Invalid signature');
  }
});`}
            </pre>
          </CardContent>
        </Card>
      </div>

      <WebhookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        webhook={selectedWebhook}
      />
    </div>
  );
}