import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink }: PasswordResetRequest = await req.json();

    console.log("Sending password reset email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Evidence System <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your Password - Evidence Tracking System",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 2px solid #2563eb;">
                        <div style="display: inline-flex; align-items: center; gap: 10px;">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                          <h1 style="margin: 0; color: #1e293b; font-size: 24px; font-weight: 600;">Evidence Tracking System</h1>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 20px; font-weight: 600;">Reset Your Password</h2>
                        <p style="margin: 0 0 20px; color: #475569; font-size: 16px; line-height: 1.5;">
                          We received a request to reset the password for your Evidence Tracking System account.
                        </p>
                        <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 1.5;">
                          Click the button below to reset your password. This link will expire in 1 hour for security reasons.
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td align="center" style="padding: 0 0 30px;">
                              <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 10px; color: #64748b; font-size: 14px; line-height: 1.5;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 30px; color: #2563eb; font-size: 14px; word-break: break-all;">
                          ${resetLink}
                        </p>
                        
                        <!-- Security Notice -->
                        <div style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px; margin-bottom: 20px;">
                          <p style="margin: 0; color: #dc2626; font-size: 14px; font-weight: 600;">
                            Security Notice
                          </p>
                          <p style="margin: 10px 0 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
                            If you didn't request a password reset, please ignore this email or contact your system administrator immediately. Your password will not be changed unless you click the link above.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
                          This is an automated message from the Evidence Tracking System.<br>
                          Chain of Custody Management System
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
