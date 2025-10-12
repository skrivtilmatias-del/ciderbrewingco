import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { z } from "zod";

const APPEARANCE_DESCRIPTORS = [
  "brilliant", "clear", "slightly hazy", "cloudy", "sedimented", "pale straw", 
  "golden", "amber", "deep gold", "copper", "brownish", "still", "slightly sparkling", 
  "fine mousse", "persistent bubbles", "viscosity", "legs", "natural sediment", "foam retention"
];

const AROMA_DESCRIPTORS = [
  "fresh apple", "baked apple", "pear", "quince", "stone fruit", "apricot", "peach", 
  "citrus", "lemon", "orange zest", "red berries", "pineapple", "tropical fruit", 
  "blossom", "elderflower", "honeysuckle", "herbal", "hay", "cut grass", "yeasty", 
  "bready", "doughy", "brioche", "buttery", "nutty", "honey", "caramel", "toffee", 
  "vanilla", "spicy", "clove", "cinnamon", "woody", "oak", "smoky", "earthy", "funky", 
  "farmyard", "barnyard", "leather", "wet wool", "brettanomyces", "horse blanket", 
  "vinegar", "sulphur"
];

const PALATE_DESCRIPTORS = [
  "dry", "off-dry", "medium", "sweet", "crisp", "sharp", "tangy", "lively", "balanced", 
  "round", "refreshing", "tart green apple", "lemon-like acidity", "soft", "astringent", 
  "grippy", "smooth", "silky", "full-bodied", "light-bodied", "apple", "baked apple", 
  "oxidized apple", "pear", "citrus", "stone fruit", "tropical fruit", "honey", "caramel", 
  "toffee", "nuts", "buttery", "spicy", "earthy", "funky", "mineral", "clean", 
  "lingering", "bitter-sweet", "drying", "refreshing", "warm"
];

const tastingSchema = z.object({
  blend_batch_id: z.string().optional(),
  competitor_brand: z.string().optional(),
  taste: z.string().max(500, "Taste must be less than 500 characters").optional(),
  colour: z.string().max(500, "Colour must be less than 500 characters").optional(),
  palate: z.string().max(500, "Palate must be less than 500 characters").optional(),
  overall_score: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
  attachments: z.array(z.string()).optional(),
}).refine(
  (data) => data.blend_batch_id || data.competitor_brand,
  { message: "Either blend batch or competitor brand is required" }
);

interface BlendBatch {
  id: string;
  name: string;
}

interface TastingAnalysis {
  id: string;
  blend_batch_id: string | null;
  competitor_brand: string | null;
  taste: string | null;
  colour: string | null;
  palate: string | null;
  overall_score: number | null;
  notes: string | null;
  attachments?: string[];
}

interface TastingAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blendBatches: BlendBatch[];
  existingAnalysis?: TastingAnalysis | null;
  onSave: (data: z.infer<typeof tastingSchema>, analysisId?: string) => void;
}

