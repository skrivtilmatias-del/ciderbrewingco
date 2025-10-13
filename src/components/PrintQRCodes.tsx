import QRCodeSVG from "react-qr-code";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Plus, Trash2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { makeBatchQrUrl, makeBlendQrUrl } from "@/lib/urls";

interface Batch {
  id: string;
  name: string;
  variety: string;
  volume: number;
  started_at: string;
  current_stage: string;
}

interface BlendBatch {
  id: string;
  name: string;
  total_volume: number;
  bottles_75cl?: number;
  bottles_150cl?: number;
  storage_location?: string | null;
  created_at: string;
}

interface BlendComponent {
  batch_id: string;
  percent: number;
}

interface PrintQRCodesProps {
  blendBatches: BlendBatch[];
}

export const PrintQRCodes = ({ blendBatches }: PrintQRCodesProps) => {
  const [mode, setMode] = useState<"batch" | "blend">("blend");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [includeVintage, setIncludeVintage] = useState(true);
  const [printSheet, setPrintSheet] = useState(false);
  
  // Blend creation state
  const [newBlendName, setNewBlendName] = useState("");
  const [blendComponents, setBlendComponents] = useState<BlendComponent[]>([{ batch_id: "", percent: 0 }]);
  const [creatingBlend, setCreatingBlend] = useState(false);
  
  useEffect(() => {
    fetchBatches();
    suggestNextBlendId();
  }, []);
  
  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from("batches")
      .select("id, name, variety, volume, started_at, current_stage")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load batches");
      return;
    }
    setBatches(data || []);
  };
  
  const suggestNextBlendId = async () => {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("blend_batches")
      .select("name")
      .like("name", `BL-${year}-%`)
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].name.split("-")[2]) || 0;
      setNewBlendName(`BL-${year}-${String(lastNum + 1).padStart(2, "0")}`);
    } else {
      setNewBlendName(`BL-${year}-01`);
    }
  };
  

  const handlePrint = () => {
    window.print();
  };

  const handlePrintSingle = (id: string, type: "batch" | "blend") => {
    const printElement = document.getElementById(`qr-card-${id}`);
    if (!printElement) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .qr-card { padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; display: flex; flex-direction: column; align-items: center; max-width: 400px; }
            .qr-code { background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
            .qr-info { text-align: center; }
            h3 { font-size: 18px; font-weight: 600; margin: 0 0 8px 0; }
            p { margin: 4px 0; font-size: 14px; color: #6b7280; }
            .date { font-size: 12px; padding-top: 8px; }
          </style>
        </head>
        <body>
          ${printElement.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  
  const addBlendComponent = () => {
    setBlendComponents([...blendComponents, { batch_id: "", percent: 0 }]);
  };
  
  const removeBlendComponent = (index: number) => {
    setBlendComponents(blendComponents.filter((_, i) => i !== index));
  };
  
  const updateBlendComponent = (index: number, field: keyof BlendComponent, value: any) => {
    const updated = [...blendComponents];
    updated[index] = { ...updated[index], [field]: value };
    setBlendComponents(updated);
  };
  
  const totalPercent = blendComponents.reduce((sum, c) => sum + (c.percent || 0), 0);
  
  const handleCreateBlend = async () => {
    if (!newBlendName.trim()) {
      toast.error("Please enter a blend name");
      return;
    }
    
    if (totalPercent !== 100) {
      toast.error("Components must sum to 100%");
      return;
    }
    
    if (blendComponents.some(c => !c.batch_id)) {
      toast.error("Please select a batch for all components");
      return;
    }
    
    setCreatingBlend(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      
      // Calculate total volume
      const totalVolume = blendComponents.reduce((sum, comp) => {
        const batch = batches.find(b => b.id === comp.batch_id);
        return sum + ((batch?.volume || 0) * comp.percent / 100);
      }, 0);
      
      const { data: blendData, error: blendError } = await supabase
        .from("blend_batches")
        .insert({
          name: newBlendName,
          user_id: user.user.id,
          total_volume: totalVolume,
        })
        .select()
        .single();
      
      if (blendError) throw blendError;
      
      const componentInserts = blendComponents.map(comp => {
        const batch = batches.find(b => b.id === comp.batch_id);
        return {
          blend_batch_id: blendData.id,
          source_batch_id: comp.batch_id,
          percentage: comp.percent,
          volume_liters: (batch?.volume || 0) * comp.percent / 100,
        };
      });
      
      const { error: componentsError } = await supabase
        .from("blend_components")
        .insert(componentInserts);
      
      if (componentsError) throw componentsError;
      
      toast.success("Blend created successfully!");
      
      // Refresh blend batches by reloading (parent component will handle)
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to create blend");
    } finally {
      setCreatingBlend(false);
    }
  };
  
  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(batchSearchQuery.toLowerCase()) ||
    b.variety.toLowerCase().includes(batchSearchQuery.toLowerCase())
  );
  
  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">QR Code Generator</h2>
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={mode === "batch" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("batch")}
            >
              Batch
            </Button>
            <Button
              variant={mode === "blend" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("blend")}
            >
              Blend
            </Button>
          </div>
        </div>
        {mode === "blend" && blendBatches.length > 0 && (
          <Button onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print All Blends
          </Button>
        )}
      </div>

      {/* Batch Mode */}
      {mode === "batch" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Select Batch</h3>
            
            <div className="space-y-2">
              <Label>Search Batch</Label>
              <Input
                placeholder="Search by name, variety..."
                value={batchSearchQuery}
                onChange={(e) => setBatchSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Batch ID</Label>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredBatches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} - {batch.variety} ({new Date(batch.started_at).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="vintage">Include vintage/harvest date</Label>
              <Switch id="vintage" checked={includeVintage} onCheckedChange={setIncludeVintage} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sheet">Print label sheet</Label>
              <Switch id="sheet" checked={printSheet} onCheckedChange={setPrintSheet} />
            </div>
          </Card>
          
          {/* Batch Preview */}
          {selectedBatch && (
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold">Preview</h3>
                <Button
                  onClick={() => handlePrintSingle(selectedBatch.id, "batch")}
                  size="sm"
                  variant="outline"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
              
              <div id={`qr-card-${selectedBatch.id}`} className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <QRCodeSVG
                    value={makeBatchQrUrl(selectedBatch.id)}
                    size={200}
                    level="H"
                  />
                </div>
                
                <div className="text-center space-y-2 w-full">
                  <h4 className="font-semibold text-lg">{selectedBatch.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{selectedBatch.variety}</p>
                    <p>Volume: {selectedBatch.volume}L</p>
                    <p>Stage: {selectedBatch.current_stage}</p>
                    {includeVintage && (
                      <p className="text-xs pt-2">
                        Started: {new Date(selectedBatch.started_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Blend Mode */}
      {mode === "blend" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Create New Blend</h3>
            
            <div className="space-y-2">
              <Label>Blend ID</Label>
              <Input
                value={newBlendName}
                onChange={(e) => setNewBlendName(e.target.value)}
                placeholder="BL-2025-01"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Components</Label>
                <Button size="sm" variant="outline" onClick={addBlendComponent}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {blendComponents.map((comp, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={comp.batch_id}
                      onValueChange={(value) => updateBlendComponent(idx, "batch_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch..." />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map(batch => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} - {batch.variety}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={comp.percent || ""}
                    onChange={(e) => updateBlendComponent(idx, "percent", parseFloat(e.target.value) || 0)}
                    placeholder="%"
                    className="w-20"
                  />
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeBlendComponent(idx)}
                    disabled={blendComponents.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex justify-between items-center text-sm">
                <span>Total:</span>
                <span className={totalPercent === 100 ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>
                  {totalPercent}%
                </span>
              </div>
            </div>
            
            <Button
              onClick={handleCreateBlend}
              disabled={creatingBlend || totalPercent !== 100}
              className="w-full"
            >
              Create Blend & Generate QR
            </Button>
          </Card>
          
          {/* Existing Blends */}
          <div className="space-y-4">
            <h3 className="font-semibold">Existing Blends</h3>
            {blendBatches.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <p className="text-muted-foreground">
                  No blend batches available.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 max-h-[600px] overflow-y-auto">
                {blendBatches.map((blend) => (
                  <Card key={blend.id} className="p-4 relative">
                    <Button
                      onClick={() => handlePrintSingle(blend.id, "blend")}
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    
                    <div id={`qr-card-${blend.id}`} className="flex gap-4 items-center">
                      <div className="bg-white p-2 rounded border">
                        <QRCodeSVG
                          value={makeBlendQrUrl(blend.id)}
                          size={80}
                          level="H"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold">{blend.name}</h4>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>Volume: {blend.total_volume}L</p>
                          {blend.bottles_75cl && blend.bottles_75cl > 0 && (
                            <p>75cl: {blend.bottles_75cl} bottles</p>
                          )}
                          {blend.storage_location && (
                            <p>Location: {blend.storage_location}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
