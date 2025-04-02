// src/utils/backend-api.ts
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";

export interface PropertySearchFilters {
  location?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
}

export interface PropertySearchParams {
  query: string;
  location?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
}

export interface PropertyLocation {
  address: string;
  search_location: string;
  latitude?: number;
  longitude?: number;
}

export interface PropertyDetails {
  market_demand?: string;
  area_growth?: string;
  crime_rate?: string;
  nearby_schools?: number;
  energy_rating?: string;
  council_tax_band?: string;
  property_features?: string[];
  original_created_at?: string;
  original_updated_at?: string;
}

export interface MarketTrends {
  appreciation_rate: number;
  market_activity: string;
}

export interface Property {
  id: string;
  address: string;
  price: number;
  listing_type: string;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
  updated_at: string;
  property_type: string;
  description: string;
  rightmove_url: string;
  image_url: string;
  location: PropertyLocation;
  last_verified: string;
  square_feet: number;
  property_details: PropertyDetails;
  rental_estimate?: number;
  roi_estimate?: number;
  market_trends?: MarketTrends;
  agent?: {
    name: string;
    phone: string;
  };
}

interface Agent {
  name: string;
  phone: string;
}

interface MarketTrendsData {
  appreciation_rate: number;
  market_activity: string;
}

// Type safe interface for Supabase row data
interface SupabaseRow {
  id: string;
  [key: string]: unknown;
}

export const searchProperties = async (
  query: string,
  filters: PropertySearchFilters = {}
): Promise<Property[]> => {
  try {
    console.log(`Fetching properties from Supabase with query: ${query}`);
    
    // Create Supabase client with proper error handling
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials missing. Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      return [];
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Log the SQL query we're about to make
    console.log('Querying Supabase property_listings table...');
    
    // Fetch all properties from the property_listings table
    const { data, error } = await supabase
      .from('property_listings')
      .select('*');
    
    // Handle Supabase error
    if (error) {
      console.error('Error fetching properties from Supabase:', error);
      return [];
    }
    
    // Check if data is available
    if (!data || data.length === 0) {
      console.log('No properties found in Supabase');
      return [];
    }
    
    console.log(`Found ${data.length} properties in Supabase`);
    
    // Log a sample of the raw data to verify structure
    const sampleData = data[0];
    console.log('Sample data structure:', {
      id: sampleData.id,
      property_type: sampleData.property_type,
      address: sampleData.address?.substring(0, 30) + '...',
      price: sampleData.price
    });
    
    // Filter the data based on the search query and filters
    const filteredData = filterProperties(data, query, filters);
    
    console.log(`Filtered to ${filteredData.length} properties`);
    
    // Map properties to the expected format
    const properties = mapPropertiesToInterface(filteredData);
    
    return properties;
  } catch (error) {
    console.error('Error in searchProperties:', error);
    return [];
  }
};

