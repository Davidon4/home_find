import { supabase } from "@/integrations/supabase/client";
import axios from 'axios';

/**
 * Rightmove API integration
 */

// Rightmove property interface based on the actual JSON data structure from Edinburgh properties
export interface RightmoveProperty {
  id: string;
  address: string;
  price: number;
  listing_type?: string;
  bedrooms: number | null;
  bathrooms: number | null;
  created_at: string;
  updated_at: string;
  property_type?: string;
  description?: string;
  square_feet?: number | null;
  property_details?: {
  tenure?: string;
  time_remaining_on_lease?: string;
  [key: string]: unknown;
  };
  rightmove_url?: string;
  image_url?: string | null;
  last_verified?: string;
  // Edinburgh-specific location field
  location?: {
    address?: string;
    search_location?: string;
    latitude?: number;
    longitude?: number;
  };
  // Allow for additional properties from database that may not match our expected schema
  [key: string]: unknown;
}

// Mapped property interface to match our app's structure
export interface MappedProperty {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  description?: string;
  propertyType: string;
  image_url: string | null;
  url?: string;
  features?: string[];
  dateAdded: string;
  listedSince: string;
  agent?: {
    name: string;
    phone: string;
  };
  rental_estimate?: number;
  roi_estimate?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  propertyDetails?: {
    market_demand: string;
    area_growth: string;
    crime_rate: string;
    nearby_schools: number;
    energy_rating: string;
    council_tax_band: string;
    property_features: string[];
  };
  marketTrends?: {
    appreciation_rate: number;
    market_activity?: string;
  };
}

/**
 * Fetch all properties using Supabase table directly to avoid CORS issues
 */
