import QRCodeSVG from "react-qr-code";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Printer, Download, FileArchive } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { makeBatchQrUrl, makeBlendQrUrl } from "@/lib/urls";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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

  // Utility functions for bulk download
  const labelToPngBlob = async (node: HTMLElement): Promise<Blob> => {
    const canvas = await html2canvas(node, { scale: 3, backgroundColor: "#ffffff" });
    return await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
  };

  const labelToPdfBlob = async (node: HTMLElement): Promise<Blob> => {
    const png = await labelToPngBlob(node);
    const pdf = new jsPDF({ unit: "mm", format: [38, 90], orientation: "portrait" });
    const img = await new Promise<HTMLImageElement>((r) => {
      const i = new Image();
      i.onload = () => r(i);
      i.src = URL.createObjectURL(png);
    });
    pdf.addImage(img, "PNG", 0, 0, 38, 90);
    return pdf.output("blob");
  };

  const downloadSelectedAsZip = async (type: "png" | "pdf") => {
    const selectedIds = mode === "batch" 
      ? Array.from(selectedBatches) 
      : Array.from(selectedBlends);
    
    if (selectedIds.length === 0) {
      toast.error("Please select labels to download");
      return;
    }

    toast.loading(`Generating ${selectedIds.length} ${type.toUpperCase()} files...`);

    try {
      const zip = new JSZip();
      
      for (const id of selectedIds) {
        const node = document.querySelector<HTMLElement>(`#label-${id}`);
        if (!node) continue;
        
        const item = mode === "batch" 
          ? batches.find(b => b.id === id)
          : blendBatches.find(b => b.id === id);
        
        const name = item ? (mode === "batch" ? (item as Batch).name : (item as BlendBatch).name) : id;
        const blob = type === "png" ? await labelToPngBlob(node) : await labelToPdfBlob(node);
        zip.file(`${name}.${type}`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `labels_${type}_${new Date().toISOString().slice(0, 10)}.zip`);
      
      toast.dismiss();
      toast.success(`Downloaded ${selectedIds.length} labels as ${type.toUpperCase()}`);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to generate ZIP file");
      console.error(error);
    }
  };

  const handleDownloadPDF = async (id: string, name: string) => {
    const element = document.getElementById(`label-${id}`);
    if (!element) return;

    try {
      toast.loading("Generating PDF...");
      
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgWidth = 38;
      const imgHeight = 90;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidth, imgHeight]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${name}-label.pdf`);
      
      toast.dismiss();
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to generate PDF");
      console.error(error);
    }
  };

  const handlePrintSingle = (id: string, type: "batch" | "blend", name: string) => {
    const printElement = document.getElementById(`label-${id}`);
    if (!printElement) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Label - ${name}</title>
          <style>
            @page { 
              size: 38mm 90mm portrait; 
              margin: 0; 
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0;
                -webkit-print-color-adjust: exact !important; 
                color-adjust: exact !important; 
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
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
              background: white;
            }
            .label-card {
              width: 38mm;
              height: 90mm;
              background: white;
              border: 1px solid #d1d5db;
              border-radius: 6mm;
              padding: 5mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              box-shadow: none !important;
            }
            .qr-wrapper {
              width: 28mm;
              height: 28mm;
              background: white;
              padding: 2mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-wrapper svg {
              width: 100% !important;
              height: 100% !important;
              display: block;
            }
            .code {
              margin-top: 3mm;
              font-size: 12pt;
              font-weight: 600;
              color: #111827;
              line-height: 1.2;
            }
            .variety {
              font-size: 10pt;
              color: #111827;
              line-height: 1.2;
              margin-top: 0.5mm;
            }
            .meta {
              font-size: 9pt;
              color: #6B7280;
              line-height: 1.2;
              margin-top: 1mm;
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
              justify-content: flex-start;
              width: 38mm;
              height: 90mm;
              background: white;
              padding: 4mm 2mm;
              page-break-after: always;
            }
            .qr-code { 
              background: white; 
              padding: 0; 
              margin: 0 0 4mm 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-code svg {
              width: 28mm !important;
              height: 28mm !important;
              display: block;
            }
            .qr-info { 
              text-align: center; 
              width: 100%;
            }
            h3, h4 { 
              font-size: 11pt; 
              font-weight: 700; 
              margin: 0 0 1.5mm 0; 
              line-height: 1.1;
              color: #000;
            }
            p { 
              margin: 0.8mm 0; 
              font-size: 8pt; 
              color: #666; 
              line-height: 1.2;
            }
            .date { 
              font-size: 7pt; 
              margin-top: 1mm;
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

  const toggleSelection = (id: string) => {
    if (mode === "batch") {
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
    setSelectedBatches(new Set());
    setSelectedBlends(new Set());
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
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedCount > 0 && (
        <Card className="p-4 print:hidden bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium text-orange-900">{selectedCount} selected</span>
              <div className="flex gap-2">
                <Button onClick={() => downloadSelectedAsZip("pdf")} size="sm" variant="default">
                  <FileArchive className="h-4 w-4 mr-2" />
                  Download PDF ZIP
                </Button>
                <Button onClick={() => downloadSelectedAsZip("png")} size="sm" variant="outline">
                  <FileArchive className="h-4 w-4 mr-2" />
                  Download PNG ZIP
                </Button>
              </div>
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
      )}

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
        </div>
      </Card>

      {/* Content */}
      {mode === "batch" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filteredBatches.map((batch) => (
            <Card key={batch.id} className="p-4 relative overflow-visible">
              <button
                aria-label="Select label"
                className="absolute top-3 left-3 z-10 h-5 w-5 rounded-md border border-gray-300 bg-white flex items-center justify-center shadow-sm data-[checked=true]:bg-orange-500 data-[checked=true]:border-orange-500 data-[checked=true]:text-white transition-colors"
                data-checked={selectedBatches.has(batch.id)}
                onClick={() => toggleSelection(batch.id)}
              >
                {selectedBatches.has(batch.id) ? "✓" : ""}
              </button>
              
              <div className="absolute top-2 right-2 flex gap-2 no-print">
                <Button
                  onClick={() => handleDownloadPDF(batch.id, batch.name)}
                  size="sm"
                  variant="outline"
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handlePrintSingle(batch.id, "batch", batch.name)}
                  size="sm"
                  variant="outline"
                  title="Print Label"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="preview-scale origin-top scale-[0.85] md:scale-90 mt-8">
                <div 
                  id={`label-${batch.id}`} 
                  className="label-card mx-auto w-[38mm] h-[90mm] rounded-[6mm] p-[5mm] bg-white border border-gray-300 text-center flex flex-col items-center justify-start shadow-sm print:shadow-none"
                >
                  <div className="mx-auto w-[28mm] h-[28mm] bg-white p-[2mm] flex items-center justify-center">
                    <QRCodeSVG
                      value={makeBatchQrUrl(batch.id)}
                      size={90}
                      level="M"
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        display: 'block'
                      }}
                    />
                  </div>
                  <div className="mt-3 text-[12pt] font-semibold text-gray-900 leading-tight">{batch.name}</div>
                  <div className="text-[10pt] text-gray-900 leading-tight">{batch.variety}</div>
                  <div className="mt-1 text-[9pt] text-gray-500 leading-tight">Volume: {batch.volume}L</div>
                  <div className="text-[9pt] text-gray-500 leading-tight">Stage: {batch.current_stage}</div>
                  {includeVintage && (
                    <div className="text-[9pt] text-gray-500 leading-tight">
                      Started: {new Date(batch.started_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {mode === "blend" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBlends.map((blend) => (
            <Card key={blend.id} className="p-4 relative overflow-visible">
              <button
                aria-label="Select label"
                className="absolute top-3 left-3 z-10 h-5 w-5 rounded-md border border-gray-300 bg-white flex items-center justify-center shadow-sm data-[checked=true]:bg-orange-500 data-[checked=true]:border-orange-500 data-[checked=true]:text-white transition-colors"
                data-checked={selectedBlends.has(blend.id)}
                onClick={() => toggleSelection(blend.id)}
              >
                {selectedBlends.has(blend.id) ? "✓" : ""}
              </button>
              
              <div className="absolute top-2 right-2 flex gap-2 no-print">
                <Button
                  onClick={() => handleDownloadPDF(blend.id, blend.name)}
                  size="sm"
                  variant="outline"
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handlePrintSingle(blend.id, "blend", blend.name)}
                  size="sm"
                  variant="outline"
                  title="Print Label"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="preview-scale origin-top scale-[0.85] md:scale-90 mt-8">
                <div 
                  id={`label-${blend.id}`} 
                  className="label-card mx-auto w-[38mm] h-[90mm] rounded-[6mm] p-[5mm] bg-white border border-gray-300 text-center flex flex-col items-center justify-start shadow-sm print:shadow-none"
                >
                  <div className="mx-auto w-[28mm] h-[28mm] bg-white p-[2mm] flex items-center justify-center">
                    <QRCodeSVG
                      value={makeBlendQrUrl(blend.id)}
                      size={90}
                      level="M"
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        display: 'block'
                      }}
                    />
                  </div>
                  <div className="mt-3 text-[12pt] font-semibold text-gray-900 leading-tight">{blend.name}</div>
                  <div className="text-[10pt] text-gray-900 leading-tight">Blend</div>
                  <div className="mt-1 text-[9pt] text-gray-500 leading-tight">Volume: {blend.total_volume}L</div>
                  {blend.bottles_75cl && blend.bottles_75cl > 0 && (
                    <div className="text-[9pt] text-gray-500 leading-tight">75cl: {blend.bottles_75cl} bottles</div>
                  )}
                  {blend.storage_location && (
                    <div className="text-[9pt] text-gray-500 leading-tight">Location: {blend.storage_location}</div>
                  )}
                  <div className="text-[9pt] text-gray-500 leading-tight">
                    Created: {new Date(blend.created_at).toLocaleDateString()}
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