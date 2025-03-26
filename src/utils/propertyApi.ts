
import { supabase } from "@/integrations/supabase/client";
import { PropertyListing } from "@/types/property";

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

export interface PropertySearchResponse {
  data: UKProperty[];
  total: number;
}

export const searchProperties = async (params: PropertySearchParams): Promise<PropertySearchResponse> => {
  console.log("Searching properties with params:", params);
  
  try {
    // Fix for empty property_type being sent as "any"
    if (params.property_type === "any") {
      delete params.property_type;
    }
    
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

export const searchDatabaseProperties = async (
  searchTerm: string, 
  filters?: Partial<PropertySearchParams>
): Promise<PropertyListing[]> => {
  console.log("Searching database properties with term:", searchTerm, "and filters:", filters);
  
  try {
    // Convert search term to lowercase for case-insensitive search
    const term = searchTerm.toLowerCase();
    
    // Start with a base query
    let query = supabase.from('property_listings').select('*');
      
    // If search term is provided, filter the results
    if (term) {
      query = query.or(`address.ilike.%${term}%,price::text.ilike.%${term}%,bedrooms::text.eq.${term},bathrooms::text.eq.${term}`);
    }
    
    // Apply additional filters one by one if provided
    if (filters) {
      // Property type filter - ensure case insensitivity
      if (filters.property_type && filters.property_type !== "any") {
        query = query.ilike('property_type', filters.property_type);
      }
      
      // Price range filters - ensure numeric parsing
      if (filters.min_price) {
        const minPrice = parseInt(filters.min_price);
        if (!isNaN(minPrice)) {
          query = query.gte('price', minPrice);
        }
      }
      
      if (filters.max_price) {
        const maxPrice = parseInt(filters.max_price);
        if (!isNaN(maxPrice)) {
          query = query.lte('price', maxPrice);
        }
      }
      
      // Bedroom filters - ensure numeric parsing
      if (filters.min_bedrooms) {
        const minBeds = parseInt(filters.min_bedrooms);
        if (!isNaN(minBeds)) {
          query = query.gte('bedrooms', minBeds);
        }
      }
      
      if (filters.max_bedrooms) {
        const maxBeds = parseInt(filters.max_bedrooms);
        if (!isNaN(maxBeds)) {
          query = query.lte('bedrooms', maxBeds);
        }
      }
    }
    
    // Execute the query with explicit ordering
    const { data, error } = await query.order('investment_score', { ascending: false });

    if (error) {
      console.error('Error searching database properties:', error);
      throw new Error('Failed to search database properties');
    }

    console.log(`Found ${data?.length || 0} properties in database matching "${searchTerm}" with applied filters`);
    return data || [];
  } catch (error) {
    console.error('Error in searchDatabaseProperties:', error);
    throw error;
  }
};

export const getPropertyById = async (id: string) => {
  console.log("Getting property by ID:", id);
  
  try {
    const { data, error } = await supabase
      .from('property_listings')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching property by ID:', error);
      throw new Error('Failed to fetch property details');
    }
    
    return data;
  } catch (error) {
    console.error('Error in getPropertyById:', error);
    throw error;
  }
};
