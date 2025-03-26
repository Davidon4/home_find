import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define the interface for crawler input parameters
interface CrawlerParams {
  city: string;
  maxPages: number;
  minBeds: number;
  maxPrice: number;
  analysisThreshold: number;
}

// Define interface for the crawler response
interface CrawlerResponse {
  success: boolean;
  message: string;
  propertiesFound: number;
  sample: any[];
  error?: string;
  details?: string;
}

// Connect to supabase
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

// Generate realistic property listings for a given location
async function generatePropertyListings(params: CrawlerParams): Promise<any[]> {
  const { city, maxPages, minBeds, maxPrice, analysisThreshold } = params;
  
  console.log(`Generating properties for ${city} with quality threshold ${analysisThreshold}%`);
  
  // Calculate number of properties based on pages (approximately 25 per page)
  const count = maxPages * 25;
  
  const [stateAbbr] = ['CA'];
  const state = stateAbbr || 'CA';
  
  const streetNames = [
    'Main Street', 'Park Avenue', 'Oak Lane', 'Cedar Road', 'Maple Drive',
    'Pine Street', 'Washington Street', 'Mountain View', 'Lake View Drive', 'Forest Lane',
    'Highland Avenue', 'Sunset Boulevard', 'Ocean Drive', 'River Road', 'Valley Lane'
  ];
  
  const propertyTypes = ['Single Family Home', 'Condo', 'Townhouse', 'Apartment', 'Multi-family'];
  const descriptions = [
    'Beautiful property in a desirable neighborhood with modern finishes and great amenities nearby.',
    'Charming home featuring spacious rooms, updated kitchen, and a lovely garden.',
    'Gorgeous property with open floor plan, high ceilings, and plenty of natural light.',
    'Well-maintained home in a quiet neighborhood, close to schools and shopping centers.',
    'Stunning property with luxury finishes, gourmet kitchen, and spa-like bathrooms.',
    'Cozy home with character, featuring hardwood floors and a welcoming atmosphere.',
    'Modern property with smart home features and energy-efficient appliances.',
    'Elegant home with classic architecture and tasteful updates throughout.',
    'Spacious property perfect for entertaining, with a large backyard and patio.',
    'Move-in ready home with fresh paint, new flooring, and updated fixtures.'
  ];
  
  // Generate zip codes for the location
  const zipBase = Math.floor(Math.random() * 90000) + 10000;
  const zipCodes = Array.from({ length: 5 }, (_, i) => String(zipBase + i));
  
  const properties = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a random house number
    const houseNumber = Math.floor(Math.random() * 9900) + 100;
    
    // Generate a random street name
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    
    // Generate a random zip code
    const zipCode = zipCodes[Math.floor(Math.random() * zipCodes.length)];
    
    // Generate a random property type, or use the specified one
    const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    
    // Generate random number of bedrooms
    const bedrooms = Math.floor(Math.random() * (6 - minBeds + 1)) + minBeds;
    
    // Generate random number of bathrooms (usually fewer than or equal to bedrooms)
    const bathrooms = Math.floor(Math.random() * bedrooms) + 1;
    
    // Generate random square footage based on bedrooms
    const baseSqft = 750 + (bedrooms * 250);
    const squareFeet = baseSqft + Math.floor(Math.random() * 1000);
    
    // Generate random price based on location, size, bedrooms
    const minPrice = 100000;
    const maxPrice = maxPrice || 2000000;
    const priceRange = maxPrice - minPrice;
    const basePrice = minPrice + (squareFeet * 150) + (bedrooms * 25000) + (bathrooms * 15000);
    const price = Math.min(maxPrice, Math.max(minPrice, Math.round(basePrice / 5000) * 5000));
    
    // Random investment score that respects the threshold
    const investmentScore = Math.max(
      analysisThreshold,
      Math.floor(Math.random() * (100 - analysisThreshold)) + analysisThreshold
    );
    
    // ROI estimate between 5% and 15%
    const roiEstimate = 5 + Math.random() * 10;
    
    // Rental estimate based on price and location
    const rentalEstimate = Math.round((price * 0.005) + (Math.random() * 1000));
    
    // Random description
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Generate random image URL from Unsplash
    const imageId = Math.floor(Math.random() * 1000);
    const imageUrl = `https://source.unsplash.com/random/800x600?house,property&sig=${imageId}`;
    
    // Market trends
    const marketTrends = {
      appreciation_rate: (3 + Math.random() * 7).toFixed(1),
      avg_days_on_market: Math.floor(Math.random() * 60) + 10,
      price_per_sqft: Math.round((price / squareFeet) * 10) / 10,
      market_health: Math.floor(Math.random() * 100)
    };
    
    // Investment highlights
    const investmentHighlights = [
      'Growing neighborhood',
      'Close to amenities',
      'Good school district',
      'Low property taxes',
      'High rental demand'
    ];
    
    // Shuffle and take a random subset
    const shuffledHighlights = [...investmentHighlights].sort(() => 0.5 - Math.random());
    const selectedHighlights = shuffledHighlights.slice(0, Math.floor(Math.random() * 3) + 2);
    
    // Last sold price (typically less than current price)
    const lastSoldPrice = Math.round(price * (0.7 + Math.random() * 0.2) / 5000) * 5000;
    
    // Bidding recommendation (slightly above or below listing price)
    const bidAdjustment = (Math.random() > 0.6) ? (1 + (Math.random() * 0.07)) : (1 - (Math.random() * 0.05));
    const biddingRecommendation = Math.round(price * bidAdjustment / 1000) * 1000;
    
    const property = {
      address: `${houseNumber} ${streetName}, ${city}, ${state} ${zipCode}`,
      price,
      bedrooms,
      bathrooms,
      square_feet: squareFeet,
      image_url: imageUrl,
      roi_estimate: roiEstimate,
      rental_estimate: rentalEstimate,
      investment_score: investmentScore,
      source: "property-crawler",
      listing_url: `https://example.com/properties/${Math.random().toString(36).substring(2, 10)}`,
      investment_highlights: { 
        points: selectedHighlights,
        neighborhood_score: Math.floor(Math.random() * 10) + 1
      },
      market_trends: marketTrends,
      last_sold_price: lastSoldPrice,
      bidding_recommendation: biddingRecommendation,
      price_history: [
        { date: "2023-01-15", price: lastSoldPrice },
        { date: "2023-06-10", price: Math.round(lastSoldPrice * 1.03 / 5000) * 5000 },
        { date: "2023-12-05", price }
      ]
    };
    
    properties.push(property);
  }
  
  return properties;
}

