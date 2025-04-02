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
    
    // Create Supabase client
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL || '',
      import.meta.env.VITE_SUPABASE_KEY || ''
    );
    
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
  let filteredData = [...data];
  
  // Filter by search query
  if (query && query.trim() !== '') {
    const searchQuery = query.toLowerCase();
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'address' in item) {
        const address = typeof item.address === 'string' ? item.address.toLowerCase() : '';
        return address.includes(searchQuery);
      }
      return false;
    });
  }
  
  // Filter by location
  if (filters.location && filters.location.trim() !== '') {
    const location = filters.location.toLowerCase();
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'address' in item) {
        const address = typeof item.address === 'string' ? item.address.toLowerCase() : '';
        return address.includes(location);
      }
      return false;
    });
  }
  
  // Filter by property type
  if (filters.propertyType) {
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'property_type' in item) {
        const propertyType = typeof item.property_type === 'string' ? 
          item.property_type.toLowerCase() : '';
        return propertyType === filters.propertyType.toLowerCase();
      }
      return false;
    });
  }
  
  // Filter by price range
  if (filters.minPrice) {
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'price' in item) {
        const price = typeof item.price === 'number' ? item.price : 0;
        return price >= filters.minPrice!;
      }
      return false;
    });
  }
  
  if (filters.maxPrice) {
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'price' in item) {
        const price = typeof item.price === 'number' ? item.price : 0;
        return price <= filters.maxPrice!;
      }
      return false;
    });
  }
  
  // Filter by bedrooms
  if (filters.minBedrooms) {
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'bedrooms' in item) {
        const bedrooms = typeof item.bedrooms === 'number' ? item.bedrooms : 0;
        return bedrooms >= filters.minBedrooms!;
      }
      return false;
    });
  }
  
  if (filters.maxBedrooms) {
    filteredData = filteredData.filter(item => {
      if (item && typeof item === 'object' && 'bedrooms' in item) {
        const bedrooms = typeof item.bedrooms === 'number' ? item.bedrooms : 0;
        return bedrooms <= filters.maxBedrooms!;
      }
      return false;
    });
  }
  
  return filteredData;
}

// Helper function to map properties to the interface
function mapPropertiesToInterface(filteredData: unknown[]): Property[] {
  const properties: Property[] = [];
  
  for (const rawItem of filteredData) {
    try {
      // Type assertion for TypeScript to recognize properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = rawItem as Record<string, unknown>;
      
      // Helper function to safely extract values
      const safeString = (value: unknown): string => 
        typeof value === 'string' ? value : '';
      
      const safeNumber = (value: unknown): number => 
        typeof value === 'number' ? value : 0;
      
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
        property_type: safeString(item.property_type),
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
      
      // Add optional fields if they exist and are of the correct type
      if (typeof item.rental_estimate === 'number') {
        property.rental_estimate = item.rental_estimate;
      }
      
      if (typeof item.roi_estimate === 'number') {
        property.roi_estimate = item.roi_estimate;
      }
      
      // Add property details if available
      if (item.property_details && typeof item.property_details === 'object') {
        property.property_details = item.property_details;
      }
      
      properties.push(property);
    } catch (error) {
      console.error("Error processing property:", error);
    }
  }
  
  return properties;
}