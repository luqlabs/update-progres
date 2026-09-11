import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentFailedRequest {
  email: string;
  customer_name: string;
  amount: number;
  currency: string;
}

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

const generatePaymentFailedHtml = (
  firstName: string,
  amount: string
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed - Quizabl</title>
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
              
              <!-- Warning Icon -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;width:64px;height:64px;background-color:#fef2f2;border-radius:50%;line-height:64px;">
                  <span style="font-size:32px;">⚠️</span>
                </div>
              </div>
              
              <!-- Greeting -->
              <h1 style="color:#111827;font-size:24px;font-weight:700;margin:0 0 16px;text-align:center;">Action Required: Payment Failed</h1>
              
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Hi ${firstName},
              </p>
              
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
                We were unable to process your payment of <strong>${amount}</strong> for your Quizabl subscription.
              </p>
              
              <!-- Urgent Box -->
              <div style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;padding:16px 20px;margin-bottom:24px;">
                <p style="color:#991b1b;font-size:14px;font-weight:600;margin:0 0 8px;">Why this matters:</p>
                <p style="color:#991b1b;font-size:14px;line-height:1.5;margin:0;">
                  If we can't process your payment, your access to premium features may be interrupted. Please update your payment method as soon as possible to avoid any disruption.
                </p>
              </div>
              
              <!-- Common Reasons -->
              <h2 style="color:#111827;font-size:16px;font-weight:600;margin:0 0 12px;">Common reasons for payment failure:</h2>
              
              <table role="presentation" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="color:#6b7280;font-size:14px;">•</span>
                  </td>
                  <td style="padding:6px 0 6px 8px;color:#374151;font-size:14px;">Expired credit or debit card</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="color:#6b7280;font-size:14px;">•</span>
                  </td>
                  <td style="padding:6px 0 6px 8px;color:#374151;font-size:14px;">Insufficient funds</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="color:#6b7280;font-size:14px;">•</span>
                  </td>
                  <td style="padding:6px 0 6px 8px;color:#374151;font-size:14px;">Card declined by your bank</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <span style="color:#6b7280;font-size:14px;">•</span>
                  </td>
                  <td style="padding:6px 0 6px 8px;color:#374151;font-size:14px;">Outdated billing information</td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="https://quizabl.com/settings/billing" style="display:inline-block;background-color:#f97316;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Update Payment Method</a>
              </div>
              
              <!-- Help Section -->
              <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin-bottom:24px;">
                <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">
                  <strong>Need help?</strong> If you're having trouble updating your payment method or believe this is an error, please contact us at <a href="mailto:support@quizabl.com" style="color:#f97316;text-decoration:none;font-weight:600;">support@quizabl.com</a> and we'll be happy to help.
                </p>
              </div>
              
              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
                We'll automatically retry the payment in a few days. To avoid any interruption, please update your payment method now.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:0;">
                You received this email because a payment for your subscription failed.<br/>
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
    const { email, customer_name, amount, currency }: PaymentFailedRequest = await req.json();

    console.log("[PAYMENT-FAILED-EMAIL] Sending to:", email);

    const firstName = customer_name?.split(" ")[0] || "there";
    const formattedAmount = formatCurrency(amount, currency);

    const { data, error } = await resend.emails.send({
      from: "Quizabl <hello@updates.quizabl.com>",
      to: [email],
      subject: "⚠️ Action Required: Payment failed for Quizabl",
      html: generatePaymentFailedHtml(firstName, formattedAmount),
    });

    if (error) {
      console.error("[PAYMENT-FAILED-EMAIL] Resend API error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("[PAYMENT-FAILED-EMAIL] Sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[PAYMENT-FAILED-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
