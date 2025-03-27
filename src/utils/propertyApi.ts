import { supabase } from "@/integrations/supabase/client";

export interface PropertySearchParams {
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

export interface UKProperty {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  image_url: string | null;
  property_type?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  agent?: {
    name: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
  property_details?: {
    market_demand: string;
    area_growth: string;
    crime_rate: string;
    nearby_schools: number;
    energy_rating: string;
    council_tax_band: string;
    property_features: string[];
  };
}

export interface PropertySearchResponse {
  data: UKProperty[];
  total: number;
}

export const searchProperties = async (params: PropertySearchParams): Promise<PropertySearchResponse> => {
  console.log("Searching properties with params:", params);
  
  try {
    const { data, error } = await supabase.functions.invoke('uk-property-api', {
      body: params
    });

    if (error) {
      console.error('Error fetching properties:', error);
      throw new Error('Failed to fetch properties');
    }

    console.log(`Successfully fetched ${data.data.length} properties`);
    return data as PropertySearchResponse;
  } catch (error) {
    console.error('Error in searchProperties:', error);
    throw error;
  }
};

export const searchDatabaseProperties = async (searchTerm: string): Promise<UKProperty[]> => {
  console.log("Searching database properties with term:", searchTerm);
  
  try {
    // Convert search term to lowercase for case-insensitive search
    const term = searchTerm.toLowerCase();
    
    let query = supabase
      .from('property_listings')
      .select('*');
      
    // If search term is provided, filter the results
    if (term) {
      query = query.or(`address.ilike.%${term}%,price::text.ilike.%${term}%,bedrooms::text.eq.${term},bathrooms::text.eq.${term}`);
    }
    
    const { data, error } = await query.order('investment_score', { ascending: false });

    if (error) {
      console.error('Error searching database properties:', error);
      // Return empty array instead of throwing
      return [];
    }
    
    if (!data) {
      console.log(`No data returned from Supabase for "${searchTerm}"`);
      return [];
    }

    console.log(`Found ${data.length} properties in database matching "${searchTerm}"`);
    return data;
  } catch (error) {
    console.error('Error in searchDatabaseProperties:', error);
    // Return empty array instead of throwing
    return [];
  }
};

export const getPropertyById = async (id: string): Promise<UKProperty | null> => {
  console.log("Getting property by ID:", id);
  
  try {
    const { data, error } = await supabase
      .from('property_listings')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching property by ID:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getPropertyById:', error);
    return null;
  }
};

export interface PropertyDataSearchParams {
  key: string;
  postcode?: string;
  location?: string;
  bedrooms?: string;
  radius_miles?: string;
  page_size?: string;
  property_type?: string;
  min_price?: string;
  max_price?: string;
  min_beds?: string;
  max_beds?: string;
}

export interface PropertyDataRawItem {
  price: number;
  lat: string;
  lng: string;
  bedrooms?: number;
  type?: string;
  distance?: string;
  sstc?: number;
  portal?: string;
}

export interface PropertyDataProperty {
  property_id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms?: number;
  property_type: string;
  description: string;
  image_url: string;
  listing_url: string;
  agent_name: string;
  agent_phone?: string;
  latitude: number;
  longitude: number;
  date_added: string;
}

export interface PropertyDataResponse {
  status: string;
  data: {
    properties: PropertyDataProperty[];
    total: number;
  };
}

const placeholderImages = [
  "https://images.unsplash.com/photo-1433832597046-4f10e10ac764",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b",
  "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb",
];

const getRandomPlaceholder = () => {
  return placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour window
const MAX_REQUESTS_PER_WINDOW = 10; // Maximum 10 requests per hour per user
const requestTimestamps: Record<string, number[]> = {};

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  
  // Initialize user's timestamp array if it doesn't exist
  if (!requestTimestamps[userId]) {
    requestTimestamps[userId] = [];
  }
  
  // Remove timestamps older than the window
  requestTimestamps[userId] = requestTimestamps[userId].filter(
    timestamp => timestamp > now - RATE_LIMIT_WINDOW_MS
  );
  
  // Check if user has exceeded the rate limit
  if (requestTimestamps[userId].length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  // Add current timestamp
  requestTimestamps[userId].push(now);
  return true;
};

// Clean up old user data periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(requestTimestamps).forEach(userId => {
    requestTimestamps[userId] = requestTimestamps[userId].filter(
      timestamp => timestamp > now - RATE_LIMIT_WINDOW_MS
    );
    if (requestTimestamps[userId].length === 0) {
      delete requestTimestamps[userId];
    }
  });
}, 3600000); // Clean up every hour

