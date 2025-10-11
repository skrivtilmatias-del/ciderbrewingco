import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wine, Trash2, Edit } from "lucide-react";

interface TastingAnalysis {
  id: string;
  blend_batch_id: string;
  blend_name: string;
  taste: string | null;
  colour: string | null;
  palate: string | null;
  overall_score: number | null;
  notes: string | null;
  created_at: string;
}

interface TastingAnalysisCardProps {
  analysis: TastingAnalysis;
  onDelete: (id: string) => void;
  onEdit: (analysis: TastingAnalysis) => void;
}

export function TastingAnalysisCard({ analysis, onDelete, onEdit }: TastingAnalysisCardProps) {
  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-info";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Wine className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">{analysis.blend_name}</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(analysis)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(analysis.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Score */}
          {analysis.overall_score !== null && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Overall Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                {analysis.overall_score}/100
              </span>
            </div>
          )}

          {/* Tasting Notes Grid */}
          <div className="grid grid-cols-1 gap-3">
            {analysis.colour && (
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Colour</Badge>
                <p className="text-sm text-muted-foreground">{analysis.colour}</p>
              </div>
            )}
            
            {analysis.taste && (
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Taste</Badge>
                <p className="text-sm text-muted-foreground">{analysis.taste}</p>
              </div>
            )}
            
            {analysis.palate && (
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Palate</Badge>
                <p className="text-sm text-muted-foreground">{analysis.palate}</p>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          {analysis.notes && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-muted-foreground line-clamp-3">{analysis.notes}</p>
            </div>
          )}

          {/* Date */}
          <div className="text-xs text-muted-foreground pt-2">
            Tasted: {new Date(analysis.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
