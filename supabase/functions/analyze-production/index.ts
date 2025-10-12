import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batches, blendBatches, tastingAnalyses } = await req.json();
    console.log("Analyzing production data:", { 
      batchCount: batches?.length, 
      blendCount: blendBatches?.length,
      tastingCount: tastingAnalyses?.length 
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare data summary for AI analysis
    const dataSummary = {
      totalBatches: batches.length,
      completedBatches: batches.filter((b: any) => b.currentStage === "Complete").length,
      totalVolume: batches.reduce((sum: number, b: any) => sum + b.volume, 0),
      varieties: [...new Set(batches.map((b: any) => b.variety))],
      varietyVolumes: batches.reduce((acc: any, b: any) => {
        acc[b.variety] = (acc[b.variety] || 0) + b.volume;
        return acc;
      }, {}),
      stages: batches.reduce((acc: any, b: any) => {
        acc[b.currentStage] = (acc[b.currentStage] || 0) + 1;
        return acc;
      }, {}),
      totalBlends: blendBatches.length,
      totalBottles75cl: blendBatches.reduce((sum: number, b: any) => sum + (b.bottles_75cl || 0), 0),
      totalBottles150cl: blendBatches.reduce((sum: number, b: any) => sum + (b.bottles_150cl || 0), 0),
      avgTastingScore: tastingAnalyses.length > 0 
        ? tastingAnalyses.reduce((sum: number, t: any) => sum + (t.overall_score || 0), 0) / tastingAnalyses.length 
        : null,
      topScoringBlends: tastingAnalyses
        .filter((t: any) => t.overall_score != null)
        .sort((a: any, b: any) => b.overall_score - a.overall_score)
        .slice(0, 3)
        .map((t: any) => ({ score: t.overall_score, blend: t.blend_batch_id })),
    };

    const prompt = `You are an expert cider production analyst. Analyze this production data and provide 4-6 actionable insights in a conversational, friendly tone. Focus on:
- Production efficiency and trends
- Quality patterns from tasting scores
- Inventory optimization
- Variety performance
- Strategic recommendations

Data:
${JSON.stringify(dataSummary, null, 2)}

Provide insights as a JSON array of objects with this structure:
[
  {
    "title": "Brief insight title (max 8 words)",
    "description": "Detailed explanation with specific numbers and actionable advice (2-3 sentences)",
    "type": "success" | "warning" | "info" | "recommendation",
    "icon": "TrendingUp" | "Award" | "Package" | "AlertCircle" | "Lightbulb" | "BarChart3"
  }
]

Make insights specific, data-driven, and actionable. Use actual numbers from the data.`;

    console.log("Calling AI gateway...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a cider production analytics expert. Always respond with valid JSON arrays only." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log("AI response received");
    
    let insights;
    try {
      const content = aiData.choices[0].message.content;
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      insights = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      insights = [{
        title: "Analysis Complete",
        description: "Your production data has been analyzed. Continue monitoring your batches for optimal results.",
        type: "info",
        icon: "BarChart3"
      }];
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-production:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
