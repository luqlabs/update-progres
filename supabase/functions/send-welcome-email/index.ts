import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  full_name: string;
}

const generateWelcomeEmailHtml = (firstName: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Quizabl</title>
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
              <h1 style="color:#111827;font-size:24px;font-weight:700;margin:0 0 24px;">Hi ${firstName},</h1>
              
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Welcome to Quizabl. I'm really glad that you're here.
              </p>
              
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Quizabl was built for one simple reason: creating good review quizzes should not feel like extra work.
              </p>
              
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 32px;">
                Instead of starting from a blank page or clicking through endless settings, Quizabl lets you work the way you already think. You bring your material. You talk to it. Quizabl does the heavy lifting.
              </p>
              
              <!-- Features Section -->
              <h2 style="color:#111827;font-size:18px;font-weight:600;margin:0 0 20px;">Here's what you can do right away:</h2>
              
              <!-- Feature 1 -->
              <table role="presentation" style="width:100%;margin-bottom:20px;">
                <tr>
                  <td style="width:40px;vertical-align:top;padding-right:12px;">
                    <span style="font-size:24px;">📄</span>
                  </td>
                  <td>
                    <p style="color:#111827;font-size:15px;font-weight:600;margin:0 0 4px;">Turn your material into practice</p>
                    <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">Create quizzes, flashcards, or matching games directly from your lecture notes, articles, or web links. Everything is grounded in your content, not generic questions.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Feature 2 -->
              <table role="presentation" style="width:100%;margin-bottom:20px;">
                <tr>
                  <td style="width:40px;vertical-align:top;padding-right:12px;">
                    <span style="font-size:24px;">💬</span>
                  </td>
                  <td>
                    <p style="color:#111827;font-size:15px;font-weight:600;margin:0 0 4px;">Refine by chatting</p>
                    <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">Want to make a question harder? Add a hint? Adjust the focus? Just tell Quizabl what you want. No forms. No menus.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Feature 3 -->
              <table role="presentation" style="width:100%;margin-bottom:32px;">
                <tr>
                  <td style="width:40px;vertical-align:top;padding-right:12px;">
                    <span style="font-size:24px;">📊</span>
                  </td>
                  <td>
                    <p style="color:#111827;font-size:15px;font-weight:600;margin:0 0 4px;">See what students actually understand</p>
                    <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">Share one simple link. No student accounts needed. Get clear insights into which topics land and which ones need a second look.</p>
                  </td>
                </tr>
              </table>
              
              <!-- Tip Box -->
              <div style="background-color:#fef3c7;border-radius:8px;padding:20px;margin-bottom:32px;">
                <p style="color:#92400e;font-size:14px;font-weight:600;margin:0 0 8px;">If you're not sure where to start, here's a simple first step:</p>
                <p style="color:#92400e;font-size:14px;line-height:1.5;margin:0 0 8px;">Paste a short section of your lecture notes and ask:</p>
                <p style="color:#92400e;font-size:14px;font-style:italic;margin:0 0 8px;">"Create a short review quiz to check understanding"</p>
                <p style="color:#92400e;font-size:14px;margin:0;">You'll see the value in under a minute.</p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="https://quizabl.com/dashboard" style="display:inline-block;background-color:#f97316;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Start Creating Your First Quiz</a>
              </div>
              
              <!-- Support -->
              <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
                If you ever get stuck or have a question, please reach out to us at <a href="mailto:support@quizabl.com" style="color:#f97316;text-decoration:none;font-weight:600;">support@quizabl.com</a>.
              </p>
              
              <!-- Sign-off -->
              <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">
                Happy teaching,<br/>
                <strong>Putra</strong><br/>
                <span style="color:#6b7280;">Founder of Quizabl</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:0;">
                This is an automated message, please do not reply directly to this email.<br/>
                Built for educators who care about understanding.
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    // Get first name for personalization
    const firstName = full_name?.split(" ")[0] || "there";

    // Use Resend SDK with inline HTML template
    const { data, error } = await resend.emails.send({
      from: "Quizabl <hello@updates.quizabl.com>",
      to: [email],
      subject: "Welcome to Quizabl! 🎉",
      html: generateWelcomeEmailHtml(firstName),
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("Welcome email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
