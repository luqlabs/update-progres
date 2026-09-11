import { useEffect } from 'react';

declare global {
  interface Window {
    $crisp?: any[];
    CRISP_WEBSITE_ID?: string;
  }
}

export function useCrisp(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="crisp.chat"]');
    if (existingScript) return;

    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "b220fcf6-167c-493b-8ba9-35e00f166cc5";

    // Create and inject script
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const crispScript = document.querySelector('script[src*="crisp.chat"]');
      if (crispScript) {
        crispScript.remove();
      }

      // Clean up global references
      delete window.$crisp;
      delete window.CRISP_WEBSITE_ID;
    };
  }, [enabled]);
}
