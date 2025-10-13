import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wine, Calendar, MapPin, Star, User, Droplet, FlaskConical, Thermometer, TestTube, Apple, Beaker } from "lucide-react";
import { toast } from "sonner";

interface BatchDetails {
  id: string;
  name: string;
  variety: string;
  apple_origin: string | null;
  apple_mix: string | null;
  style: string | null;
  volume: number;
  yeast_type: string | null;
  target_og: number | null;
  target_fg: number | null;
  target_ph: number | null;
  target_end_ph: number | null;
  target_ta: number | null;
  current_stage: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}

interface BlendComponent {
  id: string;
  batch_name: string;
  batch_variety: string;
  percentage: number | null;
  volume_liters: number | null;
  batch_details: BatchDetails | null;
}

interface TastingAnalysis {
  id: string;
  created_at: string;
  taste: string | null;
  colour: string | null;
  palate: string | null;
  overall_score: number | null;
  notes: string | null;
  taster_name: string;
}

interface BlendData {
  id: string;
  name: string;
  total_volume: number;
  notes: string | null;
  created_at: string;
  bottles_75cl: number;
  bottles_150cl: number;
  storage_location: string | null;
  attachments: string[] | null;
  components: BlendComponent[];
}

export default function PublicBlend() {
  const { id } = useParams<{ id: string }>();
  const [blend, setBlend] = useState<BlendData | null>(null);
  const [tastings, setTastings] = useState<TastingAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBlendData();
    }
  }, [id]);

  const fetchBlendData = async () => {
    try {
      setLoading(true);

      // Fetch blend batch data
      const { data: blendData, error: blendError } = await supabase
        .from("blend_batches")
        .select("*")
        .eq("id", id)
        .single();

      if (blendError) throw blendError;

      // Fetch components with full batch details
      const { data: componentsData, error: componentsError } = await supabase
        .from("blend_components")
        .select(`
          id,
          percentage,
          volume_liters,
          source_batch_id
        `)
        .eq("blend_batch_id", id);

      if (componentsError) throw componentsError;

      // Fetch detailed batch information for each component
      const batchIds = componentsData.map((comp: any) => comp.source_batch_id);
      const { data: batchesData, error: batchesError } = await supabase
        .from("batches")
        .select("*")
        .in("id", batchIds);

      if (batchesError) throw batchesError;

      const batchesMap = new Map(batchesData.map((batch: any) => [batch.id, batch]));

      const components = componentsData.map((comp: any) => {
        const batch = batchesMap.get(comp.source_batch_id);
        return {
          id: comp.id,
          batch_name: batch?.name || "Unknown",
          batch_variety: batch?.variety || "",
          percentage: comp.percentage,
          volume_liters: comp.volume_liters,
          batch_details: batch || null,
        };
      });

      setBlend({
        ...blendData,
        components,
      });

      // Fetch tasting analyses
      const { data: tastingData, error: tastingError } = await supabase
        .from("tasting_analysis")
        .select(`
          id,
          created_at,
          taste,
          colour,
          palate,
          overall_score,
          notes,
          user_id
        `)
        .eq("blend_batch_id", id)
        .order("created_at", { ascending: false });

      if (tastingError) throw tastingError;

      // Fetch user profiles for taster names
      const userIds = [...new Set(tastingData.map((t: any) => t.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p.full_name]) || []);

      const formattedTastings = tastingData.map((analysis: any) => ({
        id: analysis.id,
        created_at: analysis.created_at,
        taste: analysis.taste,
        colour: analysis.colour,
        palate: analysis.palate,
        overall_score: analysis.overall_score,
        notes: analysis.notes,
        taster_name: profilesMap.get(analysis.user_id) || "Anonymous",
      }));

      setTastings(formattedTastings);
    } catch (error: any) {
      console.error("Error fetching blend data:", error);
      toast.error("Failed to load blend data");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score: number | null) => {
    if (!score) return null;
    const normalizedScore = score / 20;
    const fullStars = Math.floor(normalizedScore);
    const hasHalfStar = normalizedScore % 1 >= 0.5;

    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? "fill-primary text-primary"
                : i === fullStars && hasHalfStar
                ? "fill-primary/50 text-primary"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const averageScore = tastings.length > 0
    ? tastings.reduce((sum, t) => sum + (t.overall_score || 0), 0) / tastings.length
    : null;

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Wine className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto animate-pulse" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading blend details...</p>
        </div>
      </div>
    );
  }

  if (!blend) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Wine className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto" />
          <h1 className="text-xl sm:text-2xl font-bold">Blend Not Found</h1>
          <p className="text-sm sm:text-base text-muted-foreground">The blend you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Wine className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">{blend.name}</h1>
          </div>
          {averageScore && (
            <div className="flex items-center gap-2">
              {renderStars(averageScore)}
              <span className="text-sm text-muted-foreground">
                ({tastings.length} {tastings.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Volume</p>
              <p className="text-3xl font-bold">{blend.total_volume}L</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Bottles (75cl)</p>
              <p className="text-3xl font-bold">{blend.bottles_75cl || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Bottles (150cl)</p>
              <p className="text-3xl font-bold">{blend.bottles_150cl || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Storage Location */}
        {blend.storage_location && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Storage Location</p>
              </div>
              <p className="text-lg font-medium">{blend.storage_location}</p>
            </CardContent>
          </Card>
        )}

        {/* Components - Detailed View */}
        <div className="mb-8 space-y-6">
          <h2 className="text-2xl font-bold">Blend Components</h2>
          {blend.components.map((component, index) => (
            <Card key={component.id}>
              <CardContent className="p-6">
                {/* Component Header */}
                <div className="flex items-start justify-between mb-6 pb-4 border-b">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{component.batch_name}</h3>
                    <p className="text-muted-foreground">{component.batch_variety}</p>
                  </div>
                  <div className="flex gap-2">
                    {component.percentage !== null && (
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {component.percentage}%
                      </Badge>
                    )}
                    {component.volume_liters !== null && (
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {component.volume_liters}L
                      </Badge>
                    )}
                  </div>
                </div>

                {component.batch_details && (
                  <div className="space-y-6">
                    {/* Apple & Origin Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {component.batch_details.apple_origin && (
                        <div className="flex items-start gap-3">
                          <Apple className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Origin</p>
                            <p className="font-medium">{component.batch_details.apple_origin}</p>
                          </div>
                        </div>
                      )}
                      {component.batch_details.apple_mix && (
                        <div className="flex items-start gap-3">
                          <Apple className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Apple Mix</p>
                            <p className="font-medium">{component.batch_details.apple_mix}</p>
                          </div>
                        </div>
                      )}
                      {component.batch_details.style && (
                        <div className="flex items-start gap-3">
                          <Wine className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Style</p>
                            <p className="font-medium">{component.batch_details.style}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Production Details */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                        Production Details
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-start gap-2">
                          <Droplet className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Volume</p>
                            <p className="font-medium">{component.batch_details.volume}L</p>
                          </div>
                        </div>
                        {component.batch_details.yeast_type && (
                          <div className="flex items-start gap-2">
                            <Beaker className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Yeast</p>
                              <p className="font-medium text-sm">{component.batch_details.yeast_type}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <FlaskConical className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Stage</p>
                            <Badge variant="outline" className="mt-0.5">
                              {component.batch_details.current_stage}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Started</p>
                            <p className="font-medium text-sm">
                              {new Date(component.batch_details.started_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Target Parameters */}
                    {(component.batch_details.target_og || 
                      component.batch_details.target_fg || 
                      component.batch_details.target_ph ||
                      component.batch_details.target_end_ph ||
                      component.batch_details.target_ta) && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                          Target Parameters
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {component.batch_details.target_og && (
                            <div className="flex items-start gap-2">
                              <TestTube className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground">Target OG</p>
                                <p className="font-medium">{component.batch_details.target_og}</p>
                              </div>
                            </div>
                          )}
                          {component.batch_details.target_fg && (
                            <div className="flex items-start gap-2">
                              <TestTube className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground">Target FG</p>
                                <p className="font-medium">{component.batch_details.target_fg}</p>
                              </div>
                            </div>
                          )}
                          {component.batch_details.target_ph && (
                            <div className="flex items-start gap-2">
                              <TestTube className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground">Target pH</p>
                                <p className="font-medium">{component.batch_details.target_ph}</p>
                              </div>
                            </div>
                          )}
                          {component.batch_details.target_end_ph && (
                            <div className="flex items-start gap-2">
                              <TestTube className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground">Target End pH</p>
                                <p className="font-medium">{component.batch_details.target_end_ph}</p>
                              </div>
                            </div>
                          )}
                          {component.batch_details.target_ta && (
                            <div className="flex items-start gap-2">
                              <TestTube className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground">Target TA</p>
                                <p className="font-medium">{component.batch_details.target_ta}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Batch Notes */}
                    {component.batch_details.notes && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                          Batch Notes
                        </h4>
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {component.batch_details.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Production Notes */}
        {blend.notes && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Production Notes</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">{blend.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Tasting Notes */}
        {tastings.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Tasting Notes</h2>
              <div className="space-y-4">
                {tastings.map((tasting) => (
                  <div key={tasting.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{tasting.taster_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(tasting.overall_score)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(tasting.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      {tasting.colour && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Colour</p>
                          <p className="text-sm">{tasting.colour}</p>
                        </div>
                      )}
                      {tasting.taste && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Taste</p>
                          <p className="text-sm">{tasting.taste}</p>
                        </div>
                      )}
                      {tasting.palate && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Palate</p>
                          <p className="text-sm">{tasting.palate}</p>
                        </div>
                      )}
                    </div>

                    {tasting.notes && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm whitespace-pre-wrap">{tasting.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images */}
        {blend.attachments && blend.attachments.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {blend.attachments.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${blend.name} - Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Created Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Created: {new Date(blend.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