export async function fetchAllProperties(): Promise<MappedProperty[]> {
  try {
    console.log('Fetching properties directly from Supabase table');
    return await fetchPropertiesFromTable();
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

/**
 * Fallback function to fetch properties directly from the table
 */
async function fetchPropertiesFromTable(): Promise<MappedProperty[]> {
  try {
    console.log('Fetching properties directly from Supabase table');
    
    const { data, error } = await supabase
      .from('property_listings')
      .select('*')
      .order('price', { ascending: false });
    
    if (error) {
      console.error('Error fetching from table:', error);
      return [];
    }
    
    if (!data || !Array.isArray(data)) {
      console.log('No data returned from table query');
      return [];
    }
    
    console.log(`Found ${data.length} properties from table query`);
    
    // Convert database records to RightmoveProperty objects
    // Using 'as unknown as RightmoveProperty[]' to safely handle type conversion
    return mapRightmoveProperties(data as unknown as RightmoveProperty[]);
  } catch (error) {
    console.error('Error in fallback table query:', error);
    return [];
  }
}

/**
 * Search properties directly from the table
 */
async function searchPropertiesFromTable(searchTerm: string): Promise<MappedProperty[]> {
  try {
    console.log(`Searching properties directly from Supabase table with term: "${searchTerm}"`);
    
    // If no search term, return all properties (limited)
    if (!searchTerm || searchTerm.trim() === '') {
      const { data, error } = await supabase
        .from('property_listings')
        .select('*')
        .order('price', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error fetching all properties:', error);
        return [];
      }
      
      return mapRightmoveProperties(data as unknown as RightmoveProperty[]);
    }
    
    // Clean and prepare the search term
    const term = searchTerm.trim().toLowerCase();
    
    // Simple address search - this is most reliable
    const { data, error } = await supabase
      .from('property_listings')
      .select('*')
      .ilike('address', `%${term}%`)
      .order('price', { ascending: false });
    
    if (error) {
      console.error('Error searching by address:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} properties matching "${searchTerm}"`);
    
    // Convert database records to MappedProperty objects
    return mapRightmoveProperties(data as unknown as RightmoveProperty[]);
  } catch (error) {
    console.error('Error in table search:', error);
    return [];
  }
}

/**
 * Map Rightmove properties to MappedProperty format
 */
function mapRightmoveProperties(properties: RightmoveProperty[]): MappedProperty[] {
  // Make sure properties is an array before trying to filter/map it
  if (!Array.isArray(properties)) {
    console.warn('Expected array of properties but got:', typeof properties);
    return [];
  }
  
  return properties
    .filter(property => property !== null)
    .map(property => mapRightmoveProperty(property))
    .filter((property): property is MappedProperty => property !== null);
}

/**
 * Map a single Rightmove property to MappedProperty format
 */
function mapRightmoveProperty(property: RightmoveProperty): MappedProperty | null {
  if (!property) return null;
  
  try {
    // Calculate rental estimate based on property details
    const rentalEstimate = calculateRentalEstimate(
      property.price, 
      property.bedrooms, 
      property.property_type || 'Property'
    );
    
    // Calculate ROI based on price and rental estimate
    const roiEstimate = calculateROI(property.price, rentalEstimate);
    
    // Extract features from description if any
    const features = extractFeaturesFromDescription(property.description);
    
    // Extract location information - handle both direct properties and nested location object
    let latitude: number | undefined;
    let longitude: number | undefined;
    
    // Check for location object first (Edinburgh format)
    if (property.location) {
      latitude = property.location.latitude;
      longitude = property.location.longitude;
    }
    
    // Create a mapped property object
    const mappedProperty: MappedProperty = {
      id: property.id,
      address: property.address,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      square_feet: property.square_feet,
      description: property.description || '',
      propertyType: property.property_type || 'Property',
      image_url: property.image_url,
      url: property.rightmove_url,
      features: features,
      dateAdded: property.created_at,
      listedSince: property.updated_at || property.created_at, // Use created_at as fallback
      agent: {
        name: 'Rightmove Agent',
        phone: ''
      },
      rental_estimate: rentalEstimate,
      roi_estimate: roiEstimate,
      location: latitude || longitude ? {
        latitude: latitude || 0,
        longitude: longitude || 0
      } : undefined,
      propertyDetails: {
        market_demand: "Medium",
        area_growth: "3.5%",
        crime_rate: "Average",
        nearby_schools: 3,
        energy_rating: "C",
        council_tax_band: "D",
        property_features: features
      },
      marketTrends: {
        appreciation_rate: 3.2, // Default value
        market_activity: 'Moderate' // Default value
      }
    };
    
    return mappedProperty;
  } catch (error) {
    console.error('Error mapping Rightmove property:', error, property);
    return null;
  }
}

/**
 * Get a single property by ID directly from table
 */
export async function getPropertyById(id: string): Promise<MappedProperty | null> {
  try {
    console.log(`Getting property by ID directly from table: ${id}`);
    return await getPropertyByIdFromTable(id);
  } catch (error) {
    console.error('Error fetching property by ID:', error);
    return null;
  }
}

/**
 * Fallback function to get property by ID directly from the table
 */
async function getPropertyByIdFromTable(id: string): Promise<MappedProperty | null> {
  try {
    console.log(`Getting property by ID directly from table: ${id}`);
    
    const { data, error } = await supabase
      .from('property_listings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching property by ID from table:', error);
      return null;
    }
    
    if (!data) {
      console.log(`No property found with ID: ${id} in table`);
      return null;
    }
    
    // Convert database record to RightmoveProperty object
    // Using 'as unknown as RightmoveProperty' to safely handle type conversion
    return mapRightmoveProperty(data as unknown as RightmoveProperty);
  } catch (error) {
    console.error('Error in fallback property ID query:', error);
    return null;
  }
}

/**
 * Extract features from the property description
 */
function extractFeaturesFromDescription(description: string): string[] {
  if (!description) return [];
  
  // List of common property features to look for
  const featureKeywords = [
    'garden', 'parking', 'garage', 'modern', 'renovated', 'fireplace',
    'pool', 'view', 'balcony', 'terrace', 'patio', 'conservatory',
    'central heating', 'double glazing', 'en-suite', 'open plan',
    'kitchen diner', 'utility room', 'study', 'office', 'gym'
  ];
  
  // Find matches in the description
  const features: string[] = [];
  const descriptionLower = description.toLowerCase();
  
  featureKeywords.forEach(keyword => {
    if (descriptionLower.includes(keyword)) {
      // Capitalize first letter of each word
      features.push(keyword.replace(/\b\w/g, l => l.toUpperCase()));
    }
  });
  
  return features;
}

/**
 * Calculate a rental estimate based on property details
 */
function calculateRentalEstimate(price: number, bedrooms: number | null, propertyType: string): number {
  if (!price) return 0;
  if (!bedrooms) bedrooms = 2; // Default to 2 bedrooms if not specified
  
  // Base rental is roughly 0.8% of property value annually, divided by 12 for monthly
  let baseRental = (price * 0.008) / 12;
  
  // Adjust for bedrooms
  baseRental *= (1 + (bedrooms - 2) * 0.1); // +/- 10% per bedroom difference from 2
  
  // Adjust for property type
  const propertyTypeLower = propertyType.toLowerCase();
  if (propertyTypeLower.includes('flat') || propertyTypeLower.includes('apartment')) {
    baseRental *= 1.1; // Flats typically have higher rental yields
  } else if (propertyTypeLower.includes('detached')) {
    baseRental *= 0.9; // Detached houses typically have lower rental yields
  }
  
  return Math.round(baseRental);
}

/**
 * Calculate ROI based on price and rental income
 */
function calculateROI(price: number, monthlyRental: number): number {
  if (!price || !monthlyRental) return 0;
  const annualRental = monthlyRental * 12;
  return (annualRental / price) * 100; // Return as percentage
}

/**
 * Search Rightmove properties
 * @param searchTerm The term to search for
 * @returns Array of mapped properties matching the search term
 */
export async function searchRightmoveProperties(searchTerm: string): Promise<MappedProperty[]> {
  try {
    console.log(`Searching Rightmove properties with term: "${searchTerm}"`);
    return await searchPropertiesFromTable(searchTerm);
  } catch (error) {
    console.error('Error searching Rightmove properties:', error);
    return [];
  }
}

/**
 * PaTMa API integration
 * Based on the API documentation with endpoint: /api/prospector/{version}/list-property/
 */
export const fetchPatmaPropertyData = async (
  latitude = 51.507351, 
  longitude = -0.127758, 
  radius = 5,
  filters = {
    minBedrooms: 3,
    minBathrooms: 2,
    minPrice: 70000,
    maxPrice: 275000,
    propertyTypes: ['semi-detached', 'detached', 'terraced'],
    includeKeywords: ['cash only', 'modernization', 'modernization needed'],
    excludeKeywords: ['new home', 'retirement', 'shared ownership', 'auction']
  }
) => {
  const apiKey = import.meta.env.VITE_ACCESS_TOKEN;
  console.log("Using API Key:", apiKey);
  
  try {
    // Make separate API calls for each property type to overcome the API limitation
    const allResults = [];
    
    // Valid property types according to the API
    const validPropertyTypes = filters.propertyTypes.filter(type => 
      ['flat', 'terraced', 'semi-detached', 'detached'].includes(type)
    );
    
    if (validPropertyTypes.length === 0) {
      validPropertyTypes.push('terraced', 'semi-detached', 'detached'); // Default if none specified
    }
    
    console.log("Searching for property types:", validPropertyTypes);
    console.log("Looking for keywords:", filters.includeKeywords ? filters.includeKeywords.join(', ') : 'None');
    
    // Make a separate request for each property type
    for (const propertyType of validPropertyTypes) {
      try {
        console.log(`Fetching ${propertyType} properties...`);
        const response = await axios.get('https://app.patma.co.uk/api/prospector/v1/list-property/', {
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            api_key: apiKey,
            lat: latitude,
            long: longitude,
            radius: radius,
            require_sold_price: true,
            include_sold_history: true,
            page: 1,
            page_size: 100,
            min_bedrooms: filters.minBedrooms,
            min_bathrooms: filters.minBathrooms,
            min_price: filters.minPrice,
            max_price: filters.maxPrice,
            property_type: propertyType // Single property type per request
          }
        });
        
        if (response.data && response.data.status === 'success') {
          const results = response.data.data.available_results || [];
          console.log(`Found ${results.length} ${propertyType} properties`);
          
          // Add fallback descriptions for properties that don't have them
          const resultsWithDescriptions = results.map(property => {
            if (!property.description || property.description.trim() === '') {
              // Generate a basic description based on property details
              const bedroomText = property.bedrooms ? `${property.bedrooms} bedroom` : '';
              const propertyTypeText = property.property_type || propertyType;
              const locationText = property.address ? 
                `located in ${property.address.split(',').pop()?.trim() || 'a popular area'}` : 
                '';
              
              // Use proper assignment that preserves the property type
              return {
                ...property,
                description: `A ${bedroomText} ${propertyTypeText} ${locationText}. This property is available for purchase and could be an excellent investment opportunity. Contact the agent for more details and to arrange a viewing.`
              };
            }
            return property;
          });
          
          allResults.push(...resultsWithDescriptions);
        }
      } catch (error) {
        console.error(`Error fetching ${propertyType} properties:`, error);
      }
    }
    
    console.log(`Found a total of ${allResults.length} properties across all types`);
    
    // Apply additional filters to ensure property requirements are met
    let filteredResults = allResults;
    
    // Filter by price to ensure API filters are working correctly
    filteredResults = filteredResults.filter(property => {
      // Get the most relevant price from the property
      const propertyPrice = property.price || property.asking_price || property.last_sold_price || 0;
      
      // Only keep properties within our price range
      return propertyPrice >= filters.minPrice && propertyPrice <= filters.maxPrice;
    });
    
    console.log(`After price filtering (£${filters.minPrice/1000}K-£${filters.maxPrice/1000}K): ${filteredResults.length} properties remain`);
    
    // Filter to INCLUDE properties with specific keywords
    if (filters.includeKeywords && filters.includeKeywords.length > 0) {
      const keywordFilteredResults = filteredResults.filter(property => {
        const addressLower = (property.address || '').toLowerCase();
        const descriptionLower = (property.description || '').toLowerCase();
        
        // Include property if ANY of the keywords are found in the address or description
        return filters.includeKeywords.some(keyword => 
          addressLower.includes(keyword.toLowerCase()) || 
          descriptionLower.includes(keyword.toLowerCase())
        );
      });
      
      // If we found properties with the desired keywords, use only those
      if (keywordFilteredResults.length > 0) {
        filteredResults = keywordFilteredResults;
        console.log(`Found ${keywordFilteredResults.length} properties with keywords: ${filters.includeKeywords.join(', ')}`);
      } else {
        console.log(`No properties found with keywords: ${filters.includeKeywords.join(', ')}`);
      }
    }
    
    // Filter out properties with excluded keywords
    if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
      filteredResults = filteredResults.filter(property => {
        const addressLower = (property.address || '').toLowerCase();
        const descriptionLower = (property.description || '').toLowerCase();
        
        // Check if any excluded keyword is found in the address or description
        return !filters.excludeKeywords.some(keyword => 
          addressLower.includes(keyword.toLowerCase()) || 
          descriptionLower.includes(keyword.toLowerCase())
        );
      });
      
      console.log(`After excluding keywords: ${filteredResults.length} properties remain`);
    }
    
    return filteredResults;
  } catch (error) {
    // If the first authentication method fails, try an alternative
    if (error.response && error.response.status === 401) {
      console.log("First authentication method failed, trying alternative...");
      
      try {
        // Similar structure as above, but with different authentication
        const allResults = [];
        
        // Valid property types according to the API
        const validPropertyTypes = filters.propertyTypes.filter(type => 
          ['flat', 'terraced', 'semi-detached', 'detached'].includes(type)
        );
        
        if (validPropertyTypes.length === 0) {
          validPropertyTypes.push('terraced', 'semi-detached', 'detached'); // Default if none specified
        }
        
        console.log("Searching for property types (alt auth):", validPropertyTypes);
        console.log("Looking for keywords (alt auth):", filters.includeKeywords ? filters.includeKeywords.join(', ') : 'None');
        
        // Make a separate request for each property type
        for (const propertyType of validPropertyTypes) {
          try {
            const response = await axios.get('https://app.patma.co.uk/api/prospector/v1/list-property/', {
              headers: {
                'Authorization': `Basic ${btoa(`${apiKey}:`)}`,
                'Content-Type': 'application/json'
              },
              params: {
                lat: latitude,
                long: longitude,
                radius: radius,
                require_sold_price: true,
                include_sold_history: true,
                page: 1,
                page_size: 100,
                min_bedrooms: filters.minBedrooms,
                min_bathrooms: filters.minBathrooms,
                min_price: filters.minPrice,
                max_price: filters.maxPrice,
                property_type: propertyType // Single property type per request
              }
            });
            
            if (response.data && response.data.status === 'success') {
              const results = response.data.data.available_results || [];
              
              // Add fallback descriptions for properties that don't have them
              const resultsWithDescriptions = results.map(property => {
                if (!property.description || property.description.trim() === '') {
                  // Generate a basic description based on property details
                  const bedroomText = property.bedrooms ? `${property.bedrooms} bedroom` : '';
                  const propertyTypeText = property.property_type || propertyType;
                  const locationText = property.address ? 
                    `located in ${property.address.split(',').pop()?.trim() || 'a popular area'}` : 
                    '';
                  
                  // Use proper assignment that preserves the property type
                  return {
                    ...property,
                    description: `A ${bedroomText} ${propertyTypeText} ${locationText}. This property is available for purchase and could be an excellent investment opportunity. Contact the agent for more details and to arrange a viewing.`
                  };
                }
                return property;
              });
              
              allResults.push(...resultsWithDescriptions);
            }
          } catch (error) {
            console.error(`Error fetching ${propertyType} properties with alternative auth:`, error);
          }
        }
        
        // Apply additional filters to ensure property requirements are met
        let filteredResults = allResults;
        
        // Filter by price to ensure API filters are working correctly
        filteredResults = filteredResults.filter(property => {
          // Get the most relevant price from the property
          const propertyPrice = property.price || property.asking_price || property.last_sold_price || 0;
          
          // Only keep properties within our price range
          return propertyPrice >= filters.minPrice && propertyPrice <= filters.maxPrice;
        });
        
        console.log(`After price filtering (£${filters.minPrice/1000}K-£${filters.maxPrice/1000}K): ${filteredResults.length} properties remain`);
        
        // Filter to INCLUDE properties with specific keywords
        if (filters.includeKeywords && filters.includeKeywords.length > 0) {
          const keywordFilteredResults = filteredResults.filter(property => {
            const addressLower = (property.address || '').toLowerCase();
            const descriptionLower = (property.description || '').toLowerCase();
            
            // Include property if ANY of the keywords are found in the address or description
            return filters.includeKeywords.some(keyword => 
              addressLower.includes(keyword.toLowerCase()) || 
              descriptionLower.includes(keyword.toLowerCase())
            );
          });
          
          // If we found properties with the desired keywords, use only those
          if (keywordFilteredResults.length > 0) {
            filteredResults = keywordFilteredResults;
            console.log(`Found ${keywordFilteredResults.length} properties with keywords: ${filters.includeKeywords.join(', ')}`);
          } else {
            console.log(`No properties found with keywords: ${filters.includeKeywords.join(', ')}`);
          }
        }
        
        // Filter out properties with excluded keywords
        if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
          filteredResults = filteredResults.filter(property => {
            const addressLower = (property.address || '').toLowerCase();
            const descriptionLower = (property.description || '').toLowerCase();
            
            return !filters.excludeKeywords.some(keyword => 
              addressLower.includes(keyword.toLowerCase()) || 
              descriptionLower.includes(keyword.toLowerCase())
            );
          });
          
          console.log(`After excluding keywords: ${filteredResults.length} properties remain`);
        }
        
        return filteredResults;
      } catch (altError) {
        console.error('Error with alternative authentication:', altError);
        
        // If both methods fail, try a third method
        try {
          console.log("Trying third authentication method...");
          // Similar structure as above, but with Bearer token
          const allResults = [];
          
          // Valid property types according to the API
          const validPropertyTypes = filters.propertyTypes.filter(type => 
            ['flat', 'terraced', 'semi-detached', 'detached'].includes(type)
          );
          
          if (validPropertyTypes.length === 0) {
            validPropertyTypes.push('terraced', 'semi-detached', 'detached'); // Default if none specified
          }
          
          console.log("Searching for property types (third auth):", validPropertyTypes);
          console.log("Looking for keywords (third auth):", filters.includeKeywords ? filters.includeKeywords.join(', ') : 'None');
          
          // Make a separate request for each property type
          for (const propertyType of validPropertyTypes) {
            try {
              const response = await axios.get('https://app.patma.co.uk/api/prospector/v1/list-property/', {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                },
                params: {
                  lat: latitude,
                  long: longitude,
                  radius: radius,
                  require_sold_price: true,
                  include_sold_history: true,
                  page: 1,
                  page_size: 100,
                  min_bedrooms: filters.minBedrooms,
                  min_bathrooms: filters.minBathrooms,
                  min_price: filters.minPrice,
                  max_price: filters.maxPrice,
                  property_type: propertyType // Single property type per request
                }
              });
              
              if (response.data && response.data.status === 'success') {
                const results = response.data.data.available_results || [];
                
                // Add fallback descriptions for properties that don't have them
                const resultsWithDescriptions = results.map(property => {
                  if (!property.description || property.description.trim() === '') {
                    // Generate a basic description based on property details
                    const bedroomText = property.bedrooms ? `${property.bedrooms} bedroom` : '';
                    const propertyTypeText = property.property_type || propertyType;
                    const locationText = property.address ? 
                      `located in ${property.address.split(',').pop()?.trim() || 'a popular area'}` : 
                      '';
                    
                    // Use proper assignment that preserves the property type
                    return {
                      ...property,
                      description: `A ${bedroomText} ${propertyTypeText} ${locationText}. This property is available for purchase and could be an excellent investment opportunity. Contact the agent for more details and to arrange a viewing.`
                    };
                  }
                  return property;
                });
                
                allResults.push(...resultsWithDescriptions);
              }
            } catch (error) {
              console.error(`Error fetching ${propertyType} properties with third auth:`, error);
            }
          }
          
          // Apply additional filters to ensure property requirements are met
          let filteredResults = allResults;
          
          // Filter by price to ensure API filters are working correctly
          filteredResults = filteredResults.filter(property => {
            // Get the most relevant price from the property
            const propertyPrice = property.price || property.asking_price || property.last_sold_price || 0;
            
            // Only keep properties within our price range
            return propertyPrice >= filters.minPrice && propertyPrice <= filters.maxPrice;
          });
          
          console.log(`After price filtering (£${filters.minPrice/1000}K-£${filters.maxPrice/1000}K): ${filteredResults.length} properties remain`);
          
          // Filter to INCLUDE properties with specific keywords
          if (filters.includeKeywords && filters.includeKeywords.length > 0) {
            const keywordFilteredResults = filteredResults.filter(property => {
              const addressLower = (property.address || '').toLowerCase();
              const descriptionLower = (property.description || '').toLowerCase();
              
              // Include property if ANY of the keywords are found in the address or description
              return filters.includeKeywords.some(keyword => 
                addressLower.includes(keyword.toLowerCase()) || 
                descriptionLower.includes(keyword.toLowerCase())
              );
            });
            
            // If we found properties with the desired keywords, use only those
            if (keywordFilteredResults.length > 0) {
              filteredResults = keywordFilteredResults;
              console.log(`Found ${keywordFilteredResults.length} properties with keywords: ${filters.includeKeywords.join(', ')}`);
            } else {
              console.log(`No properties found with keywords: ${filters.includeKeywords.join(', ')}`);
            }
          }
          
          // Filter out properties with excluded keywords
          if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
            filteredResults = filteredResults.filter(property => {
              const addressLower = (property.address || '').toLowerCase();
              const descriptionLower = (property.description || '').toLowerCase();
              
              return !filters.excludeKeywords.some(keyword => 
                addressLower.includes(keyword.toLowerCase()) || 
                descriptionLower.includes(keyword.toLowerCase())
              );
            });
            
            console.log(`After excluding keywords: ${filteredResults.length} properties remain`);
          }
          
          return filteredResults;
        } catch (thirdError) {
          console.error('All authentication methods failed:', thirdError);
          return [];
        }
      }
    }
    
    console.error('Error fetching property data:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
      
      // Check for specific error messages in the API response
      if (error.response.data && error.response.data.errors) {
        console.error('API errors:', error.response.data.errors);
        
        // Display specific error message for property_type
        if (error.response.data.errors.some((err: string) => err.includes('property_type'))) {
          console.error('Please note: The PaTMa API only accepts these property types: flat, terraced, semi-detached, detached');
        }
      }
    } else {
      console.error('No response received - likely a CORS issue');
    }
    
    // Return empty array if all attempts failed
    return [];
  }
};

// Call the function to test the API

// fetchPatmaPropertyData(); 