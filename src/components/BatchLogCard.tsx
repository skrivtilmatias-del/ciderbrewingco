import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Trash2, Tag, Upload, X } from "lucide-react";
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
  allowedStages?: string[];
}

export function BatchLogCard({ log, onUpdate, onDelete, allowedStages }: BatchLogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
        .update(validation.data)
        .eq("id", log.id);

      if (error) {
        toast.error(getUserFriendlyError(error));
      } else {
        toast.success("Log updated");
        onUpdate();
      }
    } finally {
      setIsUpdating(false);
    }
  }, [stage, role, title, content, tags, og, fg, ph, ta, tempC, log.id, onUpdate, isUpdating]);

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

  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="p-1 rounded hover:bg-accent"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <span className="text-sm text-muted-foreground">
              {new Date(log.created_at).toLocaleString()}
            </span>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-[220px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(allowedStages || STAGES).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Cellar">Cellar</SelectItem>
                <SelectItem value="Lab">Lab</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short title"
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note..."
          rows={isExpanded ? 6 : 3}
        />
        
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tag"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" size="icon" onClick={addTag}>
            <Tag className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeTag(tag)}
            >
              {tag} ✕
            </Badge>
          ))}
        </div>

        {isExpanded && (
          <div className="grid md:grid-cols-3 gap-3 border rounded-lg p-3">
            <div className="grid gap-2">
              <Label className="text-xs">OG (SG)</Label>
              <Input
                type="number"
                step="0.001"
                value={og}
                onChange={(e) => setOg(e.target.value)}
                placeholder="1.050"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">FG (SG)</Label>
              <Input
                type="number"
                step="0.001"
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                placeholder="0.998"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">ABV (%)</Label>
              <Input value={calculateABV()} readOnly />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">pH</Label>
              <Input
                type="number"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                placeholder="3.3"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">TA (g/L)</Label>
              <Input
                type="number"
                step="0.1"
                value={ta}
                onChange={(e) => setTa(e.target.value)}
                placeholder="5.5"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Temp (°C)</Label>
              <Input
                type="number"
                step="0.1"
                value={tempC}
                onChange={(e) => setTempC(e.target.value)}
                placeholder="14"
              />
            </div>
          </div>
        )}
        
        {/* Image Attachments */}
        {isExpanded && (
          <div className="space-y-2">
            <Label>Images</Label>
            {attachments.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {attachments.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imageUrl} 
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(imageUrl)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
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
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Images"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
