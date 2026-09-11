import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface EmailPayload {
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const getEmailTemplate = (
  emailType: string,
  userName: string,
  verifyUrl: string
) => {
  const logoUrl = "https://quizabl.com/logo.png";
  const accentColor = "#f97316";
  
  const baseTemplate = (subject: string, heading: string, content: string, buttonText: string, buttonUrl: string) => ({
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px;">
              <img src="${logoUrl}" alt="Quizabl" height="40" style="display: block;">
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
                ${heading}
              </h1>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #52525b; text-align: center;">
                ${content}
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${buttonUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${accentColor}; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #71717a; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 18px; color: #a1a1aa; text-align: center; word-break: break-all;">
                ${buttonUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa; text-align: center;">
                This email was sent by Quizabl. If you didn't request this, you can safely ignore it.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 18px; color: #a1a1aa; text-align: center;">
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
    `
  });

  switch (emailType) {
    case 'recovery':
      return baseTemplate(
        'Reset your Quizabl password',
        'Reset Your Password',
        `Hi${userName ? ` ${userName}` : ''}! We received a request to reset your password. Click the button below to set a new password. This link will expire in 1 hour.`,
        'Reset Password',
        verifyUrl
      );
    
    case 'signup':
    case 'confirmation':
      return baseTemplate(
        'Confirm your Quizabl email',
        'Confirm Your Email',
        `Hi${userName ? ` ${userName}` : ''}! Thanks for signing up for Quizabl. Please confirm your email address by clicking the button below.`,
        'Confirm Email',
        verifyUrl
      );
    
    case 'magiclink':
      return baseTemplate(
        'Your Quizabl login link',
        'Login to Quizabl',
        `Hi${userName ? ` ${userName}` : ''}! Click the button below to securely log in to your Quizabl account. This link will expire in 1 hour.`,
        'Log In',
        verifyUrl
      );
    
    case 'invite':
      return baseTemplate(
        "You're invited to Quizabl",
        'Welcome to Quizabl!',
        `Hi${userName ? ` ${userName}` : ''}! You've been invited to join Quizabl. Click the button below to accept your invitation and set up your account.`,
        'Accept Invitation',
        verifyUrl
      );
    
    case 'email_change':
      return baseTemplate(
        'Confirm your new email address',
        'Confirm Email Change',
        `Hi${userName ? ` ${userName}` : ''}! You requested to change your email address. Click the button below to confirm this change.`,
        'Confirm New Email',
        verifyUrl
      );
    
    case 'reauthentication':
      return baseTemplate(
        'Verify your identity',
        'Identity Verification',
        `Hi${userName ? ` ${userName}` : ''}! To complete your request, please verify your identity by clicking the button below.`,
        'Verify Identity',
        verifyUrl
      );
    
    default:
      return baseTemplate(
        'Message from Quizabl',
        'Hello from Quizabl',
        `Hi${userName ? ` ${userName}` : ''}! Click the button below to continue.`,
        'Continue',
        verifyUrl
      );
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await req.text();

  try {
    // Parse the payload - Supabase sends it as JSON
    const data = JSON.parse(payload) as EmailPayload;
    
    const { user, email_data } = data;
    const { token_hash, redirect_to, email_action_type } = email_data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
    
    const userName = user.user_metadata?.full_name?.split(' ')[0] || '';
    const emailContent = getEmailTemplate(email_action_type, userName, verifyUrl);

    console.log(`Sending ${email_action_type} email to ${user.email}`);

    const { error } = await resend.emails.send({
      from: 'Quizabl <hello@updates.quizabl.com>',
      to: [user.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }

    console.log(`Successfully sent ${email_action_type} email to ${user.email}`);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Email hook error:', error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
