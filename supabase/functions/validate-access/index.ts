import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  latitude?: number;
  longitude?: number;
  ip_address?: string;
  user_agent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const body: ValidationRequest = await req.json();
    const { latitude, longitude, ip_address, user_agent } = body;

    let locationAuthorized: boolean | null = null;
    let ipAuthorized = true;
    let eventStatus = 'success';
    const validationResults: any = {};

    // Validate IP address if provided
    if (ip_address) {
      const { data: ipCheck, error: ipError } = await supabaseClient
        .rpc('check_ip_access', { p_ip_address: ip_address });

      if (ipError) {
        console.error('IP check error:', ipError);
      } else {
        ipAuthorized = ipCheck as boolean;
        validationResults.ip_authorized = ipAuthorized;
        
        if (!ipAuthorized) {
          eventStatus = 'blocked';
        }
      }
    }

    // Validate geofence if coordinates provided
    if (latitude !== undefined && longitude !== undefined) {
      const { data: geoCheck, error: geoError } = await supabaseClient
        .rpc('validate_geofence', {
          p_latitude: latitude,
          p_longitude: longitude
        });

      if (geoError) {
        console.error('Geofence check error:', geoError);
        locationAuthorized = false;
      } else {
        locationAuthorized = (geoCheck && geoCheck.length > 0) ? true : false;
        validationResults.location_authorized = locationAuthorized;
        validationResults.zone = geoCheck?.[0] || null;
        
        if (!locationAuthorized) {
          eventStatus = 'blocked';
        }
      }
    }

    // Log security event
    await supabaseClient.rpc('log_security_event', {
      p_user_id: user.id,
      p_event_type: 'api_access',
      p_event_status: eventStatus,
      p_ip_address: ip_address || null,
      p_user_agent: user_agent || null,
      p_latitude: latitude || null,
      p_longitude: longitude || null,
      p_location_authorized: locationAuthorized,
      p_metadata: {
        validation_results: validationResults,
        timestamp: new Date().toISOString()
      }
    });

    // Determine if access should be granted
    const accessGranted = ipAuthorized && (locationAuthorized === null || locationAuthorized === true);

    return new Response(
      JSON.stringify({
        access_granted: accessGranted,
        user_id: user.id,
        validation_results: validationResults,
        message: accessGranted 
          ? 'Access granted' 
          : 'Access denied: ' + (!ipAuthorized ? 'IP blocked' : 'Unauthorized location')
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: accessGranted ? 200 : 403,
      }
    );
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        access_granted: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
