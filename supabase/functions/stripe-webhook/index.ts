import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// SHA-256 hashing function for PII data (Meta CAPI requirement)
async function hashData(text: string): Promise<string> {
  if (!text) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Send purchase event to Meta Conversions API
async function sendMetaPurchaseEvent(params: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  clientIp?: string;
  userAgent?: string;
  value: number;
  currency: string;
  contentName: string;
  eventSourceUrl: string;
}) {
  const META_PIXEL_ID = '1239715551328033'; // Your actual Pixel ID from Meta Events Manager
  const META_ACCESS_TOKEN = Deno.env.get('META_CONVERSIONS_API_TOKEN');

  if (!META_ACCESS_TOKEN) {
    console.error('[META CAPI] Missing META_CONVERSIONS_API_TOKEN');
    return;
  }

  try {
    logStep('[META CAPI] Preparing purchase event', {
      email: params.email,
      value: params.value,
      currency: params.currency,
      contentName: params.contentName
    });

    // Hash PII data for privacy (Meta requirement)
    const hashedEmail = await hashData(params.email);
    const hashedFirstName = params.firstName ? await hashData(params.firstName) : '';
    const hashedLastName = params.lastName ? await hashData(params.lastName) : '';
    const hashedPhone = params.phone ? await hashData(params.phone.replace(/\D/g, '')) : '';
    const hashedCity = params.city ? await hashData(params.city) : '';
    const hashedState = params.state ? await hashData(params.state) : '';
    const hashedZip = params.zip ? await hashData(params.zip) : '';
    const hashedCountry = params.country ? await hashData(params.country) : '';
    
    // Build user_data object with all available parameters
    const userData: any = {
      em: [hashedEmail],
    };
    
    if (hashedFirstName) userData.fn = [hashedFirstName];
    if (hashedLastName) userData.ln = [hashedLastName];
    if (hashedPhone) userData.ph = [hashedPhone];
    if (hashedCity) userData.ct = [hashedCity];
    if (hashedState) userData.st = [hashedState];
    if (hashedZip) userData.zp = [hashedZip];
    if (hashedCountry) userData.country = [hashedCountry];
    if (params.clientIp) userData.client_ip_address = params.clientIp;
    if (params.userAgent) userData.client_user_agent = params.userAgent;
    
    const eventData = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: params.eventSourceUrl,
          action_source: 'website',
          user_data: userData,
          custom_data: {
            value: params.value,
            currency: params.currency,
            content_name: params.contentName,
          },
        },
      ],
      access_token: META_ACCESS_TOKEN,
    };

    logStep('[META CAPI] Sending event to Meta', { pixel_id: META_PIXEL_ID });

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    const result = await response.json();
    
    if (response.ok) {
      logStep('[META CAPI] ✅ Purchase event sent successfully', result);
    } else {
      logStep('[META CAPI] ❌ Failed to send purchase event', result);
    }
  } catch (error) {
    console.error('[META CAPI] Error sending purchase event:', error);
  }
}

// Helper function to call email edge functions
async function sendTransactionalEmail(functionName: string, payload: Record<string, any>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(`[EMAIL] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for ${functionName}`);
    return;
  }
  
  try {
    logStep(`[EMAIL] Calling ${functionName}`, payload);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      logStep(`[EMAIL] ✅ ${functionName} sent successfully`, result);
    } else {
      logStep(`[EMAIL] ❌ ${functionName} failed`, result);
    }
  } catch (error) {
    console.error(`[EMAIL] Error calling ${functionName}:`, error);
  }
}

// Helper function to send purchase webhook to Make.com for MailerLite segmentation
async function sendPurchaseWebhook(params: {
  email: string;
  full_name: string;
  user_id: string;
  plan_name: string;
  billing_type: string;
  billing_interval: string;
  amount: number;
  currency: string;
}) {
  const webhookUrl = Deno.env.get('MAKE_WEBHOOK_URL');
  
  if (!webhookUrl) {
    logStep('[MAKE WEBHOOK] MAKE_WEBHOOK_URL not configured, skipping purchase webhook');
    return;
  }
  
  try {
    const payload = {
      event: 'purchase_completed',
      email: params.email,
      full_name: params.full_name,
      user_id: params.user_id,
      plan_name: params.plan_name,
      billing_type: params.billing_type,
      billing_interval: params.billing_interval,
      amount: params.amount,
      currency: params.currency,
      purchase_timestamp: new Date().toISOString(),
      app_url: 'https://www.quizabl.com',
    };

    logStep('[MAKE WEBHOOK] Sending purchase event', { email: params.email, plan_name: params.plan_name });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      logStep('[MAKE WEBHOOK] ✅ Purchase webhook sent successfully');
    } else {
      const errorText = await response.text();
      logStep('[MAKE WEBHOOK] ❌ Purchase webhook failed', { status: response.status, error: errorText });
    }
  } catch (error) {
    console.error('[MAKE WEBHOOK] Error sending purchase webhook:', error);
  }
}

