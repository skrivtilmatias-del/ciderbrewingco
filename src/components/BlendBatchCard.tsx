import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wine, Trash2 } from "lucide-react";

interface BlendComponent {
  id: string;
  source_batch_id: string;
  batch_name: string;
  percentage: number | null;
  volume_liters: number | null;
}

interface BlendBatch {
  id: string;
  name: string;
  total_volume: number;
  notes: string | null;
  created_at: string;
  components: BlendComponent[];
}

interface BlendBatchCardProps {
  blend: BlendBatch;
  onDelete: (id: string) => void;
  onClick: (blend: BlendBatch) => void;
}

export function BlendBatchCard({ blend, onDelete, onClick }: BlendBatchCardProps) {
  return (
    <Card className="cursor-pointer hover:border-primary transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2" onClick={() => onClick(blend)}>
            <Wine className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">{blend.name}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(blend.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent onClick={() => onClick(blend)}>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Volume:</span>
            <span className="font-medium">{blend.total_volume}L</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Components:</p>
            <div className="flex flex-wrap gap-2">
              {blend.components.map((comp) => (
                <Badge key={comp.id} variant="secondary" className="text-xs">
                  {comp.batch_name}
                  {comp.percentage ? ` (${comp.percentage}%)` : ''}
                  {comp.volume_liters ? ` (${comp.volume_liters}L)` : ''}
                </Badge>
              ))}
            </div>
          </div>
          
          {blend.notes && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground line-clamp-2">{blend.notes}</p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Created: {new Date(blend.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
