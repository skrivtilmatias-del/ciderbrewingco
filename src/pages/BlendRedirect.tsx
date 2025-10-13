import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const BlendRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      // Verify blend exists
      const { data, error } = await supabase
        .from("blend_batches")
        .select("id")
        .eq("id", id)
        .single();

      if (error || !data) {
        navigate("/");
        return;
      }

      // Redirect to public blend page
      navigate(`/blend/${id}`);
    };

    redirect();
  }, [id, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
};

export default BlendRedirect;
