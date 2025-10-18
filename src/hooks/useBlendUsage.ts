import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UsageMap = Record<string, number>; // source_batch_id -> liters used (incl. spillage)

const parseNum = (v: any): number => {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

export const useBlendUsage = () => {
  const { data, isLoading, error } = useQuery<UsageMap>({
    queryKey: ["blend-usage-agg"],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blend_components")
        .select(
          `source_batch_id, volume_liters, percentage, spillage,
           blend_batches:blend_batch_id(total_volume)`
        );
      if (error) throw error;

      const usage: UsageMap = {};
      for (const row of (data as any[])) {
        const sourceId = row.source_batch_id as string;
        const vol = parseNum(row.volume_liters);
        const perc = parseNum(row.percentage);
        const spillage = parseNum(row.spillage);
        const blendTotal = parseNum(row.blend_batches?.total_volume);

        const derived = vol > 0 ? vol : (perc > 0 ? (perc / 100) * blendTotal : 0);
        const used = derived + spillage;
        usage[sourceId] = (usage[sourceId] || 0) + used;
      }
      return usage;
    },
  });

  return { usageMap: data || {}, isLoading, error };
};
