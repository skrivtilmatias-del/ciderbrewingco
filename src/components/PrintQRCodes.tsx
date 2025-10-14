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
            @page { 
              size: 38mm 90mm portrait; 
              margin: 0; 
            }
            @media print {
              body { margin: 0; padding: 0; }
              * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              margin: 0; 
              padding: 0;
              width: 38mm;
              height: 90mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-card { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center;
              width: 100%;
              height: 100%;
              padding: 3mm;
              box-sizing: border-box;
              background: white;
            }
            .qr-code { 
              background: white; 
              padding: 0; 
              margin: 0 0 3mm 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code svg {
              width: 30mm !important;
              height: 30mm !important;
              display: block;
            }
            .qr-info { 
              text-align: center; 
              width: 100%;
            }
            h3, h4 { 
              font-size: 11pt; 
              font-weight: 700; 
              margin: 0 0 2mm 0; 
              line-height: 1.2;
              color: #000;
            }
            p { 
              margin: 1mm 0; 
              font-size: 8pt; 
              color: #666; 
              line-height: 1.3;
            }
            .date { 
              font-size: 7pt; 
              margin-top: 1.5mm;
              color: #666;
            }
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
            @page { 
              size: 38mm 90mm portrait; 
              margin: 0; 
            }
            @media print {
              body { margin: 0; padding: 0; }
              * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
              .qr-card { page-break-after: always; }
              .qr-card:last-child { page-break-after: auto; }
            }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              margin: 0; 
              padding: 0;
              background: white;
            }
            .qr-card { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center;
              width: 38mm;
              height: 90mm;
              padding: 3mm;
              box-sizing: border-box;
              background: white;
            }
            .qr-code { 
              background: white; 
              padding: 0; 
              margin: 0 0 3mm 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code svg {
              width: 30mm !important;
              height: 30mm !important;
              display: block;
            }
            .qr-info { 
              text-align: center; 
              width: 100%;
            }
            h3, h4 { 
              font-size: 11pt; 
              font-weight: 700; 
              margin: 0 0 2mm 0; 
              line-height: 1.2;
              color: #000;
            }
            p { 
              margin: 1mm 0; 
              font-size: 8pt; 
              color: #666; 
              line-height: 1.3;
            }
            .date { 
              font-size: 7pt; 
              margin-top: 1.5mm;
              color: #666;
            }
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
              
              <div id={`qr-card-${batch.id}`} className="qr-card flex flex-col items-center space-y-4 pt-8">
                <div className="qr-code bg-white p-3 rounded-lg border shadow-sm">
                  <QRCodeSVG
                    value={makeBatchQrUrl(batch.id)}
                    size={150}
                    level="H"
                  />
                </div>
                
                <div className="qr-info text-center space-y-1">
                  <h4 className="font-semibold text-base">{batch.name}</h4>
                  <p className="text-sm text-muted-foreground">{batch.variety}</p>
                  <p className="text-sm text-muted-foreground">Volume: {batch.volume}L</p>
                  <p className="text-sm text-muted-foreground">Stage: {batch.current_stage}</p>
                  {includeVintage && (
                    <p className="date text-xs text-muted-foreground pt-1">
                      Started: {new Date(batch.started_at).toLocaleDateString()}
                    </p>
                  )}
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
              
              <div id={`qr-card-${blend.id}`} className="qr-card flex flex-col items-center space-y-4 pt-8">
                <div className="qr-code bg-white p-3 rounded-lg border shadow-sm">
                  <QRCodeSVG
                    value={makeBlendQrUrl(blend.id)}
                    size={150}
                    level="H"
                  />
                </div>
                
                <div className="qr-info text-center space-y-1">
                  <h4 className="font-semibold text-base">{blend.name}</h4>
                  <p className="text-sm text-muted-foreground">Volume: {blend.total_volume}L</p>
                  {blend.bottles_75cl && blend.bottles_75cl > 0 && (
                    <p className="text-sm text-muted-foreground">75cl: {blend.bottles_75cl} bottles</p>
                  )}
                  {blend.storage_location && (
                    <p className="text-sm text-muted-foreground">Location: {blend.storage_location}</p>
                  )}
                  <p className="date text-xs text-muted-foreground pt-1">
                    Created: {new Date(blend.created_at).toLocaleDateString()}
                  </p>
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