export function TastingAnalysisDialog({ 
  open, 
  onOpenChange, 
  blendBatches,
  existingAnalysis,
  onSave 
}: TastingAnalysisDialogProps) {
  const [sourceType, setSourceType] = useState<"blend" | "competitor">("blend");
  const [blendBatchId, setBlendBatchId] = useState("");
  const [competitorBrand, setCompetitorBrand] = useState("");
  const [taste, setTaste] = useState("");
  const [colour, setColour] = useState("");
  const [palate, setPalate] = useState("");
  const [overallScore, setOverallScore] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (existingAnalysis) {
      if (existingAnalysis.blend_batch_id) {
        setSourceType("blend");
        setBlendBatchId(existingAnalysis.blend_batch_id);
        setCompetitorBrand("");
      } else if (existingAnalysis.competitor_brand) {
        setSourceType("competitor");
        setCompetitorBrand(existingAnalysis.competitor_brand);
        setBlendBatchId("");
      }
      setTaste(existingAnalysis.taste || "");
      setColour(existingAnalysis.colour || "");
      setPalate(existingAnalysis.palate || "");
      setOverallScore(existingAnalysis.overall_score?.toString() || "");
      setNotes(existingAnalysis.notes || "");
      setAttachments(existingAnalysis.attachments || []);
    } else {
      resetForm();
    }
  }, [existingAnalysis, open]);

  const resetForm = () => {
    setSourceType("blend");
    setBlendBatchId("");
    setCompetitorBrand("");
    setTaste("");
    setColour("");
    setPalate("");
    setOverallScore("");
    setNotes("");
    setAttachments([]);
    setErrors([]);
  };

  const addDescriptor = (field: 'colour' | 'taste' | 'palate', descriptor: string) => {
    const currentValue = field === 'colour' ? colour : field === 'taste' ? taste : palate;
    const setter = field === 'colour' ? setColour : field === 'taste' ? setTaste : setPalate;
    
    if (currentValue.trim()) {
      setter(currentValue + ", " + descriptor);
    } else {
      setter(descriptor);
    }
  };

  const handleSave = () => {
    setErrors([]);

    const validation = tastingSchema.safeParse({
      blend_batch_id: sourceType === "blend" ? blendBatchId : undefined,
      competitor_brand: sourceType === "competitor" ? competitorBrand.trim() : undefined,
      taste: taste.trim() || undefined,
      colour: colour.trim() || undefined,
      palate: palate.trim() || undefined,
      overall_score: overallScore ? parseFloat(overallScore) : undefined,
      notes: notes.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (!validation.success) {
      setErrors(validation.error.errors.map(e => e.message));
      return;
    }

    onSave(validation.data, existingAnalysis?.id);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <DialogHeader>
          <DialogTitle>
            {existingAnalysis ? "Edit Tasting Analysis" : "New Tasting Analysis"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive rounded p-3">
              {errors.map((error, i) => (
                <p key={i} className="text-sm text-destructive">{error}</p>
              ))}
            </div>
          )}

          <div>
            <Label>Tasting Source</Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={sourceType === "blend" ? "default" : "outline"}
                onClick={() => setSourceType("blend")}
                disabled={!!existingAnalysis}
                className="flex-1"
              >
                Blend Batch
              </Button>
              <Button
                type="button"
                variant={sourceType === "competitor" ? "default" : "outline"}
                onClick={() => setSourceType("competitor")}
                disabled={!!existingAnalysis}
                className="flex-1"
              >
                Competitor Brand
              </Button>
            </div>

            {sourceType === "blend" ? (
              (() => {
                const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isIOS) {
                  return (
                    <div className="relative">
                      <Label className="sr-only">Blend Batch</Label>
                      <select
                        value={blendBatchId}
                        onChange={(e) => setBlendBatchId(e.target.value)}
                        disabled={!!existingAnalysis}
                        className="h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="" disabled>Select blend batch</option>
                        {blendBatches.map((blend) => (
                          <option key={blend.id} value={blend.id}>{blend.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return (
                  <Select 
                    value={blendBatchId} 
                    onValueChange={setBlendBatchId}
                    disabled={!!existingAnalysis}
                  >
                    <SelectTrigger className="h-12 touch-manipulation">
                      <SelectValue placeholder="Select blend batch" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-card border-border pointer-events-auto max-h-[300px]">
                      {blendBatches.map((blend) => (
                        <SelectItem key={blend.id} value={blend.id} className="touch-manipulation min-h-[44px]">
                          {blend.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()
            ) : (
              <Input
                placeholder="Enter competitor brand name"
                value={competitorBrand}
                onChange={(e) => setCompetitorBrand(e.target.value)}
                disabled={!!existingAnalysis}
              />
            )}
          </div>

          <div>
            <Label htmlFor="colour">Appearance</Label>
            <div className="flex flex-wrap gap-1 mb-2 max-h-32 overflow-y-auto p-2 border border-border rounded-md bg-muted/30">
              {APPEARANCE_DESCRIPTORS.map((descriptor) => (
                <Badge
                  key={descriptor}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                  onClick={() => addDescriptor('colour', descriptor)}
                >
                  {descriptor}
                </Badge>
              ))}
            </div>
            <Textarea
              id="colour"
              value={colour}
              onChange={(e) => setColour(e.target.value)}
              placeholder="Describe the appearance, clarity, and colour..."
              rows={2}
              maxLength={500}
            />
          </div>

          <div>
            <Label htmlFor="taste">Aroma / Bouquet</Label>
            <div className="flex flex-wrap gap-1 mb-2 max-h-32 overflow-y-auto p-2 border border-border rounded-md bg-muted/30">
              {AROMA_DESCRIPTORS.map((descriptor) => (
                <Badge
                  key={descriptor}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                  onClick={() => addDescriptor('taste', descriptor)}
                >
                  {descriptor}
                </Badge>
              ))}
            </div>
            <Textarea
              id="taste"
              value={taste}
              onChange={(e) => setTaste(e.target.value)}
              placeholder="Describe the aroma and bouquet..."
              rows={2}
              maxLength={500}
            />
          </div>

          <div>
            <Label htmlFor="palate">Palate / Flavour</Label>
            <div className="flex flex-wrap gap-1 mb-2 max-h-32 overflow-y-auto p-2 border border-border rounded-md bg-muted/30">
              {PALATE_DESCRIPTORS.map((descriptor) => (
                <Badge
                  key={descriptor}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                  onClick={() => addDescriptor('palate', descriptor)}
                >
                  {descriptor}
                </Badge>
              ))}
            </div>
            <Textarea
              id="palate"
              value={palate}
              onChange={(e) => setPalate(e.target.value)}
              placeholder="Describe the palate, flavour, and finish..."
              rows={2}
              maxLength={500}
            />
          </div>

          <div>
            <Label htmlFor="score">Overall Score (0-100)</Label>
            <Input
              id="score"
              type="number"
              min="0"
              max="100"
              step="1"
              value={overallScore}
              onChange={(e) => setOverallScore(e.target.value)}
              placeholder="e.g., 85"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other observations or comments..."
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <Label>Images</Label>
            <ImageUpload
              images={attachments}
              onImagesChange={setAttachments}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {existingAnalysis ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
