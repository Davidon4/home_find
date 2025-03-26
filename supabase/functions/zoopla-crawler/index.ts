
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Set of URLs that have already been processed, to avoid duplicates
const processedUrls = new Set<string>();

interface ScrapingRequest {
  city?: string;
  maxPages?: number;
  minBeds?: number;
  maxPrice?: number;
  analysisThreshold?: number; // Properties with score above this threshold will be stored
}

interface PropertyData {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string;
  imageUrls: string[];
  propertyType: string | null;
  url: string;
  postalCode: string;
  city: string;
}

// Handles processing a single property page
async function processPropertyPage(url: string): Promise<PropertyData | null> {
  if (processedUrls.has(url)) {
    console.log(`Skipping already processed URL: ${url}`);
    return null;
  }

  try {
    console.log(`Processing property page: ${url}`);
    
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
    
    // Parse key property data
    const priceElement = $('[data-testid="price"]').first();
    const priceText = priceElement.text().trim();
    const price = extractPrice(priceText);
    
    const addressElement = $('[data-testid="address-label"]').first();
    const address = addressElement.text().trim();
    
    // Parse postal code from address
    const postalCode = extractPostalCode(address);
    const city = extractCity(address);
    
    // Parse beds/baths
    let bedrooms = null;
    let bathrooms = null;
    
    $('[data-testid="beds-label"], [data-testid="baths-label"]').each((_, el) => {
      const text = $(el).text().trim();
      const value = parseInt(text);
      
      if (!isNaN(value)) {
        if ($(el).attr('data-testid') === 'beds-label') {
          bedrooms = value;
        } else if ($(el).attr('data-testid') === 'baths-label') {
          bathrooms = value;
        }
      }
    });
    
    // Get property description
    const descriptionElement = $('[data-testid="listing_description"]');
    const description = descriptionElement.text().trim();
    
    // Get property type
    const propertyType = extractPropertyType($);
    
    // Get images
    const imageUrls: string[] = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      const dataSrc = $(el).attr('data-src');
      
      if (src && src.includes('zc.images') && !src.includes('data:image') && !imageUrls.includes(src)) {
        imageUrls.push(src);
      } else if (dataSrc && dataSrc.includes('zc.images') && !imageUrls.includes(dataSrc)) {
        imageUrls.push(dataSrc);
      }
    });
    
    // Mark this URL as processed
    processedUrls.add(url);
    
    return {
      id: crypto.randomUUID(),
      address,
      price: price || 0,
      bedrooms,
      bathrooms,
      description,
      imageUrls,
      propertyType,
      url,
      postalCode: postalCode || "",
      city: city || "",
    };
  } catch (error) {
    console.error(`Error processing property page ${url}:`, error);
    return null;
  }
}

// Find property listings on a search results page and return the URLs
async function findPropertyListings(city: string, page: number = 1, minBeds: number = 1, maxPrice?: number): Promise<string[]> {
  try {
    // Construct search URL
    let searchUrl = `https://www.zoopla.co.uk/for-sale/property/${city.toLowerCase().replace(/\s+/g, '-')}/?page_size=25&page_number=${page}&beds_min=${minBeds}`;
    
    if (maxPrice) {
      searchUrl += `&price_max=${maxPrice}`;
    }
    
    console.log(`Searching for properties: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch search results: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const propertyUrls: string[] = [];
    
    // Extract listing URLs - adjust selector as needed based on Zoopla's HTML structure
    $('a[data-testid="listing-details-link"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('/for-sale/details/')) {
        const fullUrl = `https://www.zoopla.co.uk${href}`;
        propertyUrls.push(fullUrl);
      }
    });
    
    console.log(`Found ${propertyUrls.length} property listings on page ${page}`);
    return propertyUrls;
  } catch (error) {
    console.error(`Error finding property listings:`, error);
    return [];
  }
}

// Analyze a property and return an investment score
function analyzeProperty(property: PropertyData): { score: number; highlights: any } {
  let score = 50; // Base score
  const highlights: any = {
    positives: [],
    negatives: [],
    summary: ""
  };
  
  // Basic analysis rules - in reality, you'd want more sophisticated analysis
  if (property.bedrooms && property.bedrooms >= 3) {
    score += 10;
    highlights.positives.push("Multiple bedrooms increase rental potential");
  }
  
  if (property.bathrooms && property.bathrooms >= 2) {
    score += 5;
    highlights.positives.push("Multiple bathrooms add value");
  }
  
  const pricePerBed = property.price / (property.bedrooms || 1);
  if (pricePerBed < 100000) {
    score += 15;
    highlights.positives.push("Good price per bedroom ratio");
  } else if (pricePerBed > 150000) {
    score -= 10;
    highlights.negatives.push("High price per bedroom ratio");
  }
  
  // Location-based scoring - this is simplified
  if (property.postalCode.startsWith("E") || property.postalCode.startsWith("N") || property.postalCode.startsWith("SW")) {
    score += 10;
    highlights.positives.push("Desirable location");
  }
  
  // Property type scoring
  if (property.propertyType?.toLowerCase().includes("detached")) {
    score += 10;
    highlights.positives.push("Detached properties typically maintain value");
  }
  
  // Description analysis - look for keywords
  const descLower = property.description.toLowerCase();
  if (descLower.includes("renovated") || descLower.includes("refurbished") || descLower.includes("modern")) {
    score += 5;
    highlights.positives.push("Recently updated property");
  }
  
  if (descLower.includes("garden") || descLower.includes("terrace") || descLower.includes("patio")) {
    score += 5;
    highlights.positives.push("Outdoor space increases value");
  }
  
  if (descLower.includes("needs work") || descLower.includes("requires renovation") || descLower.includes("project")) {
    score -= 5;
    highlights.negatives.push("Property requires work");
  }
  
  // Estimate ROI - this is simplified and should be improved with real data
  const estimatedRent = estimateMonthlyRent(property);
  const yearlyRent = estimatedRent * 12;
  const roi = (yearlyRent / property.price) * 100;
  
  if (roi > 5) {
    score += 20;
    highlights.positives.push(`High potential ROI of ${roi.toFixed(1)}%`);
  } else if (roi > 3) {
    score += 10;
    highlights.positives.push(`Decent potential ROI of ${roi.toFixed(1)}%`);
  }
  
  // Generate summary
  if (score >= 75) {
    highlights.summary = "Excellent investment opportunity with high potential returns";
  } else if (score >= 60) {
    highlights.summary = "Good investment opportunity with solid potential";
  } else if (score >= 45) {
    highlights.summary = "Average investment opportunity with moderate potential";
  } else {
    highlights.summary = "Below average investment opportunity with limited potential";
  }
  
  return { 
    score: Math.min(100, Math.max(0, score)), // Ensure score is between 0-100
    highlights
  };
}

