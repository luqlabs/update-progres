import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PurchaseConfirmationRequest {
  email: string;
  customer_name: string;
  plan_name: string;
  amount: number;
  currency: string;
  billing_type: string; // 'lifetime', 'monthly', 'yearly'
}

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

const getBillingTypeLabel = (billingType: string): string => {
  switch (billingType) {
    case 'lifetime':
      return 'Lifetime Access (One-time payment)';
    case 'yearly':
      return 'Annual Subscription';
    case 'monthly':
      return 'Monthly Subscription';
    default:
      return billingType;
  }
};

const generatePurchaseConfirmationHtml = (
  firstName: string,
  planName: string,
  amount: string,
  billingType: string,
  purchaseDate: string
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Confirmed - Quizabl</title>
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
              
              <!-- Success Icon -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;width:64px;height:64px;background-color:#dcfce7;border-radius:50%;line-height:64px;">
                  <span style="font-size:32px;">🎉</span>
                </div>
              </div>
              
              <!-- Greeting -->
              <h1 style="color:#111827;font-size:24px;font-weight:700;margin:0 0 16px;text-align:center;">Thank you for your purchase!</h1>
              
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;text-align:center;">
                Hi ${firstName}, your payment has been confirmed and your account has been upgraded.
              </p>
              
              <!-- Order Details Box -->
              <div style="background-color:#f3f4f6;border-radius:8px;padding:24px;margin-bottom:24px;">
                <h2 style="color:#111827;font-size:16px;font-weight:600;margin:0 0 16px;">Order Details</h2>
                
                <table role="presentation" style="width:100%;">
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:14px;">Plan</td>
                    <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${planName}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:14px;">Amount</td>
                    <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:14px;">Billing</td>
                    <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${billingType}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:14px;">Date</td>
                    <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${purchaseDate}</td>
                  </tr>
                </table>
              </div>
              
              <!-- What's Next Section -->
              <h2 style="color:#111827;font-size:18px;font-weight:600;margin:0 0 16px;">What's next?</h2>
              
              <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
                You now have full access to all premium features. Start creating engaging quizzes, flashcards, and games for your students!
              </p>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="https://quizabl.com/dashboard" style="display:inline-block;background-color:#f97316;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Go to Dashboard</a>
              </div>
              
              <!-- Support -->
              <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">
                Need help? Reach out to us at <a href="mailto:support@quizabl.com" style="color:#f97316;text-decoration:none;font-weight:600;">support@quizabl.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:0;">
                This receipt was sent to ${firstName} for the Quizabl ${planName} plan.<br/>
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
    const { email, customer_name, plan_name, amount, currency, billing_type }: PurchaseConfirmationRequest = await req.json();

    console.log("[PURCHASE-EMAIL] Sending to:", email);

    const firstName = customer_name?.split(" ")[0] || "there";
    const formattedAmount = formatCurrency(amount, currency);
    const billingTypeLabel = getBillingTypeLabel(billing_type);
    const purchaseDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const { data, error } = await resend.emails.send({
      from: "Quizabl <hello@updates.quizabl.com>",
      to: [email],
      subject: "🎉 Your Quizabl purchase is confirmed!",
      html: generatePurchaseConfirmationHtml(firstName, plan_name, formattedAmount, billingTypeLabel, purchaseDate),
    });

    if (error) {
      console.error("[PURCHASE-EMAIL] Resend API error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("[PURCHASE-EMAIL] Sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[PURCHASE-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
