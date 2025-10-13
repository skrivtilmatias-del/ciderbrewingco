import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const BlendRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  useEffect(() => {
    let fallbackTimer: number | undefined;

    const go = (targetId: string) => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      navigate(`/blend/${encodeURIComponent(targetId)}`, { replace: true });
    };

    const redirect = async () => {
      if (!id) {
        go("");
        return;
      }

      // Hard fallback in case network is slow/unavailable
      fallbackTimer = window.setTimeout(() => go(id), 1500);

      try {
        // Best-effort existence check (non-blocking)
        const { data } = await supabase
          .from("blend_batches")
          .select("id")
          .eq("id", id)
          .maybeSingle();

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
        <p className="text-sm text-muted-foreground">Opening blend…</p>
      </div>
    </div>
  );
};

export default BlendRedirect;
