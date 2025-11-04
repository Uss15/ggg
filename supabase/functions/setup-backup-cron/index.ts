import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Instructions for setting up automated backups
    const instructions = {
      message: "To enable automated database backups, please configure pg_cron in your Supabase dashboard",
      steps: [
        "1. Go to your Supabase project dashboard",
        "2. Navigate to Database > Extensions",
        "3. Enable 'pg_cron' and 'pg_net' extensions",
        "4. Go to Database > SQL Editor",
        "5. Run the following SQL:",
        `
        SELECT cron.schedule(
          'daily-database-backup',
          '0 2 * * *', -- Every day at 2 AM UTC
          $$
          SELECT
            net.http_post(
                url:='${Deno.env.get('SUPABASE_URL')}/functions/v1/backup-database',
                headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
                body:=concat('{"timestamp": "', now(), '"}')::jsonb
            ) AS request_id;
          $$
        );
        `
      ],
      note: "This will automatically run the backup-database function every day at 2 AM UTC",
      manual_trigger: "You can also manually trigger backups by calling the backup-database edge function"
    };

    return new Response(
      JSON.stringify(instructions, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
