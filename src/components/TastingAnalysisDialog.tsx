import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Save, CalendarIcon, Camera, Check, Upload, X, Eye } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tastingAnalysisSchema } from "@/lib/validationSchemas";
import { toast } from "@/hooks/use-toast";

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

const GLASS_TYPES = [
  "Standard Wine Glass",
  "Champagne Flute", 
  "Tulip Glass",
  "Brandy Snifter",
  "ISO Tasting Glass",
  "Tumbler"
];


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
  onSave: (data: z.infer<typeof tastingAnalysisSchema>, analysisId?: string) => void;
  preSelectedBlendId?: string | null;
}

export function TastingAnalysisDialog({ 
  open, 
  onOpenChange, 
  blendBatches,
  existingAnalysis,
  onSave,
  preSelectedBlendId
}: TastingAnalysisDialogProps) {
  const [sourceType, setSourceType] = useState<"blend" | "competitor">("blend");
  const [blendBatchId, setBlendBatchId] = useState("");
  const [competitorBrand, setCompetitorBrand] = useState("");
  const [taste, setTaste] = useState("");
  const [colour, setColour] = useState("");
  const [palate, setPalate] = useState("");
  const [overallScore, setOverallScore] = useState<number>(50);
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // New fields
  const [tastingDate, setTastingDate] = useState<Date>(new Date());
  const [servingTemp, setServingTemp] = useState("");
  const [glassType, setGlassType] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showRadarChart, setShowRadarChart] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout>();

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
      setOverallScore(existingAnalysis.overall_score || 50);
      setNotes(existingAnalysis.notes || "");
      setAttachments(existingAnalysis.attachments || []);
      setPreviewImages(existingAnalysis.attachments || []);
    } else if (preSelectedBlendId) {
      setSourceType("blend");
      setBlendBatchId(preSelectedBlendId);
      resetFormFields();
    } else {
      resetForm();
    }
  }, [existingAnalysis, preSelectedBlendId, open]);

  // Auto-save effect
  useEffect(() => {
    if (!open) return;
    
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    setAutoSaveStatus("idle");
    
    autoSaveTimer.current = setTimeout(() => {
      if (blendBatchId || competitorBrand.trim()) {
        setAutoSaveStatus("saving");
        setTimeout(() => {
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 500);
      }
    }, 2000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [blendBatchId, competitorBrand, taste, colour, palate, overallScore, notes, servingTemp, glassType, open]);

  const resetFormFields = () => {
    setCompetitorBrand("");
    setTaste("");
    setColour("");
    setPalate("");
    setOverallScore(50);
    setNotes("");
    setAttachments([]);
    setPreviewImages([]);
    setTastingDate(new Date());
    setServingTemp("");
    setGlassType("");
  };

  const resetForm = () => {
    setSourceType("blend");
    setBlendBatchId("");
    resetFormFields();
    setFieldErrors({});
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

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAttachments(prev => [...prev, base64]);
        setPreviewImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setFieldErrors({});

    const validation = tastingAnalysisSchema.safeParse({
      blend_batch_id: sourceType === "blend" ? blendBatchId || undefined : undefined,
      competitor_brand: sourceType === "competitor" ? competitorBrand.trim() || undefined : undefined,
      taste: taste.trim() || undefined,
      colour: colour.trim() || undefined,
      palate: palate.trim() || undefined,
      overall_score: overallScore,
      notes: notes.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      serving_temp: servingTemp.trim() || undefined,
      glass_type: glassType || undefined,
      tasting_date: tastingDate,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      setFieldErrors(errors);
      
      toast({
        title: "Validation Error",
        description: "Please check the form for errors and try again.",
        variant: "destructive",
      });
      return;
    }

    onSave(validation.data, existingAnalysis?.id);
    setShowRadarChart(true);
    setTimeout(() => {
      setShowRadarChart(false);
      resetForm();
      onOpenChange(false);
    }, 3000);
  };

  // Calculate individual scores for radar chart (simple estimation)
  const getRadarScores = () => {
    const appearance = colour.length > 0 ? Math.min(100, (colour.length / 50) * 100) : 0;
    const aroma = taste.length > 0 ? Math.min(100, (taste.length / 50) * 100) : 0;
    const flavor = palate.length > 0 ? Math.min(100, (palate.length / 50) * 100) : 0;
    const overall = overallScore;
    const balance = (appearance + aroma + flavor) / 3;
    
    return { appearance, aroma, flavor, overall, balance };
  };

  const RadarChart = () => {
    const scores = getRadarScores();
    const categories = [
      { label: "Appearance", score: scores.appearance },
      { label: "Aroma", score: scores.aroma },
      { label: "Flavor", score: scores.flavor },
      { label: "Balance", score: scores.balance },
      { label: "Overall", score: scores.overall }
    ];

    return (
      <Card className="mb-4 bg-success/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            Tasting Analysis Saved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 text-center">
            {categories.map((cat) => (
              <div key={cat.label} className="space-y-2">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(cat.score)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {cat.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {existingAnalysis ? "Edit Tasting Analysis" : "New Tasting Analysis"}
            </DialogTitle>
            {autoSaveStatus !== "idle" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {autoSaveStatus === "saving" && (
                  <>
                    <div className="h-2 w-2 bg-warning rounded-full animate-pulse" />
                    Saving...
                  </>
                )}
                {autoSaveStatus === "saved" && (
                  <>
                    <Check className="h-3 w-3 text-success" />
                    Saved
                  </>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {showRadarChart && <RadarChart />}

          {/* Basic Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Tasting Source</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={sourceType === "blend" ? "default" : "outline"}
                  onClick={() => setSourceType("blend")}
                  disabled={!!existingAnalysis}
                  className="flex-1 h-9 text-xs sm:text-sm"
                >
                  Blend
                </Button>
                <Button
                  type="button"
                  variant={sourceType === "competitor" ? "default" : "outline"}
                  onClick={() => setSourceType("competitor")}
                  disabled={!!existingAnalysis}
                  className="flex-1 h-9 text-xs sm:text-sm"
                >
                  Competitor
                </Button>
              </div>

              {sourceType === "blend" ? (
                <div>
                  <Select 
                    value={blendBatchId} 
                    onValueChange={setBlendBatchId}
                    disabled={!!existingAnalysis}
                  >
                    <SelectTrigger className={cn("h-10", fieldErrors.blend_batch_id && "border-destructive")}>
                      <SelectValue placeholder="Select blend" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover border max-h-[300px]">
                      {blendBatches.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No blends available</div>
                      ) : (
                        blendBatches.map((blend) => (
                          <SelectItem key={blend.id} value={blend.id}>
                            {blend.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {fieldErrors.blend_batch_id && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.blend_batch_id}</p>
                  )}
                </div>
              ) : (
                <div>
                  <Input
                    placeholder="Competitor brand"
                    value={competitorBrand}
                    onChange={(e) => setCompetitorBrand(e.target.value)}
                    disabled={!!existingAnalysis}
                    className={cn("h-10", fieldErrors.competitor_brand && "border-destructive")}
                  />
                  {fieldErrors.competitor_brand && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.competitor_brand}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label>Tasting Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !tastingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tastingDate ? format(tastingDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tastingDate}
                    onSelect={(date) => date && setTastingDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="temp">Serving Temp (°C)</Label>
              <Input
                id="temp"
                type="number"
                value={servingTemp}
                onChange={(e) => setServingTemp(e.target.value)}
                placeholder="e.g., 12"
                className="h-10"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="glass">Glass Type</Label>
              <Select value={glassType} onValueChange={setGlassType}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select glass type" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-card">
                  {GLASS_TYPES.map((glass) => (
                    <SelectItem key={glass} value={glass}>
                      {glass}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Collapsible Tasting Sections */}
          <Accordion type="multiple" defaultValue={["appearance", "aroma", "palate", "score"]} className="space-y-2">
            <AccordionItem value="appearance" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="font-semibold text-sm sm:text-base">Appearance</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="flex flex-wrap gap-1.5 p-3 border border-border rounded-md bg-muted/30 max-h-40 overflow-y-auto">
                  {APPEARANCE_DESCRIPTORS.map((descriptor) => (
                    <Badge
                      key={descriptor}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2 py-1"
                      onClick={() => addDescriptor('colour', descriptor)}
                    >
                      {descriptor}
                    </Badge>
                  ))}
                </div>
                <Textarea
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  placeholder="Tap descriptors above or type your notes..."
                  rows={2}
                  maxLength={500}
                  className={cn("text-sm md:text-base", fieldErrors.colour && "border-destructive")}
                />
                <div className="flex justify-between items-center">
                  {fieldErrors.colour && (
                    <p className="text-xs text-destructive">{fieldErrors.colour}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">{colour.length}/500</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="aroma" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="font-semibold text-sm sm:text-base">Aroma / Bouquet</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="flex flex-wrap gap-1.5 p-3 border border-border rounded-md bg-muted/30 max-h-40 overflow-y-auto">
                  {AROMA_DESCRIPTORS.map((descriptor) => (
                    <Badge
                      key={descriptor}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2 py-1"
                      onClick={() => addDescriptor('taste', descriptor)}
                    >
                      {descriptor}
                    </Badge>
                  ))}
                </div>
                <Textarea
                  value={taste}
                  onChange={(e) => setTaste(e.target.value)}
                  placeholder="Tap descriptors above or type your notes..."
                  rows={2}
                  maxLength={500}
                  className={cn("text-sm md:text-base", fieldErrors.taste && "border-destructive")}
                />
                <div className="flex justify-between items-center">
                  {fieldErrors.taste && (
                    <p className="text-xs text-destructive">{fieldErrors.taste}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">{taste.length}/500</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="palate" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="font-semibold text-sm sm:text-base">Palate / Flavour</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="flex flex-wrap gap-1.5 p-3 border border-border rounded-md bg-muted/30 max-h-40 overflow-y-auto">
                  {PALATE_DESCRIPTORS.map((descriptor) => (
                    <Badge
                      key={descriptor}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2 py-1"
                      onClick={() => addDescriptor('palate', descriptor)}
                    >
                      {descriptor}
                    </Badge>
                  ))}
                </div>
                <Textarea
                  value={palate}
                  onChange={(e) => setPalate(e.target.value)}
                  placeholder="Tap descriptors above or type your notes..."
                  rows={2}
                  maxLength={500}
                  className={cn("text-sm md:text-base", fieldErrors.palate && "border-destructive")}
                />
                <div className="flex justify-between items-center">
                  {fieldErrors.palate && (
                    <p className="text-xs text-destructive">{fieldErrors.palate}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">{palate.length}/500</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="score" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  Overall Score
                  <Badge variant="outline">{overallScore}/100</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="px-2">
                  <Slider
                    value={[overallScore]}
                    onValueChange={(val) => setOverallScore(val[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                  {fieldErrors.overall_score && (
                    <p className="text-xs text-destructive mt-2">{fieldErrors.overall_score}</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notes" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="font-semibold text-sm sm:text-base">Additional Notes</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other observations or comments..."
                  rows={3}
                  maxLength={1000}
                  className={cn("text-sm md:text-base", fieldErrors.notes && "border-destructive")}
                />
                <div className="flex justify-between items-center">
                  {fieldErrors.notes && (
                    <p className="text-xs text-destructive">{fieldErrors.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">{notes.length}/1000</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="images" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  Images
                  {previewImages.length > 0 && (
                    <Badge variant="secondary">{previewImages.length}</Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCameraCapture}
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {previewImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="min-w-[100px]">
              <Save className="h-4 w-4 mr-2" />
              {existingAnalysis ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
