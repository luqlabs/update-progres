import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useNewUserWebhook = () => {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only proceed for SIGNED_IN events
        if (event !== 'SIGNED_IN' || !session?.user) return;
        
        // Prevent duplicate triggers in React strict mode
        if (hasTriggeredRef.current) return;
        
        // Check if user was created recently (within 5 minutes)
        const createdAt = new Date(session.user.created_at);
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const isRecentlyCreated = createdAt > fiveMinutesAgo;
        
        if (!isRecentlyCreated) {
          // Not a new user, skip welcome email
          return;
        }

        // Use setTimeout to defer Supabase calls and prevent deadlock
        setTimeout(async () => {
          try {
            // Check database if welcome email was already sent
            const { data: profile } = await supabase
              .from('profiles')
              .select('welcomed_at')
              .eq('id', session.user.id)
              .single();
            
            if (profile?.welcomed_at) {
              // Already welcomed, skip
              console.log('User already welcomed, skipping:', session.user.email);
              return;
            }
            
            hasTriggeredRef.current = true;
            
            const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
            
            console.log('New user detected, sending webhook and welcome email:', session.user.email);
            
            // Call webhook and welcome email in parallel
            const results = await Promise.allSettled([
              supabase.functions.invoke('send-signup-webhook', {
                body: {
                  user_id: session.user.id,
                  email: session.user.email,
                  full_name: fullName,
                  signup_method: session.user.app_metadata?.provider || 'email',
                  signup_timestamp: session.user.created_at
                }
              }),
              supabase.functions.invoke('send-welcome-email', {
                body: {
                  email: session.user.email,
                  full_name: fullName
                }
              })
            ]);
            
            results.forEach((result, index) => {
              if (result.status === 'rejected') {
                console.error(index === 0 ? 'Webhook error:' : 'Welcome email error:', result.reason);
              }
            });
            
            // Mark user as welcomed in database
            await supabase
              .from('profiles')
              .update({ welcomed_at: new Date().toISOString() })
              .eq('id', session.user.id);
              
            console.log('New user notifications sent successfully for:', session.user.email);
          } catch (error) {
            console.error('Failed to send new user notifications:', error);
          }
        }, 0);
      }
    );

    return () => subscription.unsubscribe();
  }, []);
};
