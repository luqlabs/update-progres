import { supabase } from "@/integrations/supabase/client";

export interface ParsedUrl {
  success: boolean;
  text: string;
  url: string;
  title?: string;
  hostname?: string;
  characterCount: number;
  wasTruncated: boolean;
  error?: string;
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Extracts the hostname from a URL for display
 */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Fetches and parses content from a URL using the edge function
 */
export async function fetchUrlContent(url: string): Promise<ParsedUrl> {
  // Validate URL format first
  if (!isValidUrl(url)) {
    return {
      success: false,
      text: '',
      url,
      characterCount: 0,
      wasTruncated: false,
      error: 'Please enter a valid URL (e.g., https://example.com)',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('fetch-url-content', {
      body: { url },
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        text: '',
        url,
        characterCount: 0,
        wasTruncated: false,
        error: error.message || 'Failed to fetch URL content',
      };
    }

    if (!data.success) {
      return {
        success: false,
        text: '',
        url,
        characterCount: 0,
        wasTruncated: false,
        error: data.error || 'Failed to fetch URL content',
      };
    }

    return {
      success: true,
      text: data.text,
      url: data.url,
      title: data.title,
      hostname: data.hostname,
      characterCount: data.characterCount,
      wasTruncated: data.wasTruncated,
    };
  } catch (err) {
    console.error('URL fetch error:', err);
    return {
      success: false,
      text: '',
      url,
      characterCount: 0,
      wasTruncated: false,
      error: err instanceof Error ? err.message : 'Failed to fetch URL content',
    };
  }
}
