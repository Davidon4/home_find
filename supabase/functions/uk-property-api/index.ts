
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interface for the search parameters
interface PropertySearchParams {
  area: string;
  page_number?: string;
  page_size?: string;
  ordering?: string;
  property_type?: string;
  min_price?: string;
  max_price?: string;
  min_bedrooms?: string;
  max_bedrooms?: string;
}

// Interface for a property listing response
interface UKProperty {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
  property_type: string;
  description: string;
  agent: {
    name: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
}

// Mock data generator for UK properties
function generateMockProperties(params: PropertySearchParams): UKProperty[] {
  const { 
    area, 
    page_size = '20',
    property_type,
    min_price,
    max_price,
    min_bedrooms,
    max_bedrooms
  } = params;
  
  const streetNames = [
    'High Street', 'Station Road', 'Main Street', 'Park Road', 'Church Street',
    'London Road', 'Victoria Road', 'Green Lane', 'Manor Road', 'Church Lane'
  ];
  
  const cities = area.includes(',') ? area.split(',')[0].trim() : area;
  
  const postcodes = [
    'SW1A 1AA', 'E1 6AN', 'M1 1AE', 'B1 1HQ', 'EH1 1YJ', 
    'CF10 1DD', 'BS1 1DB', 'G1 1XW', 'LS1 1UR', 'NE1 7RU'
  ];
  
  const propertyTypes = ['Detached', 'Semi-detached', 'Terraced', 'Flat', 'Bungalow', 'Cottage'];
  
  let properties: UKProperty[] = [];
  const count = parseInt(page_size);
  
  // Generate twice as many properties as needed so we can filter them
  for (let i = 0; i < count * 2; i++) {
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const houseNumber = Math.floor(Math.random() * 200) + 1;
    const postcode = postcodes[Math.floor(Math.random() * postcodes.length)];
    // Use the specified property type or generate a random one
    const selectedPropertyType = property_type ? property_type : propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    
    // Use the min/max bedrooms filter if provided, otherwise generate random
    const minBeds = min_bedrooms ? parseInt(min_bedrooms) : 1;
    const maxBeds = max_bedrooms ? parseInt(max_bedrooms) : 5;
    const bedroomRange = maxBeds - minBeds + 1;
    const bedrooms = minBeds + Math.floor(Math.random() * bedroomRange);
    
    const bathrooms = Math.floor(Math.random() * 3) + 1;
    
    // Use the min/max price filter if provided, otherwise generate random
    const minPriceNum = min_price ? parseInt(min_price) : 200000;
    const maxPriceNum = max_price ? parseInt(max_price) : 1000000;
    const priceRange = maxPriceNum - minPriceNum;
    const price = Math.round((minPriceNum + Math.random() * priceRange) / 5000) * 5000;
    
    const squareFeet = Math.floor(Math.random() * 1500) + 500;
    
    // Random coordinates in the UK
    const latitude = 51.5 + (Math.random() - 0.5) * 2;
    const longitude = -0.1 + (Math.random() - 0.5) * 2;
    
    const imageId = Math.floor(Math.random() * 1000);
    const imageUrl = `https://source.unsplash.com/random/800x600?house,property&sig=${imageId}`;
    
    const descriptions = [
      `Beautiful ${bedrooms} bedroom ${selectedPropertyType.toLowerCase()} in the heart of ${cities}. This property features ${bathrooms} bathrooms and approximately ${squareFeet} square feet of living space.`,
      `Charming ${selectedPropertyType.toLowerCase()} with ${bedrooms} bedrooms and ${bathrooms} bathrooms. Located in a quiet neighborhood of ${cities}.`,
      `Spacious ${bedrooms} bedroom ${selectedPropertyType.toLowerCase()} offering approximately ${squareFeet} square feet. Modern amenities throughout.`,
      `Recently renovated ${selectedPropertyType.toLowerCase()} with ${bedrooms} bedrooms in ${cities}. Features ${bathrooms} bathrooms and an open floor plan.`,
    ];
    
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    const agentNames = ['John Smith', 'Emma Watson', 'Michael Brown', 'Sarah Jones', 'David Wilson'];
    const agentName = agentNames[Math.floor(Math.random() * agentNames.length)];
    
    const now = new Date();
    const pastDate = new Date();
    pastDate.setMonth(now.getMonth() - Math.floor(Math.random() * 12));
    
    properties.push({
      id: crypto.randomUUID(),
      address: `${houseNumber} ${streetName}, ${cities}, ${postcode}`,
      price: price,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      square_feet: squareFeet,
      image_url: imageUrl,
      latitude: latitude,
      longitude: longitude,
      property_type: selectedPropertyType,
      description: description,
      agent: {
        name: agentName,
        phone: `+44 7${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
      },
      created_at: pastDate.toISOString(),
      updated_at: now.toISOString(),
    });
  }
  
  // Apply filters to the generated properties
  if (property_type && property_type !== 'any') {
    // Case-insensitive property type filtering
    properties = properties.filter(p => 
      p.property_type.toLowerCase() === property_type.toLowerCase()
    );
  }
  
  if (min_price) {
    properties = properties.filter(p => p.price >= parseInt(min_price));
  }
  
  if (max_price) {
    properties = properties.filter(p => p.price <= parseInt(max_price));
  }
  
  if (min_bedrooms) {
    properties = properties.filter(p => p.bedrooms >= parseInt(min_bedrooms));
  }
  
  if (max_bedrooms) {
    properties = properties.filter(p => p.bedrooms <= parseInt(max_bedrooms));
  }
  
  // Trim to the requested number
  return properties.slice(0, count);
}

// Fetch properties based on search parameters
async function fetchUKProperties(params: PropertySearchParams): Promise<UKProperty[]> {
  console.log(`Searching for properties with parameters:`, params);
  
  try {
    // Generate mock data based on the provided search parameters
    return generateMockProperties(params);
  } catch (error) {
    console.error('Error fetching UK properties:', error);
    return [];
  }
}

// Supabase function request handler
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // This API expects a POST request with JSON payload
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405 
        }
      );
    }

    // Parse the request body
    const body = await req.json();
    console.log('Search parameters:', body);
    
    if (!body.area) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: area' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    const searchParams: PropertySearchParams = body;
    
    // Fetch properties data
    const properties = await fetchUKProperties(searchParams);
    
    return new Response(
      JSON.stringify({ 
        data: properties,
        total: properties.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
