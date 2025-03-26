
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Starting scrape for URL:', url);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

    // Extract base domain for source_site
    const sourceSite = new URL(url).hostname.replace('www.', '');

    const crawlResponse = await firecrawl.crawlUrl(url, {
      scrapeOptions: {
        formats: ['html', 'text'],
        scripts: [
          {
            name: 'extractPropertyDetails',
            script: `
              () => {
                // Generic selectors that work with most property sites
                const selectors = {
                  price: ['[data-testid="price"]', '.price', '[itemprop="price"]'],
                  address: ['.address', '[itemprop="streetAddress"]', '.property-address'],
                  images: ['.gallery img', '.property-images img', '[itemprop="image"]'],
                  beds: ['.beds', '[data-testid="beds"]', '.bedroom-number'],
                  baths: ['.baths', '[data-testid="baths"]', '.bathroom-number'],
                  sqft: ['.sqft', '[data-testid="floorArea"]', '.property-size']
                };

                const findValue = (selectorList) => {
                  for (const selector of selectorList) {
                    const element = document.querySelector(selector);
                    if (element) return element.textContent?.trim() || element.getAttribute('content');
                  }
                  return null;
                };

                const findImages = (selectorList) => {
                  for (const selector of selectorList) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length) {
                      return Array.from(elements)
                        .map(img => img.getAttribute('src'))
                        .filter(Boolean);
                    }
                  }
                  return [];
                };

                const price = findValue(selectors.price);
                const cleanPrice = price ? parseFloat(price.replace(/[^0-9.]/g, '')) : null;

                return {
                  price: cleanPrice,
                  address: findValue(selectors.address) || '',
                  image_urls: findImages(selectors.images),
                  bedrooms: parseInt(findValue(selectors.beds) || '0'),
                  bathrooms: parseInt(findValue(selectors.baths) || '0'),
                  square_feet: parseInt(findValue(selectors.sqft)?.replace(/[^0-9]/g, '') || '0'),
                };
              }
            `
          }
        ]
      }
    });

    if (!crawlResponse.success) {
      throw new Error('Failed to scrape property data');
    }

    const scrapedData = crawlResponse.data[0]?.scriptResults?.extractPropertyDetails;
    
    if (!scrapedData || !scrapedData.address) {
      throw new Error('No valid property data found');
    }

    console.log('Successfully scraped property data:', scrapedData);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...scrapedData,
          id: crypto.randomUUID(),
          source_url: url,
          source_site: sourceSite,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