serve(async (request) => {
  logStep('Webhook request received');
  
  const signature = request.headers.get('Stripe-Signature');
  const body = await request.text();
  
  if (!signature) {
    logStep('ERROR: No signature in request');
    return new Response('No signature', { status: 400 });
  }

  try {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      logStep('ERROR: STRIPE_WEBHOOK_SECRET not set');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    logStep('Constructing webhook event');
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    logStep('Event received', { type: event.type, id: event.id });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const billing_type = session.metadata?.billing_type;
        const plan_id = session.metadata?.plan_id;
        const user_id = session.metadata?.user_id;
        const tolt_referral = session.metadata?.tolt_referral;

        logStep('Checkout completed', { 
          sessionId: session.id, 
          mode: session.mode, 
          billingType: billing_type,
          planId: plan_id,
          userId: user_id,
          toltReferral: tolt_referral || 'NOT_PROVIDED'
        });

        // Log Tolt referral status explicitly
        if (tolt_referral) {
          logStep('✅ Tolt referral found in Stripe metadata', { tolt_referral });
        } else {
          logStep('ℹ️ No Tolt referral in Stripe metadata (normal for direct traffic)');
        }

        // Get customer email for Meta CAPI
        let customerEmail = 'unknown@email.com';

        // Log session data for debugging
        logStep('Session data check', { 
          hasCustomer: !!session.customer,
          hasCustomerDetails: !!session.customer_details,
          customerDetailsEmail: session.customer_details?.email,
          amountTotal: session.amount_total,
          currency: session.currency
        });

        // Try to get email from Stripe customer object first
        if (session.customer) {
          try {
            const customer = await stripe.customers.retrieve(session.customer as string);
            if ('email' in customer && customer.email) {
              customerEmail = customer.email;
              logStep('Customer email from Stripe customer object', { email: customerEmail });
            }
          } catch (error) {
            logStep('ERROR: Failed to retrieve customer', { error });
          }
        }

        // CRITICAL FALLBACK: Use customer_details.email if customer object failed
        if (customerEmail === 'unknown@email.com' && session.customer_details?.email) {
          customerEmail = session.customer_details.email;
          logStep('Using email from session.customer_details', { email: customerEmail });
        }

        // Final validation
        if (customerEmail === 'unknown@email.com') {
          logStep('WARNING: No customer email found - Meta event will be rejected');
        }

        // Extract additional customer data for enhanced Meta CAPI match quality
        const customerDetails = session.customer_details;
        const billingAddress = customerDetails?.address;
        
        const fullName = customerDetails?.name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const phone = customerDetails?.phone || '';
        const city = billingAddress?.city || '';
        const state = billingAddress?.state || '';
        const zip = billingAddress?.postal_code || '';
        const country = billingAddress?.country || '';
        
        logStep('Enhanced customer data extracted', {
          hasFirstName: !!firstName,
          hasLastName: !!lastName,
          hasPhone: !!phone,
          hasCity: !!city,
          hasState: !!state,
          hasZip: !!zip,
          hasCountry: !!country
        });

        // Handle one-time purchases (lifetime access)
        if (billing_type === 'one_time' && session.mode === 'payment') {
          logStep('Processing one-time purchase', { userId: user_id, planId: plan_id });
          
          // Send purchase event to Meta Conversions API with enhanced parameters
          await sendMetaPurchaseEvent({
            email: customerEmail,
            firstName,
            lastName,
            phone,
            city,
            state,
            zip,
            country,
            value: (session.amount_total || 0) / 100, // Convert cents to dollars
            currency: (session.currency || 'usd').toUpperCase(),
            contentName: session.metadata?.plan_name || 'Lifetime Access',
            eventSourceUrl: 'https://quizabl.com',
          });
          
          // Check if user already has a subscription (will replace it)
          const { data: existingSub } = await supabaseClient
            .from('user_subscriptions')
            .select('plan_id')
            .eq('user_id', user_id)
            .single();
          
          if (existingSub) {
            logStep('Replacing existing subscription', { userId: user_id, oldPlanId: existingSub.plan_id, newPlanId: plan_id });
          }
          
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .upsert({
              user_id: user_id,
              plan_id: plan_id,
              status: 'active',
              billing_interval: 'lifetime',
              current_period_start: new Date().toISOString(),
              current_period_end: null, // No expiration!
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.id, // Store session ID instead
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            logStep('ERROR upserting lifetime subscription', { error: error.message, userId: user_id });
          } else {
            logStep('Lifetime subscription upserted successfully', { userId: user_id, planId: plan_id });
            
            // Send purchase confirmation email
            await sendTransactionalEmail('send-purchase-confirmation', {
              email: customerEmail,
              customer_name: fullName || 'Customer',
              plan_name: session.metadata?.plan_name || 'Lifetime Access',
              amount: (session.amount_total || 0) / 100,
              currency: (session.currency || 'usd').toUpperCase(),
              billing_type: 'lifetime',
            });
            
            // Send purchase webhook to Make.com for MailerLite segmentation
            await sendPurchaseWebhook({
              email: customerEmail,
              full_name: fullName || 'Customer',
              user_id: user_id || '',
              plan_name: session.metadata?.plan_name || 'Lifetime Access',
              billing_type: 'one_time',
              billing_interval: 'lifetime',
              amount: (session.amount_total || 0) / 100,
              currency: (session.currency || 'usd').toUpperCase(),
            });
          }
          break;
        }

        // Handle regular subscriptions
        if (session.mode === 'subscription' && session.subscription) {
          logStep('Processing subscription', { subscriptionId: session.subscription });
          
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // Send purchase event to Meta Conversions API with enhanced parameters
          await sendMetaPurchaseEvent({
            email: customerEmail,
            firstName,
            lastName,
            phone,
            city,
            state,
            zip,
            country,
            value: (session.amount_total || 0) / 100, // Convert cents to dollars
            currency: (session.currency || 'usd').toUpperCase(),
            contentName: session.metadata?.plan_name || 'Subscription',
            eventSourceUrl: 'https://quizabl.com',
          });
          
          const productId = subscription.items.data[0].price.product as string;
          const interval = subscription.items.data[0].price.recurring?.interval;

          logStep('Retrieved subscription details', { productId, interval });

          // Find plan by Stripe product ID
          const { data: plan, error: planError } = await supabaseClient
            .from('subscription_plans')
            .select('id')
            .eq('stripe_product_id', productId)
            .single();

          if (planError) {
            logStep('ERROR finding plan', { error: planError.message, productId });
          }

          if (plan && session.customer) {
            const customer = await stripe.customers.retrieve(session.customer as string);
            const email = (customer as Stripe.Customer).email;

            logStep('Retrieved customer', { email });

            // Find user by email
            const { data: profile, error: profileError } = await supabaseClient
              .from('profiles')
              .select('id')
              .eq('email', email)
              .single();

            if (profileError) {
              logStep('ERROR finding profile', { error: profileError.message, email });
            }

            if (profile) {
              // Check if user already has a subscription (will replace it)
              const { data: existingSub } = await supabaseClient
                .from('user_subscriptions')
                .select('plan_id')
                .eq('user_id', profile.id)
                .single();
              
              if (existingSub) {
                logStep('Replacing existing subscription', { userId: profile.id, oldPlanId: existingSub.plan_id, newPlanId: plan.id });
              }
              
              const { error: upsertError } = await supabaseClient
                .from('user_subscriptions')
                .upsert({
                  user_id: profile.id,
                  plan_id: plan.id,
                  status: 'active',
                  stripe_subscription_id: subscription.id,
                  stripe_customer_id: session.customer as string,
                  current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  billing_interval: interval === 'year' ? 'yearly' : 'monthly',
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'user_id'
                });
              
              if (upsertError) {
                logStep('ERROR upserting subscription', { error: upsertError.message, userId: profile.id });
              } else {
                logStep('Subscription upserted successfully', { userId: profile.id, planId: plan.id });
                
                // Send purchase confirmation email
                await sendTransactionalEmail('send-purchase-confirmation', {
                  email: customerEmail,
                  customer_name: fullName || 'Customer',
                  plan_name: session.metadata?.plan_name || 'Subscription',
                  amount: (session.amount_total || 0) / 100,
                  currency: (session.currency || 'usd').toUpperCase(),
                  billing_type: interval === 'year' ? 'yearly' : 'monthly',
                });
                
                // Send purchase webhook to Make.com for MailerLite segmentation
                await sendPurchaseWebhook({
                  email: customerEmail,
                  full_name: fullName || 'Customer',
                  user_id: profile.id,
                  plan_name: session.metadata?.plan_name || 'Subscription',
                  billing_type: 'subscription',
                  billing_interval: interval === 'year' ? 'yearly' : 'monthly',
                  amount: (session.amount_total || 0) / 100,
                  currency: (session.currency || 'usd').toUpperCase(),
                });
              }
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep('Subscription updated', { subscriptionId: subscription.id, status: subscription.status });

        const { data: dbSubscription, error: selectError } = await supabaseClient
          .from('user_subscriptions')
          .select('user_id, plan_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (selectError) {
          logStep('ERROR finding subscription to update', { error: selectError.message, subscriptionId: subscription.id });
        }

        if (dbSubscription) {
          const { error: updateError } = await supabaseClient
            .from('user_subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          if (updateError) {
            logStep('ERROR updating subscription', { error: updateError.message, subscriptionId: subscription.id });
          } else {
            logStep('Subscription updated successfully', { subscriptionId: subscription.id });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep('Subscription deleted', { subscriptionId: subscription.id });

        const { error } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          logStep('ERROR canceling subscription', { error: error.message, subscriptionId: subscription.id });
        } else {
          logStep('Subscription canceled successfully', { subscriptionId: subscription.id });
          
          // Get customer email to send cancellation email
          if (subscription.customer) {
            try {
              const customer = await stripe.customers.retrieve(subscription.customer as string);
              if ('email' in customer && customer.email) {
                // Get subscription end date for access until message
                const periodEnd = subscription.current_period_end 
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : new Date().toISOString();
                
                await sendTransactionalEmail('send-subscription-canceled', {
                  email: customer.email,
                  customer_name: customer.name || 'Customer',
                  plan_name: 'Premium', // Could be enhanced to get actual plan name
                  access_until: periodEnd,
                });
              }
            } catch (emailError) {
              logStep('ERROR retrieving customer for cancellation email', { error: emailError });
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep('Payment failed', { invoiceId: invoice.id });

        if (invoice.subscription) {
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription as string);

          if (error) {
            logStep('ERROR marking subscription past_due', { error: error.message, subscriptionId: invoice.subscription });
          } else {
            logStep('Subscription marked as past_due', { subscriptionId: invoice.subscription });
          }
          
          // Send payment failed email
          if (invoice.customer) {
            try {
              const customer = await stripe.customers.retrieve(invoice.customer as string);
              if ('email' in customer && customer.email) {
                await sendTransactionalEmail('send-payment-failed', {
                  email: customer.email,
                  customer_name: customer.name || 'Customer',
                  amount: (invoice.amount_due || 0) / 100,
                  currency: (invoice.currency || 'usd').toUpperCase(),
                });
              }
            } catch (emailError) {
              logStep('ERROR retrieving customer for payment failed email', { error: emailError });
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep('Payment succeeded', { invoiceId: invoice.id });

        if (invoice.subscription) {
          const { error } = await supabaseClient
            .from('user_subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription as string);

          if (error) {
            logStep('ERROR marking subscription active', { error: error.message, subscriptionId: invoice.subscription });
          } else {
            logStep('Subscription marked as active', { subscriptionId: invoice.subscription });
          }
        }
        break;
      }

      default:
        logStep('Unhandled event type', { type: event.type });
    }

    logStep('Webhook processed successfully');

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    logStep('ERROR processing webhook', { message: errorMessage, stack: errorStack });
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
});
