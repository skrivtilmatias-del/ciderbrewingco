import QRCodeSVG from "react-qr-code";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

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
  const getBlendUrl = (blendId: string) => {
    const base = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, '') || window.location.origin;
    return `${base}/blend/${blendId}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintSingle = (blendId: string) => {
    const printElement = document.getElementById(`qr-card-${blendId}`);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-lg font-semibold">QR Code Labels</h2>
        <Button onClick={handlePrint} size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print All
        </Button>
      </div>

      {blendBatches.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground">
            No blend batches available to print.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-3">
          {blendBatches.map((blend) => (
            <Card 
              key={blend.id} 
              className="p-6 flex flex-col items-center space-y-4 print:break-inside-avoid print:page-break-inside-avoid relative"
            >
              <Button
                onClick={() => handlePrintSingle(blend.id)}
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 print:hidden"
              >
                <Printer className="h-4 w-4" />
              </Button>
              
              <div id={`qr-card-${blend.id}`} className="qr-card flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={getBlendUrl(blend.id)}
                    size={200}
                    level="H"
                  />
                </div>
                
                <div className="text-center space-y-2 w-full">
                  <h3 className="font-semibold text-lg">{blend.name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Volume: {blend.total_volume}L</p>
                    {blend.bottles_75cl && blend.bottles_75cl > 0 && (
                      <p>75cl: {blend.bottles_75cl} bottles</p>
                    )}
                    {blend.bottles_150cl && blend.bottles_150cl > 0 && (
                      <p>150cl: {blend.bottles_150cl} bottles</p>
                    )}
                    {blend.storage_location && (
                      <p>Location: {blend.storage_location}</p>
                    )}
                    <p className="text-xs pt-2">
                      Created: {new Date(blend.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
