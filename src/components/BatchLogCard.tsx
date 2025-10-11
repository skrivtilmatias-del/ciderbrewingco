import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Trash2, Tag } from "lucide-react";
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
}

interface BatchLogCardProps {
  log: BatchLog;
  onUpdate: () => void;
  onDelete: () => void;
}

export function BatchLogCard({ log, onUpdate, onDelete }: BatchLogCardProps) {
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
                {STAGES.map((s) => (
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
      </CardContent>
    </Card>
  );
}
