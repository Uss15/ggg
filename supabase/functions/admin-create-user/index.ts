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
    const { email, fullName, badgeNumber, phone, role } = await req.json();

    if (!email || !fullName) {
      return new Response(JSON.stringify({ error: 'Email and full name are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authHeader = req.headers.get('Authorization');
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader! } } });
    const adminClient = createClient(url, service);

    const { data: userData } = await userClient.auth.getUser();
    const adminId = userData?.user?.id;
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify caller is admin using RLS-protected client
    const { data: roleRow, error: roleCheckError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleCheckError || !roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create user with email confirmed; they can reset password via Forgot Password
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        badge_number: badgeNumber,
        phone,
      },
    });

    if (createError) {
      console.error('Create user error', createError);
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Assign role if provided (use upsert to handle trigger-assigned roles)
    if (role) {
      const { error: assignError } = await adminClient
        .from('user_roles')
        .upsert({ user_id: created.user!.id, role }, { onConflict: 'user_id,role', ignoreDuplicates: true });
      if (assignError) {
        console.error('Assign role error', assignError);
        return new Response(JSON.stringify({ error: assignError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Send password reset email
    try {
      const resetLink = `${url}/auth/v1/verify?token_hash={token_hash}&type=recovery&redirect_to=${url}`;
      const { data: resetData, error: resetError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
      });

      if (resetError) {
        console.error('Generate reset link error:', resetError);
      } else if (resetData?.properties?.action_link) {
        // Send the password reset email
        await adminClient.functions.invoke('send-password-reset', {
          body: {
            email,
            resetLink: resetData.properties.action_link,
          }
        });
      }
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail user creation if email fails
    }

    return new Response(JSON.stringify({ success: true, userId: created.user!.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('admin-create-user error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