// Simple function to estimate monthly rent - this should be improved with real data models
function estimateMonthlyRent(property: PropertyData): number {
  // This is a very simplified model - in reality you'd want location-specific data
  const basePricePerBed = 700; // £700 per bedroom per month
  const bedroomFactor = property.bedrooms || 1;
  
  let locationMultiplier = 1;
  if (property.postalCode.startsWith("E") || property.postalCode.startsWith("W") || property.postalCode.startsWith("SW")) {
    locationMultiplier = 1.5; // London premium
  } else if (property.city.toLowerCase().includes("manchester") || property.city.toLowerCase().includes("birmingham")) {
    locationMultiplier = 1.2; // Major city premium
  }
  
  return Math.round(basePricePerBed * bedroomFactor * locationMultiplier);
}

// Helper functions
function extractPrice(priceText: string): number | null {
  if (!priceText) return null;
  
  const matches = priceText.match(/[0-9,]+/g);
  if (!matches || matches.length === 0) return null;
  
  const priceString = matches.join('').replace(/,/g, '');
  const price = parseInt(priceString, 10);
  
  return isNaN(price) ? null : price;
}

function extractPostalCode(address: string): string | null {
  // UK postal code regex
  const ukPostcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i;
  const matches = address.match(ukPostcodeRegex);
  
  return matches && matches.length > 0 ? matches[0] : null;
}

function extractCity(address: string): string {
  // Very simple city extraction - this could be improved
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : "";
}

function extractPropertyType($: cheerio.CheerioAPI): string | null {
  // Try different selectors that might contain property type
  const typeElement = $('[data-testid="property-type"], .property-type, [data-testid="title-label"]').first();
  
  if (typeElement.length) {
    return typeElement.text().trim();
  }
  
  // Fallback to title
  const title = $('title').text().toLowerCase();
  const propertyTypes = ['flat', 'apartment', 'house', 'detached', 'semi-detached', 'terraced', 'bungalow', 'cottage'];
  
  for (const type of propertyTypes) {
    if (title.includes(type)) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }
  
  return null;
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { city = "london", maxPages = 3, minBeds = 2, maxPrice = 500000, analysisThreshold = 65 } = await req.json() as ScrapingRequest;
    
    console.log(`Starting property crawler for city: ${city}, maxPages: ${maxPages}, threshold: ${analysisThreshold}`);
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
    );
    
    const highValueProperties: any[] = [];
    
    // Process pages
    for (let page = 1; page <= maxPages; page++) {
      console.log(`Processing page ${page} of ${maxPages}`);
      
      // Get property listings for this page
      const propertyUrls = await findPropertyListings(city, page, minBeds, maxPrice);
      
      // Process each property (limit concurrent requests to avoid rate limiting)
      const batchSize = 3;
      for (let i = 0; i < propertyUrls.length; i += batchSize) {
        const batch = propertyUrls.slice(i, i + batchSize);
        const properties = await Promise.all(batch.map(url => processPropertyPage(url)));
        
        // Filter out nulls and analyze properties
        const validProperties = properties.filter(p => p !== null) as PropertyData[];
        
        for (const property of validProperties) {
          // Analyze the property
          const { score, highlights } = analyzeProperty(property);
          
          // Store high-value properties
          if (score >= analysisThreshold) {
            console.log(`High-value property found: ${property.address} with score ${score}`);
            
            const estimatedRent = estimateMonthlyRent(property);
            const yearlyRent = estimatedRent * 12;
            const roi = (yearlyRent / property.price) * 100;
            
            // Store in Supabase
            const { data, error } = await supabaseClient
              .from('property_listings')
              .insert({
                id: property.id,
                address: property.address,
                price: property.price,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                source: 'zoopla',
                listing_url: property.url,
                image_url: property.imageUrls[0] || null,
                investment_score: score,
                investment_highlights: highlights,
                roi_estimate: parseFloat(roi.toFixed(2)),
                rental_estimate: estimatedRent,
                market_trends: {
                  appreciation_rate: (Math.random() * 3 + 2).toFixed(1) // Simplified
                }
              })
              .select();
            
            if (error) {
              console.error(`Error storing property in database:`, error);
            } else {
              console.log(`Property stored in database with ID: ${data[0].id}`);
              highValueProperties.push({
                ...property,
                score,
                highlights,
                estimatedRent,
                roi
              });
            }
          } else {
            console.log(`Property below threshold: ${property.address} with score ${score}`);
          }
        }
        
        // Sleep between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Crawler completed. Found ${highValueProperties.length} high-value properties.`);
    return new Response(
      JSON.stringify({
        success: true,
        propertiesFound: highValueProperties.length,
        properties: highValueProperties
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in property crawler:', error);
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
