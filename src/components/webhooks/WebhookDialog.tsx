import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface WebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook?: any;
}

const AVAILABLE_EVENTS = [
  { id: "onBatchBottled", label: "Batch Bottled" },
  { id: "onBlendUpdated", label: "Blend Updated" },
  { id: "onLabelPrinted", label: "Label Printed" },
];

export function WebhookDialog({ open, onOpenChange, webhook }: WebhookDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: webhook?.name || "",
    endpoint_url: webhook?.endpoint_url || "",
    secret: webhook?.secret || crypto.randomUUID(),
    events: webhook?.events || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (webhook) {
        const { error } = await supabase
          .from("webhook_configs")
          .update(formData)
          .eq("id", webhook.id);
        
        if (error) throw error;
        toast.success("Webhook updated");
      } else {
        const { error } = await supabase
          .from("webhook_configs")
          .insert([{ ...formData, user_id: user.id }]);
        
        if (error) throw error;
        toast.success("Webhook created");
      }

      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{webhook ? "Edit Webhook" : "Add Webhook"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint_url">Endpoint URL *</Label>
            <Input
              id="endpoint_url"
              type="url"
              value={formData.endpoint_url}
              onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
              required
              placeholder="https://your-server.com/webhook"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret">Secret Key *</Label>
            <Input
              id="secret"
              value={formData.secret}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              required
              placeholder="Used to sign webhook requests"
            />
            <p className="text-xs text-muted-foreground">
              This secret is used to generate HMAC signatures for webhook verification
            </p>
          </div>

          <div className="space-y-2">
            <Label>Events *</Label>
            <div className="space-y-2">
              {AVAILABLE_EVENTS.map((event) => (
                <div key={event.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={event.id}
                    checked={formData.events.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                  />
                  <label
                    htmlFor={event.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {event.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || formData.events.length === 0}>
              {loading ? "Saving..." : webhook ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}