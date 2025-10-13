import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const BlendRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      if (!id) {
        toast.error("Invalid blend ID");
        navigate("/");
        return;
      }

      try {
        // Verify blend exists
        const { data, error } = await supabase
          .from("blend_batches")
          .select("id")
          .eq("id", id)
          .single();

        if (error || !data) {
          toast.error("Blend not found");
          navigate("/");
          return;
        }

        // Redirect to public blend page
        navigate(`/blend/${id}`, { replace: true });
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
        <p className="text-sm text-muted-foreground">Loading blend...</p>
      </div>
    </div>
  );
};

export default BlendRedirect;