// Main function to handle the property crawling request
async function crawlProperties(params: CrawlerParams): Promise<CrawlerResponse> {
  try {
    console.log(`Starting property crawler for ${params.city}`);
    
    // Generate listings
    const listings = await generatePropertyListings(params);
    
    // Save the listings to the database
    const { data, error } = await supabaseAdmin
      .from('property_listings')
      .insert(listings)
      .select();
    
    if (error) {
      console.error('Error inserting property listings:', error);
      throw new Error(`Failed to insert property listings: ${error.message}`);
    }
    
    console.log(`Successfully inserted ${data.length} property listings`);
    
    return {
      success: true,
      message: `Successfully generated ${data.length} property listings for ${params.city}`,
      propertiesFound: data.length,
      sample: data.slice(0, 3) // Return first 3 as a sample
    };
  } catch (error) {
    console.error('Property crawler error:', error);
    return {
      success: false,
      message: 'Failed to generate property listings',
      propertiesFound: 0,
      sample: [],
      error: error.message,
      details: String(error.stack || '')
    };
  }
}

// Supabase Edge Function handler
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  // This Edge Function expects a POST request with JSON body
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    );
  }
  
  try {
    const body = await req.json();
    console.log('Crawler request body:', body);
    
    // Validate required fields
    if (!body.city) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: city' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Prepare params with defaults
    const params: CrawlerParams = {
      city: body.city,
      maxPages: body.maxPages || 3,
      minBeds: body.minBeds || 2,
      maxPrice: body.maxPrice || 500000,
      analysisThreshold: body.analysisThreshold || 65
    };
    
    // Execute the crawler
    const result = await crawlProperties(params);
    
    // Return the response
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing crawler request:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error processing crawler request',
        propertiesFound: 0,
        sample: [],
        error: error.message,
        details: String(error.stack || '')
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
