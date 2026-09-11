import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionCanceledRequest {
  email: string;
  customer_name: string;
  plan_name: string;
  access_until: string; // ISO date string
}

const generateSubscriptionCanceledHtml = (
  firstName: string,
  planName: string,
  accessUntil: string
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Canceled - Quizabl</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:40px;">
              <!-- Logo -->
              <div style="text-align:center;margin-bottom:32px;">
                <img src="https://quizabl.com/logo.png" alt="Quizabl" style="height:40px;" />
              </div>
              
              <!-- Greeting -->
              <h1 style="color:#111827;font-size:24px;font-weight:700;margin:0 0 24px;">We're sorry to see you go</h1>
              
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Hi ${firstName},
              </p>
              
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Your ${planName} subscription has been canceled. We're sad to see you leave, but we understand.
              </p>
              
              <!-- Access Info Box -->
              <div style="background-color:#fef3c7;border-radius:8px;padding:20px;margin-bottom:24px;">
                <p style="color:#92400e;font-size:14px;font-weight:600;margin:0 0 8px;">Good news!</p>
                <p style="color:#92400e;font-size:14px;line-height:1.5;margin:0;">
                  You'll continue to have access to all premium features until <strong>${accessUntil}</strong>.
                </p>
              </div>
              
              <!-- What You'll Lose Section -->
              <h2 style="color:#111827;font-size:18px;font-weight:600;margin:0 0 16px;">What you'll lose access to:</h2>
              
              <table role="presentation" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <span style="color:#ef4444;font-size:14px;">✕</span>
                  </td>
                  <td style="padding:8px 0 8px 12px;color:#374151;font-size:14px;">Unlimited quiz, flashcard, and game creation</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <span style="color:#ef4444;font-size:14px;">✕</span>
                  </td>
                  <td style="padding:8px 0 8px 12px;color:#374151;font-size:14px;">Advanced AI generation features</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <span style="color:#ef4444;font-size:14px;">✕</span>
                  </td>
                  <td style="padding:8px 0 8px 12px;color:#374151;font-size:14px;">Detailed analytics and insights</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;">
                    <span style="color:#ef4444;font-size:14px;">✕</span>
                  </td>
                  <td style="padding:8px 0 8px 12px;color:#374151;font-size:14px;">Priority support</td>
                </tr>
              </table>
              
              <!-- Changed Your Mind Section -->
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Changed your mind? You can reactivate your subscription anytime to get back all your premium features.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="https://quizabl.com/upgrade" style="display:inline-block;background-color:#f97316;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Reactivate Subscription</a>
              </div>
              
              <!-- Feedback Request -->
              <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin-bottom:24px;">
                <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">
                  <strong>We'd love your feedback.</strong> If there's anything we could have done better, please let us know by replying to this email or reaching out to <a href="mailto:support@quizabl.com" style="color:#f97316;text-decoration:none;font-weight:600;">support@quizabl.com</a>.
                </p>
              </div>
              
              <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">
                Thank you for being part of the Quizabl community. We hope to see you again soon!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:0;">
                You received this email because your subscription was canceled.<br/>
                © ${new Date().getFullYear()} Quizabl. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, customer_name, plan_name, access_until }: SubscriptionCanceledRequest = await req.json();

    console.log("[CANCELED-EMAIL] Sending to:", email);

    const firstName = customer_name?.split(" ")[0] || "there";
    const formattedAccessUntil = new Date(access_until).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const { data, error } = await resend.emails.send({
      from: "Quizabl <hello@updates.quizabl.com>",
      to: [email],
      subject: "We're sorry to see you go",
      html: generateSubscriptionCanceledHtml(firstName, plan_name, formattedAccessUntil),
    });

    if (error) {
      console.error("[CANCELED-EMAIL] Resend API error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("[CANCELED-EMAIL] Sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[CANCELED-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
