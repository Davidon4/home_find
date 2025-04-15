import { supabase } from "@/integrations/supabase/client";
import axios from 'axios';
import { PatmaProperty } from "@/types/property";

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

// Cache management functions
const CACHE_KEY = 'property_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

interface CacheEntry {
  timestamp: number;
  data: PatmaProperty[];
  location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

const getCachedProperties = (latitude: number, longitude: number, radius: number): PatmaProperty[] | null => {
  try {
    const cacheString = localStorage.getItem(CACHE_KEY);
    if (!cacheString) return null;

    const cache: CacheEntry = JSON.parse(cacheString);
    const now = Date.now();

    // Check if cache is expired
    if (now - cache.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check if location matches (within 0.01 degrees and same radius)
    const locationMatches = 
      Math.abs(cache.location.latitude - latitude) < 0.01 &&
      Math.abs(cache.location.longitude - longitude) < 0.01 &&
      cache.location.radius === radius;

    return locationMatches ? cache.data : null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

const setCachedProperties = (data: PatmaProperty[], latitude: number, longitude: number, radius: number): void => {
  try {
    const cacheEntry: CacheEntry = {
      timestamp: Date.now(),
      data,
      location: { latitude, longitude, radius }
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

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
    minBedrooms: 1,
    maxBedrooms: 3,
    minBathrooms: 2,
    minPrice: 70000,
    maxPrice: 275000,
    propertyTypes: ['semi-detached', 'detached', 'terraced', 'bungalow'],
    includeKeywords: ['cash only', 'modernization', 'modernization needed'],
    excludeKeywords: ['new home', 'retirement', 'shared ownership', 'auction', 'flat', 'apartment']
  },
  bypassCache = false
) => {
  // Validate coordinates
  if (!latitude || !longitude) {
    console.error('Invalid coordinates:', { latitude, longitude });
    throw new Error('Valid latitude and longitude are required');
  }

  // Check cache first unless bypassing
  if (!bypassCache) {
    const cachedData = getCachedProperties(latitude, longitude, radius);
    if (cachedData) {
      console.log('Using cached property data');
      // Filter cached data to ensure bedroom constraints and property types
      const filteredCachedData = cachedData.filter(property => {
        const bedrooms = property.bedrooms || 0;
        const propertyType = (property.property_type || '').toLowerCase();
        return bedrooms >= filters.minBedrooms && 
               bedrooms <= filters.maxBedrooms && 
               !propertyType.includes('flat') && 
               !propertyType.includes('apartment');
      });
      console.log(`Filtered cached data from ${cachedData.length} to ${filteredCachedData.length} properties`);
      return filteredCachedData;
    }
  }

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
    console.log("Searching for properties with bedrooms:", filters.minBedrooms, "to", filters.maxBedrooms);
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
            max_bedrooms: filters.maxBedrooms,
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
    
    // Filter by property type - exclude flats and apartments
    filteredResults = filteredResults.filter(property => {
      const propertyType = (property.property_type || '').toLowerCase();
      return !propertyType.includes('flat') && !propertyType.includes('apartment');
    });
    
    console.log(`After excluding flats/apartments: ${filteredResults.length} properties remain`);
    
    // Filter by bedrooms to ensure API filters are working correctly
    filteredResults = filteredResults.filter(property => {
      const bedrooms = property.bedrooms || 0;
      return bedrooms >= filters.minBedrooms && bedrooms <= filters.maxBedrooms;
    });
    
    console.log(`After bedroom filtering (${filters.minBedrooms}-${filters.maxBedrooms} beds): ${filteredResults.length} properties remain`);
    
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
    
    // Before returning the filtered results, cache them
    if (filteredResults.length > 0) {
      setCachedProperties(filteredResults, latitude, longitude, radius);
    }
    
    return filteredResults;
  } catch (error) {
    console.error('Error fetching property data:', error);
    return [];
  }
};

// Additional PaTMa API endpoints
interface FloodRiskData {
  risk_level: string;
  flood_zone: string;
  risk_factors: string[];
  last_updated: string;
}

interface SchoolData {
  name: string;
  type: string;
  distance: number;
  rating: string;
  pupils: number;
  performance: {
    progress_score?: number;
    attainment_score?: number;
  };
}

interface CrimeData {
  crime_rate: string;
  total_crimes: number;
  crime_breakdown: {
    [key: string]: number;
  };
  trend: string;
  comparison: string;
}

interface FloorAreaData {
  total_area: number;
  floor_plans: Array<{
    floor: string;
    area: number;
    rooms: string[];
  }>;
  epc_rating?: string;
}

// Add these interfaces before the fetchPropertyDetails function
interface SchoolResponse {
  name: string;
  type: string;
  distance: number;
  rating: string;
  pupils: number;
  progress_score?: number;
  attainment_score?: number;
}

interface FloorPlanResponse {
  level: string;
  area: number;
  rooms: string[];
}

// Add this interface near the other interfaces at the top of the file
interface School {
  name: string;
  type?: string;
  distance?: number;
  rating?: string;
  pupils?: number;
  progress_score?: number;
  attainment_score?: number;
}

export const fetchPropertyDetails = async (address: string) => {
  const apiKey = import.meta.env.VITE_ACCESS_TOKEN;
  const baseUrl = 'https://app.patma.co.uk/api/prospector/v1';
  
  const headers = {
    'Authorization': `Token ${apiKey}`,
    'Content-Type': 'application/json'
  };

  try {
    // Extract postcode from the address
    const postcodeMatch = address.match(/([A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2})/i);
    if (!postcodeMatch) {
      console.error('Could not extract postcode from address:', address);
      return null;
    }

    const postcode = postcodeMatch[1];
    console.log('Using postcode:', postcode);

    // Make parallel API calls for each type of data
    const [planningResponse, designatedAreasResponse, geographiesResponse, schoolsResponse, crimeResponse] = await Promise.all([
      axios.get(`${baseUrl}/planning`, {
        headers,
        params: {
          api_key: apiKey,
          postcode: postcode
        }
      }),
      axios.get(`${baseUrl}/designated-areas`, {
        headers,
        params: {
          api_key: apiKey,
          postcode: postcode,
          area_types: 'conservation_area,listed_building,green_belt,aonb,national_park'
        }
      }),
      axios.get(`${baseUrl}/geographies`, {
        headers,
        params: {
          api_key: apiKey,
          postcode: postcode
        }
      }),
      axios.get(`${baseUrl}/schools`, {
        headers,
        params: {
          api_key: apiKey,
          postcode: postcode
        }
      }),
      axios.get(`${baseUrl}/crime`, {
        headers,
        params: {
          api_key: apiKey,
          postcode: postcode
        }
      })
    ]);

    // Process each response and extract the data
    const planningData = planningResponse.data?.status === 'success' ? planningResponse.data.data : null;
    const designatedAreasData = designatedAreasResponse.data?.status === 'success' ? designatedAreasResponse.data.data : null;
    const geographiesData = geographiesResponse.data?.status === 'success' ? geographiesResponse.data.data : null;
    const schoolsData = schoolsResponse.data?.status === 'success' ? schoolsResponse.data.data.schools : [];
    const crimeData = crimeResponse.data?.status === 'success' ? crimeResponse.data.data : null;

    // Log responses for debugging
    console.log('Planning Response:', planningResponse.data);
    console.log('Designated Areas Response:', designatedAreasResponse.data);
    console.log('Geographies Response:', geographiesResponse.data);
    console.log('Schools Response:', schoolsResponse.data);
    console.log('Crime Response:', crimeResponse.data);

    return {
      planning: planningData ? {
        applications: planningData.planning_applications?.map(app => ({
          reference: app.reference,
          description: app.description,
          status: app.decision_status,
          date_submitted: app.date_received,
          decision: app.decision_text,
          agent: app.agent,
          type: app.type,
          url: app.url,
          address: app.address,
          date_decided: app.date_decided,
          date_validated: app.date_validated,
          case_officer: app.case_officer
        })) || []
      } : null,
      designatedAreas: designatedAreasData ? {
        areas: designatedAreasData.areas?.map(area => ({
          type: area.area_type,
          within: area.within_area,
          name: area.within_name
        })) || []
      } : null,
      geographies: geographiesData ? {
        local_authority: geographiesData.local_authority || 'Unknown',
        ward: geographiesData.electoral_ward || 'Unknown',
        constituency: geographiesData.parliamentary_constituency || 'Unknown',
        region: geographiesData.region || 'Unknown',
        county: geographiesData.county || 'Unknown',
        parish: geographiesData.parish || 'Unknown',
        country: geographiesData.country || 'Unknown',
        police_force: geographiesData.police_force || 'Unknown',
        planning_authority: geographiesData.planning_authority || 'Unknown'
      } : null,
      schools: schoolsData ? schoolsData.map((school: School) => ({
        name: school.name,
        type: school.type || 'Unknown',
        distance: school.distance || 0,
        rating: school.rating || 'N/A',
        pupils: school.pupils || 0,
        performance: {
          progress_score: school.progress_score,
          attainment_score: school.attainment_score
        }
      })) : [],
      crime: crimeData ? {
        crime_rate: crimeData.crime_rating || 'Unknown',
        total_crimes: crimeData.crimes_last_12m?.total || 0,
        crime_breakdown: crimeData.crimes_last_12m || {},
        trend: 'N/A',
        comparison: {
          above_average: crimeData.above_national_average || [],
          below_average: crimeData.below_national_average || []
        }
      } : null
    };
  } catch (error) {
    console.error('Error fetching property details:', error);
    return null;
  }
};

// Call the function to test the API

// fetchPatmaPropertyData(); 