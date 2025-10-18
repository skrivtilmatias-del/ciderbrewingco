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
      if (!id) {
        navigate(paths.batches(), { replace: true });
        return;
      }

      // Validate signature and timestamp
      const timestamp = searchParams.get("ts");
      const signature = searchParams.get("sig");
      const ttl = parseInt(searchParams.get("ttl") || "1800");

      if (timestamp && signature) {
        const now = Math.floor(Date.now() / 1000);
        const age = now - parseInt(timestamp);

        if (age > ttl) {
          setError("This QR code has expired. Please request a new one.");
          return;
        }
      }

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Authenticated - go directly to production page with batch selected
        navigate(`/production?batch=${id}`, { replace: true });
      } else {
        // Not authenticated - redirect to login with next parameter
        navigate(paths.auth(`/production?batch=${id}`), { replace: true });
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
