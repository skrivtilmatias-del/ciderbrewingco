import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Wine, Save, Edit, X, Minus, Plus, Star, Calendar as CalendarIcon, User, ClipboardList } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/errorHandler";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BlendComponent {
  id: string;
  source_batch_id: string;
  batch_name: string;
  batch_variety: string;
  percentage: number | null;
  volume_liters: number | null;
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

interface BlendBatch {
  id: string;
  name: string;
  total_volume: number;
  notes: string | null;
  created_at: string;
  components: BlendComponent[];
  bottles_75cl?: number;
  bottles_150cl?: number;
  storage_location?: string | null;
  attachments?: string[];
}

interface BlendBatchDetailsTabbedProps {
  blend: BlendBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlendUpdated: () => void;
  onAddTastingNote?: (blendId: string) => void;
}

export function BlendBatchDetailsTabbed({ 
  blend, 
  open, 
  onOpenChange, 
  onBlendUpdated,
  onAddTastingNote 
}: BlendBatchDetailsTabbedProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [blendName, setBlendName] = useState("");
  const [totalVolume, setTotalVolume] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [createdDate, setCreatedDate] = useState<Date | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [tastingAnalyses, setTastingAnalyses] = useState<TastingAnalysis[]>([]);
  const [loadingTastings, setLoadingTastings] = useState(false);
  
  // Inventory controls
  const [bottles75cl, setBottles75cl] = useState("");
  const [bottles150cl, setBottles150cl] = useState("");
  const [amount75cl, setAmount75cl] = useState("1");
  const [amount150cl, setAmount150cl] = useState("1");

  useEffect(() => {
    if (blend) {
      setBlendName(blend.name);
      setTotalVolume(blend.total_volume.toString());
      setBottles75cl((blend.bottles_75cl || 0).toString());
      setBottles150cl((blend.bottles_150cl || 0).toString());
      setStorageLocation(blend.storage_location || "");
      setNotes(blend.notes || "");
      setAttachments(blend.attachments || []);
      setCreatedDate(new Date(blend.created_at));
      setIsEditing(false);
      fetchTastingAnalyses();
    }
  }, [blend]);

  const fetchTastingAnalyses = async () => {
    if (!blend) return;
    
    setLoadingTastings(true);
    try {
      const { data: tastingData, error } = await supabase
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
        .eq("blend_batch_id", blend.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for taster names
      const userIds = [...new Set(tastingData.map(t => t.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);

      const formattedAnalyses = tastingData.map(analysis => ({
        id: analysis.id,
        created_at: analysis.created_at,
        taste: analysis.taste,
        colour: analysis.colour,
        palate: analysis.palate,
        overall_score: analysis.overall_score,
        notes: analysis.notes,
        taster_name: profilesMap.get(analysis.user_id) || "Unknown",
      }));

      setTastingAnalyses(formattedAnalyses);
    } catch (error: any) {
      console.error("Error fetching tasting analyses:", error);
    } finally {
      setLoadingTastings(false);
    }
  };

  const handleReduceBottle = async (bottleType: '75cl' | '150cl') => {
    if (!blend) return;
    
    const amount = bottleType === '75cl' ? parseInt(amount75cl) || 1 : parseInt(amount150cl) || 1;
    const current75 = blend.bottles_75cl || 0;
    const current150 = blend.bottles_150cl || 0;
    
    if (bottleType === '75cl' && current75 < amount) {
      toast.error(`Only ${current75} bottles (75cl) available`);
      return;
    }
    
    if (bottleType === '150cl' && current150 < amount) {
      toast.error(`Only ${current150} bottles (150cl) available`);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("blend_batches")
        .update({
          bottles_75cl: bottleType === '75cl' ? current75 - amount : current75,
          bottles_150cl: bottleType === '150cl' ? current150 - amount : current150,
        })
        .eq("id", blend.id);

      if (error) throw error;

      toast.success(`Removed ${amount} bottle${amount > 1 ? 's' : ''} (${bottleType})`);
      onBlendUpdated();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleAddBottle = async (bottleType: '75cl' | '150cl') => {
    if (!blend) return;
    
    const amount = bottleType === '75cl' ? parseInt(amount75cl) || 1 : parseInt(amount150cl) || 1;
    const current75 = blend.bottles_75cl || 0;
    const current150 = blend.bottles_150cl || 0;
    
    try {
      const { error } = await supabase
        .from("blend_batches")
        .update({
          bottles_75cl: bottleType === '75cl' ? current75 + amount : current75,
          bottles_150cl: bottleType === '150cl' ? current150 + amount : current150,
        })
        .eq("id", blend.id);

      if (error) throw error;

      toast.success(`Added ${amount} bottle${amount > 1 ? 's' : ''} (${bottleType})`);
      onBlendUpdated();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const handleSave = async () => {
    if (!blend) return;
    
    if (!blendName.trim()) {
      toast.error("Blend name is required");
      return;
    }

    const volumeNum = parseFloat(totalVolume);
    if (isNaN(volumeNum) || volumeNum <= 0) {
      toast.error("Valid total volume is required");
      return;
    }

    if (!createdDate) {
      toast.error("Creation date is required");
      return;
    }

    const bottles75 = parseInt(bottles75cl) || 0;
    const bottles150 = parseInt(bottles150cl) || 0;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("blend_batches")
        .update({ 
          name: blendName.trim(),
          total_volume: volumeNum,
          bottles_75cl: bottles75,
          bottles_150cl: bottles150,
          storage_location: storageLocation.trim() || null,
          notes: notes.trim() || null,
          attachments: attachments.length > 0 ? attachments : null,
          created_at: createdDate.toISOString()
        })
        .eq("id", blend.id);

      if (error) throw error;

      toast.success("Blend updated successfully");
      setIsEditing(false);
      onBlendUpdated();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const renderStars = (score: number | null) => {
    if (!score) return null;
    // Convert 0-100 score to 0-5 stars
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
                ? 'fill-primary text-primary' 
                : i === fullStars && hasHalfStar
                ? 'fill-primary/50 text-primary'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!blend) return null;

  const averageScore = tastingAnalyses.length > 0
    ? tastingAnalyses.reduce((sum, t) => sum + (t.overall_score || 0), 0) / tastingAnalyses.length
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wine className="w-6 h-6 text-primary" />
              <div>
                <DialogTitle className="text-2xl">{blend.name}</DialogTitle>
                <DialogDescription className="sr-only">Edit blend details, tasting notes, inventory and images.</DialogDescription>
                {averageScore && (
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(averageScore)}
                    <span className="text-sm text-muted-foreground">
                      ({tastingAnalyses.length} {tastingAnalyses.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tastings">
              Tasting Notes
              {tastingAnalyses.length > 0 && (
                <Badge variant="secondary" className="ml-2">{tastingAnalyses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="notes">Images & Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm text-muted-foreground">Total Volume</Label>
                  <p className="text-2xl font-bold mt-1">{blend.total_volume}L</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm text-muted-foreground">Total Bottles</Label>
                  <p className="text-2xl font-bold mt-1">
                    {(blend.bottles_75cl || 0) + (blend.bottles_150cl || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {blend.storage_location && (
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm text-muted-foreground">Storage Location</Label>
                  <p className="text-base font-medium mt-1">{blend.storage_location}</p>
                </CardContent>
              </Card>
            )}

            <div>
              <Label className="text-base font-semibold mb-3 block">Components</Label>
              <div className="space-y-2">
                {blend.components.map((component) => (
                  <Card key={component.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{component.batch_name}</p>
                          <p className="text-sm text-muted-foreground">{component.batch_variety}</p>
                        </div>
                        <div className="flex gap-2">
                          {component.percentage !== null && (
                            <Badge variant="secondary">{component.percentage}%</Badge>
                          )}
                          {component.volume_liters !== null && (
                            <Badge variant="outline">{component.volume_liters}L</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Created: {new Date(blend.created_at).toLocaleDateString()}
            </div>
          </TabsContent>

          {/* Tasting Notes Tab */}
          <TabsContent value="tastings" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tasting Analyses</h3>
              {onAddTastingNote && (
                <Button onClick={() => onAddTastingNote(blend.id)} size="sm">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Add Tasting Note
                </Button>
              )}
            </div>

            {loadingTastings ? (
              <p className="text-muted-foreground text-center py-8">Loading tasting notes...</p>
            ) : tastingAnalyses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No tasting notes yet</p>
                  {onAddTastingNote && (
                    <Button onClick={() => onAddTastingNote(blend.id)} variant="outline">
                      Add First Tasting Note
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tastingAnalyses.map((analysis) => (
                  <Card key={analysis.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{analysis.taster_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(analysis.overall_score)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {analysis.colour && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Colour</Label>
                          <p className="text-sm">{analysis.colour}</p>
                        </div>
                      )}

                      {analysis.taste && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Taste</Label>
                          <p className="text-sm">{analysis.taste}</p>
                        </div>
                      )}

                      {analysis.palate && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Palate</Label>
                          <p className="text-sm">{analysis.palate}</p>
                        </div>
                      )}

                      {analysis.notes && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Notes</Label>
                          <p className="text-sm whitespace-pre-wrap">{analysis.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Bottles 75cl</Label>
                  <p className="text-3xl font-bold mt-1">{blend.bottles_75cl || 0}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReduceBottle('75cl')}
                      disabled={(blend.bottles_75cl || 0) === 0}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={amount75cl}
                      onChange={(e) => setAmount75cl(e.target.value)}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddBottle('75cl')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm text-muted-foreground">Bottles 150cl</Label>
                  <p className="text-3xl font-bold mt-1">{blend.bottles_150cl || 0}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReduceBottle('150cl')}
                      disabled={(blend.bottles_150cl || 0) === 0}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={amount150cl}
                      onChange={(e) => setAmount150cl(e.target.value)}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddBottle('150cl')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images & Notes Tab */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="blend-name">Blend Name</Label>
                  <Input
                    id="blend-name"
                    value={blendName}
                    onChange={(e) => setBlendName(e.target.value)}
                    placeholder="Enter blend name"
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="storage-location">Storage Location</Label>
                  <Input
                    id="storage-location"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    placeholder="e.g., Rack A3, Cellar Room 2"
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="created-date">Creation Date</Label>
                  <Input
                    id="created-date"
                    type="date"
                    value={createdDate ? format(createdDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCreatedDate(v ? new Date(v + "T00:00:00") : undefined);
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="blend-notes">Production Notes</Label>
                  <Textarea
                    id="blend-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add production notes about this blend..."
                    rows={6}
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

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBlendName(blend.name);
                      setStorageLocation(blend.storage_location || "");
                      setNotes(blend.notes || "");
                      setAttachments(blend.attachments || []);
                      setCreatedDate(new Date(blend.created_at));
                      setIsEditing(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <Label className="text-sm text-muted-foreground">Production Notes</Label>
                    <p className="text-sm mt-2 whitespace-pre-wrap min-h-[60px]">
                      {blend.notes || "No production notes added yet."}
                    </p>
                  </CardContent>
                </Card>

                {attachments.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Images</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {attachments.map((imageUrl, index) => (
                        <img
                          key={index}
                          src={imageUrl}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
