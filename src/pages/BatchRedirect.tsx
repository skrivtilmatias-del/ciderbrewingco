import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const BatchRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      if (!id) {
        toast.error("Invalid batch ID");
        navigate("/");
        return;
      }

      try {
        // Verify batch exists
        const { data, error } = await supabase
          .from("batches")
          .select("id")
          .eq("id", id)
          .single();

        if (error || !data) {
          toast.error("Batch not found");
          navigate("/");
          return;
        }

        // Redirect to main page with batch selected and production tab
        navigate(`/?batch=${encodeURIComponent(id)}&tab=production`, { replace: true });
      } catch (err) {
        console.error("Redirect error:", err);
        setError(true);
        setTimeout(() => navigate("/"), 2000);
      }
    };

    redirect();
  }, [id, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading batch...</p>
      </div>
    </div>
  );
};

export default BatchRedirect;
