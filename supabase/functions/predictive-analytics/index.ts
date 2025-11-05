import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisType } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Fetch evidence bags and related data
    const { data: evidenceBags, error: bagsError } = await supabaseClient
      .from('evidence_bags')
      .select(`
        *,
        chain_of_custody_log(count),
        case_evidence(
          cases(
            status,
            created_at,
            offense_type
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (bagsError) throw bagsError;

    // Fetch recent custody logs
    const { data: recentLogs, error: logsError } = await supabaseClient
      .from('chain_of_custody_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (logsError) throw logsError;

    console.log(`Analyzing ${evidenceBags?.length || 0} evidence bags for predictions`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = analysisType === 'risk' 
      ? "You are a predictive analytics AI for evidence management. Analyze evidence data to identify high-risk items based on: type of evidence, number of transfers, time in custody, case status, gaps in chain of custody, and storage conditions. Predict which evidence is at risk of being lost, damaged, or having chain of custody issues."
      : "You are a predictive analytics AI for case investigation timing. Analyze evidence and case data to identify investigations that are likely to be delayed based on: evidence complexity, number of items, case status, time since collection, custody transfer frequency, and evidence type. Predict which cases need urgent attention.";

    const userPrompt = analysisType === 'risk'
      ? `Analyze these evidence bags and identify high-risk items. Return a JSON object with: predictions (array of objects with fields: bagId, riskLevel (low/medium/high), riskFactors (array of strings), recommendedActions (array of strings), urgency (1-10)), summary, and overallRiskScore (0-1).`
      : `Analyze these evidence bags and cases to predict delayed investigations. Return a JSON object with: predictions (array of objects with fields: bagId, caseId, delayRisk (low/medium/high), delayFactors (array of strings), estimatedDaysToCompletion, recommendedActions (array of strings)), summary, and criticalCases (array of case IDs needing immediate attention).`;

    // Use AI for predictive analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `${userPrompt}

Evidence Data:
${JSON.stringify(evidenceBags, null, 2)}

Recent Custody Logs:
${JSON.stringify(recentLogs, null, 2)}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResult = JSON.parse(data.choices[0].message.content);
    
    console.log('Predictive analytics result:', aiResult);

    // Store predictions
    const { data: userData } = await supabaseClient.auth.getUser();
    
    if (aiResult.predictions && aiResult.predictions.length > 0) {
      for (const prediction of aiResult.predictions) {
        await supabaseClient.from('ai_analysis').insert({
          entity_id: prediction.bagId || prediction.caseId,
          entity_type: prediction.bagId ? 'evidence_bag' : 'case',
          analysis_type: 'prediction',
          result: prediction,
          confidence: aiResult.overallRiskScore || 0.5,
          performed_by: userData?.user?.id
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: aiResult,
        itemsAnalyzed: evidenceBags?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in predictive-analytics function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});