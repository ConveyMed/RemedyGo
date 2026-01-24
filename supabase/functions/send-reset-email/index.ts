import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetEmailRequest {
  email: string;
  app_name?: string;
  app_url?: string;
}

const generateResetEmail = (data: { email: string; resetLink: string; app_name?: string }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #f1f5f9;
    }
    .wrapper { padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 40px 30px;
      border-radius: 12px 12px 0 0;
      text-align: center;
    }
    .header h1 { margin: 0; font-size: 28px; }
    .content {
      background: #ffffff;
      padding: 40px 30px;
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    .button {
      display: inline-block;
      background: #1e40af;
      color: white !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 20px;
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 30px 0;
    }
    .security-note {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .security-note p { margin: 0 0 10px 0; color: #92400e; font-size: 14px; }
    .footer {
      text-align: center;
      padding: 20px 30px;
      color: #64748b;
      font-size: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 12px 12px;
    }
    .link-text {
      word-break: break-all;
      font-size: 12px;
      color: #64748b;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Reset Your Password</h1>
      </div>
      <div class="content">
        <p>Hi,</p>
        <p>We received a request to reset the password for your ${data.app_name || 'RemedyGo'} account associated with <strong>${data.email}</strong>.</p>
        <p>Click the button below to create a new password:</p>

        <center>
          <a href="${data.resetLink}" class="button">Reset Password</a>
        </center>

        <p class="link-text">
          Or copy and paste this link into your browser:<br/>
          ${data.resetLink}
        </p>

        <div class="divider"></div>

        <div class="security-note">
          <p><strong>Didn't request this?</strong></p>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        </div>
      </div>
      <div class="footer">
        <p>${data.app_name || 'RemedyGo'}</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>This email was sent to ${data.email}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: ResetEmailRequest = await req.json();
    console.log("Password reset request for:", payload.email);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "RemedyGo <noreply@mysendz.com>";
    const APP_URL = payload.app_url || Deno.env.get("APP_URL") || "https://remedygo.netlify.app";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    if (!RESEND_API_KEY) {
      throw new Error("Resend API key not configured");
    }

    if (!payload.email) {
      throw new Error("Email address required");
    }

    // Create admin client to generate recovery link
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate password recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: payload.email,
      options: {
        redirectTo: `${APP_URL}/reset-password`,
      },
    });

    if (linkError) {
      console.error("Error generating recovery link:", linkError);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email will be sent." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetLink = linkData.properties?.action_link;

    if (!resetLink) {
      throw new Error("Failed to generate reset link");
    }

    const htmlContent = generateResetEmail({
      email: payload.email,
      resetLink,
      app_name: payload.app_name,
    });

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.email,
        subject: `Reset Your ${payload.app_name || 'RemedyGo'} Password`,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${resendResponse.status}`);
    }

    const resendData = await resendResponse.json();
    console.log("Password reset email sent:", resendData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent",
        resend_id: resendData.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
