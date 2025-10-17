import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MousePointer2, 
  Hand, 
  MoreVertical,
  Info
} from "lucide-react";

/**
 * BatchContextMenuGuide - Educational component showing how to use context menus
 * 
 * Shows tips for different interaction methods
 */
export const BatchContextMenuGuide = () => {
  return (
    <Card className="p-4 bg-muted/50 border-dashed">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="space-y-2 text-sm">
          <p className="font-medium">Quick Batch Actions</p>
          <div className="space-y-1.5 text-muted-foreground">
            <div className="flex items-center gap-2">
              <MousePointer2 className="w-4 h-4" />
              <span>
                <Badge variant="outline" className="mr-2">Desktop</Badge>
                Right-click on any batch card
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Hand className="w-4 h-4" />
              <span>
                <Badge variant="outline" className="mr-2">Mobile</Badge>
                Long-press on any batch card
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MoreVertical className="w-4 h-4" />
              <span>
                <Badge variant="outline" className="mr-2">Always</Badge>
                Click the three-dot menu button
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
