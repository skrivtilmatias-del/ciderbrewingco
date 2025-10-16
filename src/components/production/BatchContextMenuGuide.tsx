import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  MousePointer2,
  Smartphone,
  Keyboard,
  ListChecks,
  FileText,
  Eye,
  QrCode,
  Printer,
  Download,
  Copy,
  FileStack,
  Archive,
  FileDown,
  Wine,
  BarChart3,
  History,
} from "lucide-react";

export const BatchContextMenuGuide = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          Context Menu Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Context Menu Guide</DialogTitle>
          <DialogDescription>
            Learn how to use the powerful right-click context menu for batch management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* How to Access */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MousePointer2 className="w-5 h-5" />
              How to Access
            </h3>
            <div className="grid gap-3">
              <Card className="p-3">
                <div className="flex items-start gap-3">
                  <MousePointer2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Desktop: Right-Click</p>
                    <p className="text-sm text-muted-foreground">
                      Right-click anywhere on a batch card to open the context menu
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Mobile: Long Press</p>
                    <p className="text-sm text-muted-foreground">
                      Press and hold on a batch card for 200ms to trigger the menu
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-start gap-3">
                  <Keyboard className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Keyboard Shortcuts</p>
                    <p className="text-sm text-muted-foreground">
                      Use keyboard shortcuts when a batch is selected
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <ActionItem
                icon={ListChecks}
                title="Update Stage"
                shortcut="U"
                description="Change batch to any production stage"
              />
              <ActionItem
                icon={FileText}
                title="Add Note"
                shortcut="N"
                description="Quickly add a note to the batch"
              />
              <ActionItem
                icon={Eye}
                title="View Details"
                shortcut="Enter"
                description="Open batch details panel"
              />
              <ActionItem
                icon={QrCode}
                title="View QR Code"
                shortcut="Q"
                description="Display batch QR code for scanning"
              />
            </div>
          </div>

          {/* Label Actions */}
          <div>
            <h3 className="font-semibold mb-3">Label Actions</h3>
            <div className="space-y-2">
              <ActionItem
                icon={Printer}
                title="Print Label"
                shortcut="Ctrl+P"
                description="Open print dialog for batch labels"
              />
              <ActionItem
                icon={Download}
                title="Download QR Code"
                shortcut="Ctrl+D"
                description="Save QR code as PNG image"
              />
              <ActionItem
                icon={Copy}
                title="Copy Batch ID"
                shortcut="Ctrl+C"
                description="Copy unique batch identifier"
              />
              <ActionItem
                icon={Copy}
                title="Copy Batch URL"
                shortcut="Ctrl+Shift+C"
                description="Copy shareable batch URL"
              />
            </div>
          </div>

          {/* Management */}
          <div>
            <h3 className="font-semibold mb-3">Management</h3>
            <div className="space-y-2">
              <ActionItem
                icon={FileStack}
                title="Clone Batch"
                shortcut="Ctrl+Shift+D"
                description="Create a copy with pre-filled data"
              />
              <ActionItem
                icon={Archive}
                title="Archive Batch"
                shortcut="Del"
                description="Archive batch with confirmation"
              />
              <ActionItem
                icon={FileDown}
                title="Export Data"
                shortcut="Ctrl+E"
                description="Download batch data as CSV"
              />
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-3">Navigation</h3>
            <div className="space-y-2">
              <ActionItem
                icon={Wine}
                title="Go to Blending"
                description="Navigate to blending tab"
              />
              <ActionItem
                icon={BarChart3}
                title="View Analytics"
                description="View batch-specific analytics"
              />
              <ActionItem
                icon={History}
                title="View History"
                description="Open activity log for this batch"
              />
            </div>
          </div>

          {/* Pro Tips */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              💡 Pro Tips
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• Keyboard shortcuts work when a batch is selected in the list</li>
              <li>• Long press includes haptic feedback on supported devices</li>
              <li>• Context menu automatically positions to avoid screen edges</li>
              <li>• Archived batches have limited actions (view-only)</li>
              <li>• Most destructive actions require confirmation</li>
            </ul>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ActionItemProps {
  icon: React.ElementType;
  title: string;
  shortcut?: string;
  description: string;
}

const ActionItem = ({ icon: Icon, title, shortcut, description }: ActionItemProps) => (
  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
    <Icon className="w-4 h-4 text-primary mt-0.5" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-medium text-sm">{title}</p>
        {shortcut && (
          <Badge variant="outline" className="text-xs">
            {shortcut}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);
