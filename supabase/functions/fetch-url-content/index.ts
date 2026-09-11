import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_CONTENT_LENGTH = 20000;

// Helper to extract main content from HTML
function extractMainContent(html: string): string {
  // Remove script tags and their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove style tags and their content
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove head section
  text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  
  // Remove navigation, header, footer, aside elements
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
  
  // Remove common ad/tracking elements
  text = text.replace(/<div[^>]*class="[^"]*(?:ad|advertisement|sponsor|tracking|cookie|banner)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // Replace br tags with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Replace paragraph and heading tags with double newlines
  text = text.replace(/<\/(?:p|h[1-6]|div|li|tr)>/gi, '\n\n');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  
  // Normalize whitespace
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.trim();
  
  // Remove lines that are too short (likely navigation/menu items)
  const lines = text.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    // Keep lines with reasonable content
    return trimmed.length > 20 || trimmed === '';
  });
  
  return filteredLines.join('\n').trim();
}

// Extract page title from HTML
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Try og:title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    return ogTitleMatch[1].trim();
  }
  
  return '';
}

serve(async (req) => {
  console.log("=== FETCH-URL-CONTENT INVOKED ===");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid URL format. Please enter a valid web address." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Fetching URL:", url);
    
    // Fetch the webpage with browser-like headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    
    if (!response.ok) {
      let errorMessage = `Could not access this URL (${response.status})`;
      
      if (response.status === 403) {
        errorMessage = "This website blocks automated access. Try a different URL or copy-paste the content as a document instead.";
      } else if (response.status === 404) {
        errorMessage = "Page not found. Please check the URL and try again.";
      } else if (response.status >= 500) {
        errorMessage = "The website is temporarily unavailable. Please try again later.";
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "URL must point to a webpage (HTML or text content)" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const html = await response.text();
    
    // Extract title and content
    const title = extractTitle(html);
    let text = extractMainContent(html);
    
    if (text.length < 50) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Could not extract meaningful content from this URL. The page may be dynamic or require JavaScript." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Truncate if needed
    const wasTruncated = text.length > MAX_CONTENT_LENGTH;
    if (wasTruncated) {
      text = text.substring(0, MAX_CONTENT_LENGTH);
      // Try to end at a sentence boundary
      const lastPeriod = text.lastIndexOf('.');
      if (lastPeriod > MAX_CONTENT_LENGTH * 0.8) {
        text = text.substring(0, lastPeriod + 1);
      }
    }
    
    console.log("Successfully extracted content:", text.length, "characters");
    
    return new Response(
      JSON.stringify({
        success: true,
        text,
        title,
        url: parsedUrl.href,
        hostname: parsedUrl.hostname,
        characterCount: text.length,
        wasTruncated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error fetching URL:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch URL content" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
