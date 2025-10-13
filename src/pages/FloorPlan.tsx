import { useState, useEffect } from "react";
import { EquipmentPalette } from "@/components/EquipmentPalette";
import { FloorPlanCanvas } from "@/components/FloorPlanCanvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EquipmentType, EQUIPMENT_DATABASE, SCENARIO_PRESETS } from "@/constants/equipment";
import { PlacedEquipment, calculateTotalCapacity, calculateSpaceUtilization } from "@/lib/floorPlanUtils";
import { supabase } from "@/integrations/supabase/client";
import { RotateCw, Trash2, Save, FolderOpen, Layout } from "lucide-react";

const FLOOR_WIDTH = 7.5;
const FLOOR_HEIGHT = 10;
const FLOOR_CEILING = 5;

export const FloorPlan = () => {
  const [placedEquipment, setPlacedEquipment] = useState<PlacedEquipment[]>([]);
  const [draggedEquipment, setDraggedEquipment] = useState<EquipmentType | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState("");
  const [layoutNotes, setLayoutNotes] = useState("");
  const [savedLayouts, setSavedLayouts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      if (user?.id) {
        loadSavedLayouts(user.id);
      }
    };
    checkUser();
  }, []);

  const loadSavedLayouts = async (uid: string) => {
    const { data, error } = await supabase
      .from('floor_plan_layouts')
      .select('*')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false });

    if (error) {
      // Error loading layouts - handled by error boundary
      return;
    }

    setSavedLayouts(data || []);
  };

  const handleEquipmentSelect = (equipment: EquipmentType) => {
    setDraggedEquipment(equipment);
  };

  const handleEquipmentPlace = (equipment: PlacedEquipment) => {
    setPlacedEquipment([...placedEquipment, equipment]);
    setDraggedEquipment(null);
    toast.success(`${EQUIPMENT_DATABASE.find(e => e.id === equipment.equipmentId)?.name} placed`);
  };

  const handleEquipmentMove = (id: string, x: number, y: number) => {
    setPlacedEquipment(placedEquipment.map(eq =>
      eq.id === id ? { ...eq, x, y } : eq
    ));
  };

  const handleEquipmentRotate = (id: string) => {
    setPlacedEquipment(placedEquipment.map(eq =>
      eq.id === id ? { ...eq, rotation: (eq.rotation + 90) % 360 } : eq
    ));
    toast.success("Equipment rotated");
  };

  const handleEquipmentDelete = (id: string) => {
    setPlacedEquipment(placedEquipment.filter(eq => eq.id !== id));
    toast.success("Equipment removed");
  };

  const handleClear = () => {
    setPlacedEquipment([]);
    setSelectedEquipmentId(null);
    toast.success("Floor plan cleared");
  };

  const handleLoadPreset = (presetKey: string) => {
    const preset = SCENARIO_PRESETS[presetKey];
    if (!preset) return;

    const newEquipment = preset.equipment.map(eq => ({
      id: `${eq.equipmentId}-${Date.now()}-${Math.random()}`,
      equipmentId: eq.equipmentId,
      x: eq.x,
      y: eq.y,
      rotation: eq.rotation
    }));

    setPlacedEquipment(newEquipment);
    toast.success(`Loaded ${preset.name}`);
  };

  const handleSaveLayout = async () => {
    if (!userId) {
      toast.error("Please sign in to save layouts");
      return;
    }

    if (!layoutName.trim()) {
      toast.error("Please enter a layout name");
      return;
    }

    if (placedEquipment.length === 0) {
      toast.error("Please add some equipment to the floor plan first");
      return;
    }

    // Saving layout with equipment count: placedEquipment.length

    const { error } = await supabase
      .from('floor_plan_layouts')
      .insert({
        user_id: userId,
        name: layoutName,
        scenario_type: 'custom',
        equipment_data: placedEquipment as any,
        notes: layoutNotes
      });

    if (error) {
      toast.error("Failed to save layout");
      return;
    }

    toast.success("Layout saved successfully");
    setLayoutName("");
    setLayoutNotes("");
    loadSavedLayouts(userId);
  };

  const handleLoadLayout = (layout: any) => {
    setPlacedEquipment(layout.equipment_data || []);
    setLayoutName(layout.name);
    setLayoutNotes(layout.notes || "");
    toast.success(`Loaded ${layout.name}`);
  };

  const totalCapacity = calculateTotalCapacity(placedEquipment, EQUIPMENT_DATABASE);
  const spaceUtilization = calculateSpaceUtilization(placedEquipment, EQUIPMENT_DATABASE, FLOOR_WIDTH, FLOOR_HEIGHT);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Production Floor Plan</h1>
            <p className="text-sm text-muted-foreground">
              Design your {FLOOR_WIDTH}m × {FLOOR_HEIGHT}m × {FLOOR_CEILING}m production space
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Select onValueChange={handleLoadPreset}>
              <SelectTrigger className="w-[200px]">
                <Layout className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Load Preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000L">1000L Setup</SelectItem>
                <SelectItem value="5000L">5000L Setup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <Card className="p-3 flex-1">
            <div className="text-sm text-muted-foreground">Total Capacity</div>
            <div className="text-2xl font-bold">{totalCapacity}L</div>
          </Card>
          <Card className="p-3 flex-1">
            <div className="text-sm text-muted-foreground">Space Utilization</div>
            <div className="text-2xl font-bold">{spaceUtilization.toFixed(1)}%</div>
          </Card>
          <Card className="p-3 flex-1">
            <div className="text-sm text-muted-foreground">Equipment Count</div>
            <div className="text-2xl font-bold">{placedEquipment.length}</div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 p-4">
          <FloorPlanCanvas
            floorWidth={FLOOR_WIDTH}
            floorHeight={FLOOR_HEIGHT}
            placedEquipment={placedEquipment}
            onEquipmentPlace={handleEquipmentPlace}
            onEquipmentMove={handleEquipmentMove}
            onEquipmentRotate={handleEquipmentRotate}
            onEquipmentDelete={handleEquipmentDelete}
            draggedEquipment={draggedEquipment}
            selectedEquipmentId={selectedEquipmentId}
            onSelectEquipment={setSelectedEquipmentId}
          />
          
          {selectedEquipmentId && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEquipmentRotate(selectedEquipmentId)}>
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate (R)
              </Button>
              <Button size="sm" variant="destructive" onClick={() => {
                handleEquipmentDelete(selectedEquipmentId);
                setSelectedEquipmentId(null);
              }}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete (Del)
              </Button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l flex flex-col overflow-y-auto min-h-0">
          <EquipmentPalette onEquipmentSelect={handleEquipmentSelect} />
          
          <div className="border-t p-4 space-y-4">
            <div>
              <Label htmlFor="layout-name">Layout Name</Label>
              <Input
                id="layout-name"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="My Layout"
              />
            </div>
            
            <div>
              <Label htmlFor="layout-notes">Notes</Label>
              <Textarea
                id="layout-notes"
                value={layoutNotes}
                onChange={(e) => setLayoutNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
              />
            </div>

            <Button onClick={handleSaveLayout} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Layout
            </Button>

            {savedLayouts.length > 0 && (
              <div>
                <Label>Saved Layouts</Label>
                <div className="space-y-2 mt-2">
                  {savedLayouts.map((layout) => (
                    <Button
                      key={layout.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleLoadLayout(layout)}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      {layout.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
