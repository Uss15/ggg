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
    const { imageUrl, bagId } = await req.json();
    
    if (!imageUrl || !bagId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageUrl, bagId' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Classifying evidence from image:', imageUrl);

    // Call Lovable AI for image classification
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
            content: "You are an evidence classification AI assistant. Analyze images of evidence and classify them into categories: Drugs, Weapons, Electronics, Documents, Biological Samples, Clothing, Vehicles, or Other. Provide a confidence score and detailed description of what you see."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Classify this evidence image. Return a JSON object with: category (one of: Drugs, Weapons, Electronics, Documents, Biological Samples, Clothing, Vehicles, Other), confidence (0-1), description (detailed description of what you see), and tags (array of relevant keywords)."
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
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
    
    console.log('Classification result:', aiResult);

    // Store result in database
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: userData } = await supabaseClient.auth.getUser();
    
    await supabaseClient.from('ai_analysis').insert({
      entity_id: bagId,
      entity_type: 'evidence_bag',
      analysis_type: 'classification',
      result: aiResult,
      confidence: aiResult.confidence,
      performed_by: userData?.user?.id
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        classification: aiResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in classify-evidence function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});