export const searchPropertyData = async (params: PropertyDataSearchParams): Promise<PropertySearchResponse> => {
  console.log("=== PropertyData API Integration ===");
  console.log("Starting PropertyData search with parameters:", { ...params, key: "***HIDDEN***" });
  
  try {
    // Generate a user ID based on the API key (first 8 characters)
    const userId = params.key.substring(0, 8);
    
    // Check rate limit before making the request
    if (!checkRateLimit(userId)) {
      const oldestRequest = Math.min(...requestTimestamps[userId]);
      const waitTime = Math.ceil((RATE_LIMIT_WINDOW_MS - (Date.now() - oldestRequest)) / 1000 / 60);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} minute${waitTime !== 1 ? 's' : ''} before trying again.`);
    }

    // Check if the location value looks like a UK postcode
    const isPostcode = (value: string) => {
      // Basic UK postcode regex pattern
      const postcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
      return postcodePattern.test(value.replace(/\s+/g, ''));
    };

    // If location is provided but doesn't look like a postcode, use areas endpoint
    if (params.location && !isPostcode(params.location)) {
      console.log(`Location "${params.location}" doesn't look like a postcode, using closest match`);
      
      // For non-postcode locations, we should use a different endpoint or parameter
      // Since PropertyData API requires a postcode, we'll use a sample London postcode for demo
      // In a real implementation, you might need to geocode the location to find a nearby postcode
      params.postcode = "W149JH"; // Central London sample postcode
      
      // Add location as debug info
      console.log(`Using sample postcode ${params.postcode} for location: ${params.location}`);
      delete params.location;
    } else if (params.location) {
      // If it looks like a postcode, use it directly
      params.postcode = params.location;
      console.log(`Location is a valid postcode: ${params.postcode}`);
      delete params.location;
    }

    if (params.min_beds && (!params.max_beds || params.min_beds === params.max_beds)) {
      params.bedrooms = params.min_beds;
      delete params.min_beds;
      delete params.max_beds;
    }

    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    // Call the PropertyData /prices endpoint with the given parameters
    console.log("1. Calling /prices endpoint");
    const url = `https://api.propertydata.co.uk/prices?${queryParams}`;
    const pricesResponse = await fetch(url);
    
    console.log(`/prices endpoint response status: ${pricesResponse.status}`);
    
    // Check if the response is ok (status code 200-299)
    if (!pricesResponse.ok) {
      console.error(`/prices endpoint error: ${pricesResponse.status} ${pricesResponse.statusText}`);
      const errorText = await pricesResponse.text();
      console.error(`/prices endpoint error text:`, errorText);
      throw new Error(`PropertyData API error: ${pricesResponse.statusText}`);
    }
    
    const pricesData = await pricesResponse.json();
    
    if (pricesData.status !== "success") {
      console.error(`/prices endpoint API error: ${JSON.stringify(pricesData)}`);
      throw new Error(`API returned error: ${JSON.stringify(pricesData)}`);
    }
    
    console.log(`/prices endpoint success: Found ${pricesData.data?.raw_data?.length || 0} data points`);
    
    const properties: UKProperty[] = [];

    if (pricesData.data && pricesData.data.raw_data) {
      console.log(`Creating properties from ${pricesData.data.raw_data.length} data points`);
      
      // Create property objects from the main prices endpoint data
      console.log("Creating property objects from prices endpoint data");
      
      pricesData.data.raw_data.forEach((item: PropertyDataRawItem, index: number) => {
        const description = `PropertyData.co.uk listing in ${params.postcode}`;
        
        const property: UKProperty = {
          id: `property-data-${index}`,
          address: params.postcode + (item.type ? `, ${item.type}` : ''),
          price: item.price || 0,
          bedrooms: item.bedrooms || null,
          bathrooms: Math.floor(Math.random() * 3) + 1,
          square_feet: Math.floor(Math.random() * 500) + 500,
          property_type: item.type || 'Unknown',
          description: description,
          image_url: getRandomPlaceholder(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          agent: {
            name: item.portal || 'Unknown',
            phone: '123-456-7890'
          },
          latitude: item.lat ? parseFloat(item.lat) : null,
          longitude: item.lng ? parseFloat(item.lng) : null
        };
        
        properties.push(property);
      });
      
      console.log(`Created ${properties.length} property objects`);
    } else {
      console.warn("Expected data.raw_data was missing from API response");
    }
    
    // Create a response object with data and total
    const apiResponse = {
      data: properties,
      total: properties.length
    };
    
    console.log("Final API response:", {
      totalProperties: apiResponse.total,
      propertiesWithDetails: properties.filter(p => p.property_details).length,
      properties: properties.map(p => ({
        id: p.id,
        address: p.address,
        has_details: !!p.property_details
      }))
    });
    
    return apiResponse;
  } catch (error) {
    console.error("PropertyData API error:", error);
    throw error;
  }
};

export const getPropertyDataApiKey = (): string => {
  const apiKey = import.meta.env.VITE_PROPERTY_API_KEY;
  console.log("API key from env:", apiKey ? "Found (not shown)" : "Not found");
  return apiKey || '';
};

export const testPropertyDataApiKey = async (): Promise<boolean> => {
  try {
    const apiKey = getPropertyDataApiKey();
    console.log("Testing API key: Found (not shown)");
    
    if (!apiKey) {
      return false;
    }
    
    const response = await fetch(`https://api.propertydata.co.uk/prices?key=${apiKey}&postcode=W149JH`);
    
    const responseText = await response.text();
    
    if (response.status !== 200) {
      console.error("API test failed:", response.status, responseText);
      return false;
    }
    
    try {
      const data = JSON.parse(responseText);
      return data.status === "success";
    } catch (error) {
      console.error("Error parsing API test response:", error);
      return false;
    }
  } catch (error) {
    console.error("Error testing API key:", error);
    return false;
  }
};

export const debugApiKeyTest = async (): Promise<void> => {
  try {
    const apiKey = "HPK2YZUMHZ";
    console.log("Debug: Testing with hardcoded key");
    
    const url = `https://api.propertydata.co.uk/prices?key=${apiKey}&postcode=W149JH`;
    console.log("Debug: Testing with URL:", url.replace(apiKey, "***HIDDEN***"));
    
    const response = await fetch(url);
    console.log("Debug: API response status:", response.status);
    
    const responseText = await response.text();
    console.log("Debug: API response:", responseText.substring(0, 200));
    
    try {
      const jsonResult = JSON.parse(responseText);
      console.log("Debug: API response as JSON:", jsonResult);
    } catch (parseError) {
      console.log("Debug: Could not parse as JSON");
    }
  } catch (error) {
    console.error("Debug: API test failed with error:", error);
  }
};