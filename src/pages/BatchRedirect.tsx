import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { paths } from "@/routes/paths";

const BatchRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        if (!id) {
          navigate(paths.batches(), { replace: true });
          return;
        }

        // Validate timestamp/ttl if present
        const timestamp = searchParams.get("ts");
        const signature = searchParams.get("sig");
        const ttl = parseInt(searchParams.get("ttl") || "1800", 10);

        if (timestamp && signature) {
          const now = Math.floor(Date.now() / 1000);
          const tsNum = parseInt(timestamp, 10);
          if (!Number.isNaN(tsNum) && !Number.isNaN(ttl)) {
            const age = now - tsNum;
            if (age > ttl) {
              setError("This QR code has expired. Please request a new one.");
              return;
            }
          }
        }

        // Auth check
        const { data: { session } } = await supabase.auth.getSession();

        const target = `/production?batch=${encodeURIComponent(id)}`;
        if (session) {
          navigate(target, { replace: true });
        } else {
          navigate(paths.auth(target), { replace: true });
        }
      } catch (e) {
        console.error('BatchRedirect failed', e);
        setError('We could not open this batch. Please scan again or open the app and navigate to Production.');
      }
    };

    handleRedirect();
  }, [id, navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Invalid QR Code</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return null;
};

export default BatchRedirect;
