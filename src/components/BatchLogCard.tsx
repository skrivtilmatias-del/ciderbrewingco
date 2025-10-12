import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Tag, Upload, X } from "lucide-react";
import { STAGES } from "@/constants/ciderStages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { batchLogSchema } from "@/lib/validationSchemas";
import { getUserFriendlyError } from "@/lib/errorHandler";

export interface BatchLog {
  id: string;
  batch_id: string;
  created_at: string;
  stage: string;
  role: string;
  title: string | null;
  content: string | null;
  tags: string[] | null;
  og: number | null;
  fg: number | null;
  ph: number | null;
  ta_gpl: number | null;
  temp_c: number | null;
  attachments: string[] | null;
}

interface BatchLogCardProps {
  log: BatchLog;
  onUpdate: () => void;
  onDelete: () => void;
  onClose?: () => void;
  allowedStages?: string[];
}

export function BatchLogCard({ log, onUpdate, onDelete, onClose, allowedStages }: BatchLogCardProps) {
  const [stage, setStage] = useState(log.stage);
  const [role, setRole] = useState(log.role || "General");
  const [title, setTitle] = useState(log.title || "");
  const [content, setContent] = useState(log.content || "");
  const [tags, setTags] = useState<string[]>(log.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [og, setOg] = useState(log.og?.toString() || "");
  const [fg, setFg] = useState(log.fg?.toString() || "");
  const [ph, setPh] = useState(log.ph?.toString() || "");
  const [ta, setTa] = useState(log.ta_gpl?.toString() || "");
  const [tempC, setTempC] = useState(log.temp_c?.toString() || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [attachments, setAttachments] = useState<string[]>(log.attachments || []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced update to prevent excessive API calls
  const handleUpdate = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    // Validate input using Zod
    const validation = batchLogSchema.safeParse({
      stage,
      role,
      title: title || undefined,
      content: content || undefined,
      tags: tags.length > 0 ? tags : undefined,
      og: og ? parseFloat(og) : null,
      fg: fg ? parseFloat(fg) : null,
      ph: ph ? parseFloat(ph) : null,
      ta_gpl: ta ? parseFloat(ta) : null,
      temp_c: tempC ? parseFloat(tempC) : null,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      setIsUpdating(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("batch_logs")
        .update({
          ...validation.data,
          attachments: attachments.length > 0 ? attachments : null
        })
        .eq("id", log.id);

      if (error) {
        toast.error(getUserFriendlyError(error));
      } else {
        toast.success("Log updated");
        onUpdate();
        if (onClose) onClose();
      }
    } finally {
      setIsUpdating(false);
    }
  }, [stage, role, title, content, tags, og, fg, ph, ta, tempC, attachments, log.id, onUpdate, onClose, isUpdating]);

  const handleDelete = async () => {
    if (!confirm("Delete this log entry?")) return;

    const { error } = await supabase
      .from("batch_logs")
      .delete()
      .eq("id", log.id);

    if (error) {
      toast.error(getUserFriendlyError(error));
    } else {
      toast.success("Log deleted");
      onDelete();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${log.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('batch-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('batch-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(data.publicUrl);
      }

      const newAttachments = [...attachments, ...uploadedUrls];
      setAttachments(newAttachments);

      const { error: updateError } = await supabase
        .from('batch_logs')
        .update({ attachments: newAttachments })
        .eq('id', log.id);

      if (updateError) throw updateError;

      toast.success("Images uploaded");
      onUpdate();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (imageUrl: string) => {
    const newAttachments = attachments.filter(url => url !== imageUrl);
    setAttachments(newAttachments);

    try {
      const { error } = await supabase
        .from('batch_logs')
        .update({ attachments: newAttachments })
        .eq('id', log.id);

      if (error) throw error;

      // Delete from storage
      const fileName = imageUrl.split('/batch-images/')[1];
      if (fileName) {
        await supabase.storage
          .from('batch-images')
          .remove([fileName]);
      }

      toast.success("Image removed");
      onUpdate();
    } catch (error: any) {
      toast.error(getUserFriendlyError(error));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const calculateABV = () => {
    const ogNum = parseFloat(og);
    const fgNum = parseFloat(fg);
    if (ogNum && fgNum) {
      return ((ogNum - fgNum) * 131.25).toFixed(2);
    }
    return "–";
  };

  const hasLab = og || fg || ph || ta || tempC;

  return (
    <Card className="mb-3 border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {new Date(log.created_at).toLocaleString()}
            </span>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(allowedStages || STAGES).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General" className="text-xs">General</SelectItem>
                <SelectItem value="Cellar" className="text-xs">Cellar</SelectItem>
                <SelectItem value="Lab" className="text-xs">Lab</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="default" size="sm" onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save & Close"}
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Title and Content */}
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="font-medium"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add notes..."
            rows={4}
          />
        </div>
        
        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-xs">Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag and press Enter"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" size="sm" onClick={addTag}>
              <Tag className="h-3 w-3" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ✕
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Lab Measurements */}
        <div className="space-y-2">
          <Label className="text-xs">Lab Measurements (optional)</Label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 p-3 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">OG</Label>
              <Input
                type="number"
                step="0.001"
                value={og}
                onChange={(e) => setOg(e.target.value)}
                placeholder="1.050"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">FG</Label>
              <Input
                type="number"
                step="0.001"
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                placeholder="0.998"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">pH</Label>
              <Input
                type="number"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                placeholder="3.3"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">TA (g/L)</Label>
              <Input
                type="number"
                step="0.1"
                value={ta}
                onChange={(e) => setTa(e.target.value)}
                placeholder="5.5"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Temp (°C)</Label>
              <Input
                type="number"
                step="0.1"
                value={tempC}
                onChange={(e) => setTempC(e.target.value)}
                placeholder="14"
                className="h-8 text-xs"
              />
            </div>
          </div>
          {og && fg && (
            <div className="text-xs text-muted-foreground">
              Calculated ABV: <span className="font-medium text-foreground">{calculateABV()}%</span>
            </div>
          )}
        </div>
        
        {/* Image Attachments */}
        <div className="space-y-2">
          <Label className="text-xs">Images (optional)</Label>
          {attachments.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {attachments.map((imageUrl, index) => (
                <div key={index} className="relative group aspect-square">
                  <img 
                    src={imageUrl} 
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-full object-cover rounded border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(imageUrl)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3 w-3 mr-2" />
            {uploading ? "Uploading..." : "Upload Images"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
