import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const BatchRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  useEffect(() => {
    let fallbackTimer: number | undefined;

    const go = (targetId: string) => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      navigate(`/?batch=${encodeURIComponent(targetId)}&tab=production`, { replace: true });
    };

    const redirect = async () => {
      if (!id) {
        go("");
        return;
      }

      // Hard fallback in case network is slow/unavailable
      fallbackTimer = window.setTimeout(() => go(id), 1500);

      // Best-effort existence check (non-blocking)
      try {
        const { data } = await supabase
          .from("batches")
          .select("id")
          .eq("id", id)
          .maybeSingle();

        // Navigate regardless – if not found, main page will handle it
        go(id);
      } catch {
        go(id);
      }
    };

    redirect();

    return () => {
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, [id, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Opening batch…</p>
      </div>
    </div>
  );
};

export default BatchRedirect;
