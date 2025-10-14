import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import QRCodeSVG from "react-qr-code";
import { makeBatchQrUrl, makeBlendQrUrl } from "@/lib/urls";
import { Loader2 } from "lucide-react";

interface BatchData {
  id: string;
  name: string;
  variety: string;
  started_at: string;
}

interface BlendData {
  id: string;
  name: string;
  created_at: string;
}

const PrintLabels = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<(BatchData | BlendData)[]>([]);
  const mode = searchParams.get("mode") || "batch";
  const ids = searchParams.get("ids")?.split(",") || [];

  useEffect(() => {
    const loadData = async () => {
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      if (mode === "batch") {
        const { data } = await supabase
          .from("batches")
          .select("id, name, variety, started_at")
          .in("id", ids);
        
        if (data) setItems(data as BatchData[]);
      } else if (mode === "blend") {
        const { data } = await supabase
          .from("blend_batches")
          .select("id, name, created_at")
          .in("id", ids);
        
        if (data) setItems(data as BlendData[]);
      }

      setLoading(false);
      
      // Auto-print after content loads
      setTimeout(() => {
        window.print();
      }, 500);
    };

    loadData();
  }, [ids, mode]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="print-sheet">
      {items.map((item) => {
        const qrUrl = mode === "batch" 
          ? makeBatchQrUrl(item.id)
          : makeBlendQrUrl(item.id);
        
        const isBatch = 'variety' in item;
        const subtitle = isBatch 
          ? `${item.variety} • ${new Date(item.started_at).toLocaleDateString()}`
          : new Date(item.created_at).toLocaleDateString();

        return (
          <div key={item.id} className="print-label">
            <div className="print-qr">
              <QRCodeSVG 
                value={qrUrl} 
                size={256}
                level="H"
              />
            </div>
            <div className="print-label-text">
              <div className="print-label-name">{item.name}</div>
              <div className="print-label-subtitle">{subtitle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrintLabels;