// Helper function to filter properties
function filterProperties(data: unknown[], query: string, filters: PropertySearchFilters): unknown[] {
  // Log what we're doing for debugging
  console.log(`Filtering ${data.length} properties with search term: "${query}"`);
  console.log('Applied filters:', filters);
  
  let filteredData = [...data];
  
  // Filter by search query - if empty, return all properties
  if (query && query.trim() !== '') {
    const searchQuery = query.toLowerCase();
    console.log(`Filtering by search query: "${searchQuery}"`);
    
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'address' in item) {
        const address = typeof item.address === 'string' ? item.address.toLowerCase() : '';
        
        // Use type-safe approach for optional properties
        const itemAsRecord = item as Record<string, unknown>;
        const description = typeof itemAsRecord.description === 'string' 
          ? itemAsRecord.description.toLowerCase() 
          : '';
        const propertyType = typeof itemAsRecord.property_type === 'string' 
          ? itemAsRecord.property_type.toLowerCase() 
          : '';
        
        // Search in address, description, and property type
        return address.includes(searchQuery) || 
               description.includes(searchQuery) || 
               propertyType.includes(searchQuery);
      }
      return false;
    });
    
    console.log(`After search query filter: ${filteredData.length} properties remain`);
  }
  
  // Filter by location
  if (filters.location && filters.location.trim() !== '') {
    const location = filters.location.toLowerCase();
    console.log(`Filtering by location: "${location}"`);
    
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'address' in item) {
        const address = typeof item.address === 'string' ? item.address.toLowerCase() : '';
        return address.includes(location);
      }
      return false;
    });
    
    console.log(`After location filter: ${filteredData.length} properties remain`);
  }
  
  // Filter by property type - case insensitive and partial match
  if (filters.propertyType && filters.propertyType.trim() !== '') {
    const propertyType = filters.propertyType.toLowerCase();
    console.log(`Filtering by property type: "${propertyType}"`);
    
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'property_type' in item) {
        const itemPropertyType = typeof item.property_type === 'string' ? 
          item.property_type.toLowerCase() : '';
        
        // Use includes for more flexible matching
        return itemPropertyType.includes(propertyType);
      }
      return false;
    });
    
    console.log(`After property type filter: ${filteredData.length} properties remain`);
  }
  
  // Filter by price range
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    console.log(`Filtering by min price: £${filters.minPrice}`);
    
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'price' in item) {
        const price = typeof item.price === 'number' ? item.price : 0;
        return price >= filters.minPrice!;
      }
      return false;
    });
    
    console.log(`After min price filter: ${filteredData.length} properties remain`);
  }
  
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    console.log(`Filtering by max price: £${filters.maxPrice}`);
    
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'price' in item) {
        const price = typeof item.price === 'number' ? item.price : 0;
        return price <= filters.maxPrice!;
      }
      return false;
    });
    
    console.log(`After max price filter: ${filteredData.length} properties remain`);
  }
  
  // Filter by bedrooms
  if (filters.minBedrooms !== undefined && filters.minBedrooms > 0) {
    console.log(`Filtering by min bedrooms: ${filters.minBedrooms}`);
    
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'bedrooms' in item) {
        const bedrooms = typeof item.bedrooms === 'number' ? item.bedrooms : 0;
        return bedrooms >= filters.minBedrooms!;
      }
      return false;
    });
    
    console.log(`After min bedrooms filter: ${filteredData.length} properties remain`);
  }
  
  if (filters.maxBedrooms !== undefined && filters.maxBedrooms > 0) {
    console.log(`Filtering by max bedrooms: ${filters.maxBedrooms}`);
    
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'bedrooms' in item) {
        const bedrooms = typeof item.bedrooms === 'number' ? item.bedrooms : 0;
        return bedrooms <= filters.maxBedrooms!;
      }
      return false;
    });
    
    console.log(`After max bedrooms filter: ${filteredData.length} properties remain`);
  }
  
  return filteredData;
}

