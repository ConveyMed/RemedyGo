import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  app_name?: string;
  app_url?: string;
}

const generateWelcomeEmail = (data: WelcomeEmailRequest) => `
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
      color: white;
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
    .not-you {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .not-you p { margin: 0 0 10px 0; color: #991b1b; font-size: 14px; }
    .not-you a {
      color: #dc2626;
      font-weight: 600;
      text-decoration: underline;
    }
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
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Welcome to ${data.app_name || 'RemedyGo'}!</h1>
      </div>
      <div class="content">
        <p>Hi${data.name ? ` ${data.name}` : ''},</p>
        <p>Thanks for signing up! Your account has been created and you're ready to get started.</p>
        <p>You can now access all the features and start using the app right away.</p>

        <center>
          <a href="${data.app_url || '#'}" class="button">Open ${data.app_name || 'App'}</a>
        </center>

        <div class="divider"></div>

        <div class="not-you">
          <p>Didn't create this account?</p>
          <p>If you didn't sign up for ${data.app_name || 'this service'}, someone may have used your email by mistake.</p>
          <a href="mailto:support@mysendz.com?subject=Unauthorized%20Account%20-%20${encodeURIComponent(data.email)}&body=I%20did%20not%20create%20an%20account%20with%20this%20email%20address.%20Please%20remove%20it.">
            Click here to report this
          </a>
        </div>
      </div>
      <div class="footer">
        <p>${data.app_name || 'RemedyGo'}</p>
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
    const payload: WelcomeEmailRequest = await req.json();
    console.log("Welcome email request for:", payload.email);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "RemedyGo <noreply@mysendz.com>";

    if (!RESEND_API_KEY) {
      throw new Error("Resend API key not configured");
    }

    if (!payload.email) {
      throw new Error("Email address required");
    }

    const htmlContent = generateWelcomeEmail(payload);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.email,
        subject: `Welcome to ${payload.app_name || 'RemedyGo'}!`,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${resendResponse.status}`);
    }

    const resendData = await resendResponse.json();
    console.log("Welcome email sent:", resendData);

    return new Response(
      JSON.stringify({
        success: true,
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
