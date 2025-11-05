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
    const { bagId, timeframe } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Fetch custody log for the bag or all recent logs
    let query = supabaseClient
      .from('chain_of_custody_log')
      .select('*, evidence_bags(*), profiles!chain_of_custody_log_performed_by_fkey(full_name, badge_number)')
      .order('timestamp', { ascending: false });

    if (bagId) {
      query = query.eq('bag_id', bagId);
    }

    if (timeframe === 'recent') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('timestamp', oneDayAgo);
    }

    const { data: custodyLogs, error } = await query.limit(100);

    if (error) throw error;

    console.log(`Analyzing ${custodyLogs?.length || 0} custody log entries for anomalies`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to detect anomalies
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
            content: "You are an anomaly detection AI for evidence chain of custody. Analyze custody log entries and identify suspicious patterns such as: missing signatures, delayed transfers (>4 hours), unusual time gaps, repeated transfers to the same person, transfers outside business hours (before 6am or after 10pm), missing location data, or incomplete documentation."
          },
          {
            role: "user",
            content: `Analyze these chain of custody logs and identify anomalies. Return a JSON object with: anomalies (array of objects with fields: logId, type, severity (low/medium/high), description, recommendation), summary (overall assessment), and riskScore (0-1).

Custody Logs:
${JSON.stringify(custodyLogs, null, 2)}`
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
    
    console.log('Anomaly detection result:', aiResult);

    // Store analysis results
    const { data: userData } = await supabaseClient.auth.getUser();
    
    if (aiResult.anomalies && aiResult.anomalies.length > 0) {
      for (const anomaly of aiResult.anomalies) {
        await supabaseClient.from('ai_analysis').insert({
          entity_id: anomaly.logId || bagId,
          entity_type: 'custody_log',
          analysis_type: 'anomaly',
          result: anomaly,
          confidence: aiResult.riskScore,
          performed_by: userData?.user?.id
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: aiResult,
        logsAnalyzed: custodyLogs?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in detect-anomalies function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});