// Helper function to map properties to the interface
function mapPropertiesToInterface(filteredData: unknown[]): Property[] {
  const properties: Property[] = [];
  
  console.log("Starting to map properties from database to interface");
  if (filteredData.length > 0) {
    console.log("First item raw data sample:", JSON.stringify(filteredData[0]).substring(0, 200) + "...");
  }
  
  for (const rawItem of filteredData) {
    try {
      // Type assertion for TypeScript to recognize properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = rawItem as Record<string, unknown>;
      
      // Debug the item to see what properties are available
      console.log("Processing item with id:", item.id);
      console.log("Item property_type:", item.property_type);
      
      // Helper function to safely extract values
      const safeString = (value: unknown): string => 
        typeof value === 'string' ? value : '';
      
      const safeNumber = (value: unknown): number => 
        typeof value === 'number' ? value : 0;

      // Extract property type from description if not directly available
      const extractPropertyType = (description: string): string => {
        const desc = description.toLowerCase();
        if (desc.includes('semi-detached')) return 'semi-detached';
        if (desc.includes('detached')) return 'detached';
        if (desc.includes('terraced')) return 'terraced';
        if (desc.includes('flat')) return 'flat';
        if (desc.includes('bungalow')) return 'bungalow';
        return 'Property';
      };
      
      // Get property type with fallback to description
      const propertyType = safeString(item.property_type) || 
                          extractPropertyType(safeString(item.description));
      
      // Create the property with safe type conversions
      const property: Property = {
        id: String(item.id || ''),
        address: safeString(item.address),
        price: safeNumber(item.price),
        listing_type: safeString(item.listing_type) || 'for-sale',
        bedrooms: safeNumber(item.bedrooms),
        bathrooms: safeNumber(item.bathrooms),
        created_at: safeString(item.created_at),
        updated_at: safeString(item.updated_at),
        property_type: propertyType, // Use the extracted property type
        description: safeString(item.description),
        rightmove_url: safeString(item.rightmove_url),
        image_url: safeString(item.image_url),
        location: {
          address: safeString(item.address),
          search_location: '',
          latitude: typeof item.latitude === 'number' ? item.latitude : undefined,
          longitude: typeof item.longitude === 'number' ? item.longitude : undefined
        },
        last_verified: safeString(item.last_verified),
        square_feet: safeNumber(item.square_feet),
        property_details: {}
      };
      
      // Handle property_details field which is a JSON object in the database
      if (item.property_details) {
        try {
          // It might already be parsed as an object or might be a string
          const details = typeof item.property_details === 'string' 
            ? JSON.parse(item.property_details) 
            : item.property_details;
            
          if (details && typeof details === 'object') {
            property.property_details = details as PropertyDetails;
          }
        } catch (e) {
          console.warn('Error parsing property_details:', e);
        }
      }
      
      // Add optional fields if they exist and are of the correct type
      if (item.rental_estimate) {
        property.rental_estimate = safeNumber(item.rental_estimate);
      }
      
      if (item.roi_estimate) {
        property.roi_estimate = safeNumber(item.roi_estimate);
      }
      
      // Handle agent field which is a JSON object in the database
      if (item.agent) {
        try {
          console.log(`Processing agent data for property ${item.id}:`, item.agent);
          const agent = typeof item.agent === 'string' 
            ? JSON.parse(item.agent) 
            : item.agent;
            
          if (agent && typeof agent === 'object') {
            property.agent = {
              name: safeString((agent as Agent).name),
              phone: safeString((agent as Agent).phone)
            };
            console.log(`Extracted agent info: ${property.agent.name}, ${property.agent.phone}`);
          }
        } catch (e) {
          console.warn('Error parsing agent data:', e);
        }
      }
      
      // Try to extract agent information from original_created_at in property_details if agent is empty
      if ((!property.agent || !property.agent.name) && 
          property.property_details) {
        const createdBy = safeString(property.property_details.original_created_at);
        const updatedBy = safeString(property.property_details.original_updated_at);
        
        // Try to extract agent name from either created or updated message
        const extractAgentName = (text: string): string | null => {
          const agentMatch = text.match(/by\s+([^,]+)/i);
          return agentMatch ? agentMatch[1].trim() : null;
        };
        
        const agentName = extractAgentName(createdBy) || extractAgentName(updatedBy);
        if (agentName) {
          property.agent = {
            name: agentName,
            phone: "Contact for details"
          };
        }
      }
      
      // If property_type is still missing, check if it's in investment_highlights
      if (!property.property_type && item.investment_highlights) {
        try {
          const highlights = typeof item.investment_highlights === 'string'
            ? JSON.parse(item.investment_highlights)
            : item.investment_highlights;
            
          if (highlights && typeof highlights === 'object' && 'type' in highlights) {
            property.property_type = safeString(highlights.type);
          }
        } catch (e) {
          console.warn('Error parsing investment_highlights for property type:', e);
        }
      }
      
      // Handle market_trends field which is a JSON object in the database
      if (item.market_trends) {
        try {
          const trends = typeof item.market_trends === 'string' 
            ? JSON.parse(item.market_trends) 
            : item.market_trends;
            
          if (trends && typeof trends === 'object') {
            property.market_trends = {
              appreciation_rate: safeNumber((trends as MarketTrendsData).appreciation_rate) || 3.0,
              market_activity: safeString((trends as MarketTrendsData).market_activity) || 'Moderate'
            };
          }
        } catch (e) {
          console.warn('Error parsing market_trends data:', e);
        }
      }
      
      // Log the final property object to verify property_type is set
      console.log(`Final mapped property ${property.id} type: ${property.property_type}`);
      
      properties.push(property);
    } catch (error) {
      console.error("Error processing property:", error);
    }
  }
  
  return properties;
}