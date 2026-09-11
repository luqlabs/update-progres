const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  user_id: string;
  email: string;
  full_name: string;
  signup_method: string;
  signup_timestamp: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('MAKE_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('MAKE_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: WebhookPayload = await req.json();
    
    console.log('Sending webhook to Make.com:', {
      url: webhookUrl.substring(0, 30) + '...',
      user_id: payload.user_id,
      email: payload.email,
    });

    // Send data to Make.com webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'user_signup',
        user_id: payload.user_id,
        email: payload.email,
        full_name: payload.full_name,
        signup_method: payload.signup_method,
        signup_timestamp: payload.signup_timestamp,
        app_url: 'https://www.quizabl.com',
      }),
    });

    if (!webhookResponse.ok) {
      console.error('Make.com webhook failed:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Webhook failed',
          status: webhookResponse.status,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook sent successfully to Make.com');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in webhook function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
