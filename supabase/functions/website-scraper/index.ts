
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface ScraperRequest {
  url: string;
  isZoopla?: boolean;
}

interface PropertyData {
  title: string;
  price: string | null;
  priceValue: number | null;
  address: string;
  description: string;
  bedrooms: number | null;
  bathrooms: number | null;
  livingRooms: number | null;
  features: string[];
  imageUrls: string[];
  agentName: string | null;
  agentPhone: string | null;
  propertyType: string | null;
}

interface ScrapedData {
  property?: PropertyData;
  generalData?: {
    title: string;
    content: string[];
    images: string[];
    links: string[];
    stats: {
      wordCount: number;
      paragraphCount: number;
      imageCount: number;
      linkCount: number;
    };
    analysis: {
      contentSummary: string;
      keyPhrases: string[];
      contentType: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestData: ScraperRequest = await req.json();
    const { url, isZoopla = false } = requestData;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Scraping URL: ${url}, isZoopla: ${isZoopla}`);
    
    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let scrapedData: ScrapedData = {};
    
    if (isZoopla || url.includes('zoopla.co.uk')) {
      // Specialized Zoopla property scraping
      console.log('Using Zoopla specialized scraper');
      
      const propertyData = scrapeZooplaProperty($, url);
      scrapedData.property = propertyData;
    } else {
      // General website scraping
      console.log('Using general website scraper');
      scrapedData.generalData = scrapeGeneralWebsite($, url);
    }
    
    console.log(`Scraping completed for ${url}`);
    
    return new Response(
      JSON.stringify(scrapedData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape website', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function scrapeZooplaProperty($: cheerio.CheerioAPI, url: string): PropertyData {
  // Price
  const priceElement = $('[data-testid="price"]').first();
  const priceText = priceElement.text().trim();
  const priceValue = extractPriceValue(priceText);
  
  // Address
  const addressElement = $('[data-testid="address-label"]').first();
  const address = addressElement.text().trim();
  
  // Description
  const descriptionElement = $('[data-testid="listing_description"]');
  const description = descriptionElement.text().trim();
  
  // Property details
  let bedrooms = null;
  let bathrooms = null;
  let livingRooms = null;
  
  $('[data-testid="beds-label"], [data-testid="baths-label"], [data-testid="receptions-label"]').each((_, el) => {
    const text = $(el).text().trim();
    const value = parseInt(text);
    
    if (!isNaN(value)) {
      if ($(el).attr('data-testid') === 'beds-label') {
        bedrooms = value;
      } else if ($(el).attr('data-testid') === 'baths-label') {
        bathrooms = value;
      } else if ($(el).attr('data-testid') === 'receptions-label') {
        livingRooms = value;
      }
    }
  });
  
  // Features
  const features: string[] = [];
  $('[data-testid="listing_features"] li').each((_, el) => {
    const feature = $(el).text().trim();
    if (feature) features.push(feature);
  });
  
  // Images
  const imageUrls: string[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const dataSrc = $(el).attr('data-src'); // For lazy-loaded images
    
    if (src && src.includes('zc.images') && !src.includes('data:image') && !imageUrls.includes(src)) {
      imageUrls.push(src);
    } else if (dataSrc && dataSrc.includes('zc.images') && !imageUrls.includes(dataSrc)) {
      imageUrls.push(dataSrc);
    }
  });
  
  // Agent details
  const agentNameElement = $('[data-testid="agent-name"]');
  const agentName = agentNameElement.length ? agentNameElement.text().trim() : null;
  
  const agentPhoneElement = $('[data-testid="agent-phone"]');
  const agentPhone = agentPhoneElement.length ? agentPhoneElement.text().trim() : null;
  
  // Property type
  const propertyType = extractPropertyType($, address);
  
  return {
    title: $('title').text().trim(),
    price: priceText,
    priceValue,
    address,
    description,
    bedrooms,
    bathrooms,
    livingRooms,
    features,
    imageUrls,
    agentName,
    agentPhone,
    propertyType
  };
}

function scrapeGeneralWebsite($: cheerio.CheerioAPI, url: string) {
  // Extract title
  const title = $('title').first().text().trim();
  
  // Extract content
  const contentSelectors = ['p', 'article', '.content', '.main'];
  const content: string[] = [];
  
  contentSelectors.forEach(selector => {
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text && !content.includes(text)) {
        content.push(text);
      }
    });
  });
  
  // Extract images
  const images: string[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !src.startsWith('data:') && !images.includes(src)) {
      // Handle relative URLs
      if (src.startsWith('/')) {
        const baseUrl = new URL(url);
        images.push(`${baseUrl.origin}${src}`);
      } else {
        images.push(src);
      }
    }
  });
  
  // Extract links
  const links: string[] = [];
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('#') && !links.includes(href)) {
      // Handle relative URLs
      if (href.startsWith('/')) {
        const baseUrl = new URL(url);
        links.push(`${baseUrl.origin}${href}`);
      } else if (!href.startsWith('http')) {
        const baseUrl = new URL(url);
        links.push(`${baseUrl.origin}/${href}`);
      } else {
        links.push(href);
      }
    }
  });
  
  // Basic analysis
  const allText = content.join(' ');
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  
  // Determine content type based on patterns
  let contentType = 'General';
  if (title.toLowerCase().includes('blog') || 
      url.toLowerCase().includes('blog') ||
      content.some(p => p.includes('posted on') || p.includes('published on'))) {
    contentType = 'Blog';
  } else if (title.toLowerCase().includes('news') || 
            url.toLowerCase().includes('news') ||
            content.some(p => p.includes('reported') || p.includes('announced'))) {
    contentType = 'News';
  } else if (images.length > content.length * 0.5) {
    contentType = 'Image Gallery';
  } else if (links.length > content.length * 0.5) {
    contentType = 'Link Directory';
  }
  
  // Extract potential key phrases
  const keyPhrases = extractKeyPhrases(allText);
  
  // Create a simple summary
  const contentSummary = allText.length > 300 
    ? `${allText.substring(0, 300)}...` 
    : allText;
  
  return {
    title,
    content: content.slice(0, 10), // Limit to avoid overly large responses
    images: images.slice(0, 10),   // Limit to avoid overly large responses
    links: links.slice(0, 10),     // Limit to avoid overly large responses
    stats: {
      wordCount,
      paragraphCount: content.length,
      imageCount: images.length,
      linkCount: links.length
    },
    analysis: {
      contentSummary,
      keyPhrases,
      contentType
    }
  };
}

// Simple key phrase extraction function
function extractKeyPhrases(text: string): string[] {
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Get word frequency
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordFreq: Record<string, number> = {};
  
  words.forEach(word => {
    if (!['with', 'that', 'this', 'from', 'they', 'will', 'have', 'more', 'your'].includes(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Sort words by frequency
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  // Extract phrases containing top words
  const phrases: string[] = [];
  
  if (sentences.length > 0) {
    sortedWords.forEach(word => {
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(word) && 
            sentence.split(/\s+/).length < 20 && 
            !phrases.includes(sentence.trim())) {
          phrases.push(sentence.trim());
          break;
        }
      }
    });
  }
  
  return phrases.slice(0, 3);
}

function extractPriceValue(priceText: string): number | null {
  if (!priceText) return null;
  
  // Extract numbers from the price text
  const matches = priceText.match(/[0-9,]+/g);
  if (!matches || matches.length === 0) return null;
  
  // Join and remove commas to get the number
  const priceString = matches.join('').replace(/,/g, '');
  const price = parseInt(priceString, 10);
  
  return isNaN(price) ? null : price;
}

function extractPropertyType($: cheerio.CheerioAPI, address: string): string | null {
  // Try to extract from various elements that might contain property type
  const propertyTypeElements = [
    $('[data-testid="property-type"]'),
    $('.property-type'),
    $('[data-testid="title-label"]')
  ];
  
  for (const element of propertyTypeElements) {
    if (element.length > 0) {
      const text = element.text().trim();
      if (text) return text;
    }
  }
  
  // Try to extract from the title or address
  const title = $('title').text().toLowerCase();
  const propertyTypes = ['flat', 'apartment', 'house', 'detached', 'semi-detached', 'terraced', 'bungalow', 'cottage', 'villa', 'penthouse', 'studio'];
  
  for (const type of propertyTypes) {
    if (title.includes(type) || (address && address.toLowerCase().includes(type))) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }
  
  return null;
}
