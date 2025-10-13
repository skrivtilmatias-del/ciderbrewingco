import QRCodeSVG from "react-qr-code";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { makeBatchQrUrl, makeBlendQrUrl } from "@/lib/urls";
import { Checkbox } from "@/components/ui/checkbox";

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

interface PrintQRCodesProps {
  blendBatches: BlendBatch[];
}

export const PrintQRCodes = ({ blendBatches }: PrintQRCodesProps) => {
  const [mode, setMode] = useState<"batch" | "blend">("batch");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeVintage, setIncludeVintage] = useState(true);
  
  // Selection states
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [selectedBlends, setSelectedBlends] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from("batches")
      .select("id, name, variety, volume, started_at, current_stage")
      .order("started_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load batches");
      return;
    }
    setBatches(data || []);
  };

  const handlePrintSingle = (id: string, type: "batch" | "blend", name: string) => {
    const printElement = document.getElementById(`qr-card-${id}`);
    if (!printElement) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${name}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              margin: 0; 
            }
            .qr-card { 
              padding: 24px; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              max-width: 400px; 
              background: white;
            }
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

  const handlePrintMultiple = () => {
    const selectedItems = mode === "batch" 
      ? Array.from(selectedBatches).map(id => batches.find(b => b.id === id)!).filter(Boolean)
      : Array.from(selectedBlends).map(id => blendBatches.find(b => b.id === id)!).filter(Boolean);

    if (selectedItems.length === 0) {
      toast.error("Please select items to print");
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const itemsHtml = selectedItems.map(item => {
      const element = document.getElementById(`qr-card-${item.id}`);
      return element ? element.innerHTML : '';
    }).join('<div style="page-break-before: always;"></div>');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Multiple QR Codes</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              margin: 0; 
              background: white;
            }
            .qr-card { 
              padding: 24px; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              max-width: 400px; 
              margin: 20px auto;
              background: white;
            }
            .qr-code { background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
            .qr-info { text-align: center; }
            h3, h4 { font-size: 18px; font-weight: 600; margin: 0 0 8px 0; }
            p { margin: 4px 0; font-size: 14px; color: #6b7280; }
            .date { font-size: 12px; padding-top: 8px; }
          </style>
        </head>
        <body>
          ${itemsHtml}
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

  const toggleSelection = (id: string, type: "batch" | "blend") => {
    if (type === "batch") {
      const newSelection = new Set(selectedBatches);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      setSelectedBatches(newSelection);
    } else {
      const newSelection = new Set(selectedBlends);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      setSelectedBlends(newSelection);
    }
  };

  const selectAll = () => {
    if (mode === "batch") {
      setSelectedBatches(new Set(filteredBatches.map(b => b.id)));
    } else {
      setSelectedBlends(new Set(filteredBlends.map(b => b.id)));
    }
  };

  const clearSelection = () => {
    if (mode === "batch") {
      setSelectedBatches(new Set());
    } else {
      setSelectedBlends(new Set());
    }
  };

  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.variety.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBlends = blendBatches.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = mode === "batch" ? selectedBatches.size : selectedBlends.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">QR Code Generator</h2>
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={mode === "batch" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setMode("batch");
                clearSelection();
              }}
            >
              Batches
            </Button>
            <Button
              variant={mode === "blend" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setMode("blend");
                clearSelection();
              }}
            >
              Blends
            </Button>
          </div>
        </div>
        
        {selectedCount > 0 && (
          <Button onClick={handlePrintMultiple} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print Selected ({selectedCount})
          </Button>
        )}
      </div>

      {/* Controls */}
      <Card className="p-4 print:hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={`Search ${mode === "batch" ? "batches" : "blends"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {mode === "batch" && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="vintage"
                  checked={includeVintage}
                  onCheckedChange={setIncludeVintage}
                />
                <Label htmlFor="vintage" className="text-sm">Include vintage date</Label>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {mode === "batch" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map((batch) => (
            <Card key={batch.id} className="p-4 relative">
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedBatches.has(batch.id)}
                  onCheckedChange={() => toggleSelection(batch.id, "batch")}
                />
              </div>
              
              <Button
                onClick={() => handlePrintSingle(batch.id, "batch", batch.name)}
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
              >
                <Printer className="h-4 w-4" />
              </Button>
              
              <div id={`qr-card-${batch.id}`} className="flex flex-col items-center space-y-4 pt-6">
                <div className="bg-white p-3 rounded-lg border shadow-sm">
                  <QRCodeSVG
                    value={makeBatchQrUrl(batch.id)}
                    size={150}
                    level="H"
                  />
                </div>
                
                <div className="text-center space-y-1 w-full">
                  <h4 className="font-semibold text-base">{batch.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>{batch.variety}</p>
                    <p>Volume: {batch.volume}L</p>
                    <p>Stage: {batch.current_stage}</p>
                    {includeVintage && (
                      <p className="text-xs pt-1">
                        Started: {new Date(batch.started_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {mode === "blend" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBlends.map((blend) => (
            <Card key={blend.id} className="p-4 relative">
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedBlends.has(blend.id)}
                  onCheckedChange={() => toggleSelection(blend.id, "blend")}
                />
              </div>
              
              <Button
                onClick={() => handlePrintSingle(blend.id, "blend", blend.name)}
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
              >
                <Printer className="h-4 w-4" />
              </Button>
              
              <div id={`qr-card-${blend.id}`} className="flex flex-col items-center space-y-4 pt-6">
                <div className="bg-white p-3 rounded-lg border shadow-sm">
                  <QRCodeSVG
                    value={makeBlendQrUrl(blend.id)}
                    size={150}
                    level="H"
                  />
                </div>
                
                <div className="text-center space-y-1 w-full">
                  <h4 className="font-semibold text-base">{blend.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>Volume: {blend.total_volume}L</p>
                    {blend.bottles_75cl && blend.bottles_75cl > 0 && (
                      <p>75cl: {blend.bottles_75cl} bottles</p>
                    )}
                    {blend.storage_location && (
                      <p>Location: {blend.storage_location}</p>
                    )}
                    <p className="text-xs pt-1">
                      Created: {new Date(blend.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty States */}
      {mode === "batch" && filteredBatches.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground">
            {searchQuery ? "No batches match your search" : "No batches available"}
          </p>
        </Card>
      )}

      {mode === "blend" && filteredBlends.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground">
            {searchQuery ? "No blends match your search" : "No blends available"}
          </p>
        </Card>
      )}
    </div>
  );
};