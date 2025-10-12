import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Award, Package, AlertCircle, Lightbulb, BarChart3, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Insight {
  title: string;
  description: string;
  type: "success" | "warning" | "info" | "recommendation";
  icon: string;
}

interface AIInsightsProps {
  batches: any[];
  blendBatches: any[];
  tastingAnalyses: any[];
}

const iconMap: Record<string, any> = {
  TrendingUp,
  Award,
  Package,
  AlertCircle,
  Lightbulb,
  BarChart3,
};

const typeStyles = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-primary/10 text-primary border-primary/20",
  recommendation: "bg-accent/10 text-accent border-accent/20",
};

export const AIInsights = ({ batches, blendBatches, tastingAnalyses }: AIInsightsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const analyzeProduction = async () => {
    if (batches.length === 0) {
      toast.error("No production data available to analyze");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-production", {
        body: {
          batches,
          blendBatches,
          tastingAnalyses,
        },
      });

      if (error) throw error;

      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
        setHasAnalyzed(true);
        toast.success("AI insights generated successfully");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Error analyzing production:", error);
      if (error.message?.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
      } else if (error.message?.includes("credits")) {
        toast.error("AI credits depleted. Please add credits to continue.");
      } else {
        toast.error("Failed to generate insights. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">AI Production Insights</h3>
            <p className="text-sm text-muted-foreground">
              Smart analysis of your cider production data
            </p>
          </div>
        </div>
        <Button 
          onClick={analyzeProduction} 
          disabled={loading || batches.length === 0}
          size="sm"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {hasAnalyzed ? "Refresh Insights" : "Generate Insights"}
            </>
          )}
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </Card>
          ))}
        </div>
      )}

      {!loading && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => {
            const IconComponent = iconMap[insight.icon] || Lightbulb;
            const style = typeStyles[insight.type] || typeStyles.info;
            
            return (
              <Card key={index} className={`p-6 border-2 ${style}`}>
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-background/50">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !hasAnalyzed && (
        <Card className="p-12 text-center border-dashed">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Click "Generate Insights" to get AI-powered analysis of your production data
          </p>
          <p className="text-sm text-muted-foreground">
            Our AI will analyze trends, quality patterns, and provide actionable recommendations
          </p>
        </Card>
      )}
    </div>
  );
};
