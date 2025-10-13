import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const BatchRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      // Verify batch exists
      const { data, error } = await supabase
        .from("batches")
        .select("id")
        .eq("id", id)
        .single();

      if (error || !data) {
        navigate("/");
        return;
      }

      // Redirect to main page - in a real app, you might want to open a specific batch view
      navigate(`/?batch=${id}`);
    };

    redirect();
  }, [id, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
};

export default BatchRedirect;
