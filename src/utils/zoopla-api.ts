import { UKProperty, PropertySearchResponse } from "./propertyApi";

/**
 * Zoopla API integration
 * Base URL: https://zoopla-data.onrender.com
 */

// Define Zoopla property interface to match the API response
export interface ZooplaProperty {
  _id?: string;
  url: string;
  property_type: string;
  property_title: string;
  address: string;
  google_map_location: string;
  virtual_tour: string;
  street_view: string;
  url_property: string;
  currency: string;
  deposit: string;
  letting_arrangements: string;
  breadcrumbs: string;
  availability: string;
  commonhold_details: string;
  service_charge: string;
  ground_rent: string;
  time_remaining_on_lease: string;
  ecp_rating: string;
  council_tax_band: string;
  price_per_size: string;
  tenure: string;
  tags: string;
  features: string;
  property_images: string;
  additional_links: string;
  listing_history: string;
  agent_details: string;
  points_ofInterest: string;
  bedrooms: number;
  price: number;
  bathrooms: number;
  receptions: string;
  country_code: string;
  energy_performance_certificate: string;
  floor_plans: string;
  description: string;
  price_per_time: string;
  property_size: string;
  market_stats_last_12_months: string;
  market_stats_renta_opportunities: string;
  market_stats_recent_sales_nearby: string;
  market_stats_rental_activity: string;
  uprn: string;
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

// API base URL
const ZOOPLA_API_BASE_URL = 'https://zoopla-data.onrender.com';

/**
 * Fetch all properties from the Zoopla API
 */
export async function fetchAllProperties(): Promise<MappedProperty[]> {
  try {
    console.log('Fetching properties from:', `${ZOOPLA_API_BASE_URL}/api/properties`);
    
    const response = await fetch(`${ZOOPLA_API_BASE_URL}/api/properties`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Raw API response:', data);
    
    // Check if data has pagination structure with results array
    if (!Array.isArray(data) && data && typeof data === 'object') {
      console.log('API response has pagination structure:', data);
      
      // If data has a results array, use that
      if (Array.isArray(data.results)) {
        console.log(`Found ${data.results.length} properties in results array`);
        return mapZooplaProperties(data.results);
      }
    }
    
    // If data is an array, use it directly
    if (Array.isArray(data)) {
      console.log(`Found ${data.length} properties in array`);
      return mapZooplaProperties(data);
    }
    
    console.error('Unexpected API response format:', data);
    return [];
  } catch (error) {
    console.error('Error fetching Zoopla properties:', error);
    // Return empty array instead of throwing to prevent breaking the UI
    return [];
  }
}

/**
 * Search properties by search term
 */
export async function searchZooplaProperties(searchTerm: string): Promise<MappedProperty[]> {
  try {
    if (!searchTerm.trim()) {
      // If search term is empty, return all properties
      return await fetchAllProperties();
    }
    
    console.log(`Searching for properties with term: "${searchTerm}"`);
    
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      mode: 'cors' as RequestMode,
      credentials: 'omit' as RequestCredentials
    };

    // Try the search endpoint first
    try {
      const searchUrl = `${ZOOPLA_API_BASE_URL}/api/properties/search?q=${encodeURIComponent(searchTerm)}`;
      console.log(`Trying search endpoint: ${searchUrl}`);
    
      const response = await fetch(searchUrl, fetchOptions);
    
      if (response.ok) {
        const data = await response.json();
        console.log(`Search endpoint returned data:`, data);
    
        if (Array.isArray(data)) {
          console.log(`Found ${data.length} properties in array`);
          return mapZooplaProperties(data);
        } else if (data && typeof data === 'object' && Array.isArray(data.results)) {
          console.log(`Found ${data.results.length} properties in results array`);
          return mapZooplaProperties(data.results);
        }
      } else {
        console.log(`Search endpoint failed with status: ${response.status}`);
      }
    } catch (searchError) {
      console.error('Error with search endpoint:', searchError);
    }
    
    // If we get here, the search endpoint didn't work, so fall back to client-side filtering
    console.log('Falling back to client-side filtering...');
    
    // Get all properties
    const response = await fetch(`${ZOOPLA_API_BASE_URL}/api/properties`, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fetched all properties for client-side filtering');
    
    // Get the properties array from the response
    let properties: ZooplaProperty[] = [];
    
    if (Array.isArray(data)) {
      properties = data;
    } else if (data && typeof data === 'object' && Array.isArray(data.results)) {
      properties = data.results;
    } else {
      console.error('Unexpected data format from properties endpoint:', data);
      return [];
    }
    
    // Filter properties client-side
    const searchTermLower = searchTerm.toLowerCase();
    const filteredProperties = properties.filter(prop => {
      return (
        (prop.address && prop.address.toLowerCase().includes(searchTermLower)) ||
        (prop.property_title && prop.property_title.toLowerCase().includes(searchTermLower)) ||
        (prop.description && prop.description.toLowerCase().includes(searchTermLower)) ||
        (prop.property_type && prop.property_type.toLowerCase().includes(searchTermLower))
      );
    });
    
    console.log(`Client-side filtering found ${filteredProperties.length} matching properties`);
    return mapZooplaProperties(filteredProperties);
  } catch (error) {
    console.error('Error searching Zoopla properties:', error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get a single property by ID
 */
export async function getPropertyById(id: string): Promise<MappedProperty | null> {
  try {
    const response = await fetch(`${ZOOPLA_API_BASE_URL}/api/properties/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch property: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform API response to match our interface
    return mapZooplaProperty(data);
  } catch (error) {
    console.error('Error fetching Zoopla property:', error);
    throw error;
  }
}

/**
 * Map an array of API properties to our format
 */
function mapZooplaProperties(apiProperties: ZooplaProperty[]): MappedProperty[] {
  if (!Array.isArray(apiProperties)) {
    console.error('Expected array of properties but got:', apiProperties);
    return [];
  }
  
  return apiProperties.map(property => mapZooplaProperty(property)).filter(Boolean) as MappedProperty[];
}

/**
 * Map a single API property to our format
 */
function mapZooplaProperty(property: ZooplaProperty): MappedProperty | null {
  if (!property) {
    console.warn('Received empty or undefined property');
    return null;
  }
  
  try {
    // Parse features
    let features: string[] = [];
    try {
      features = typeof property.features === 'string' 
        ? JSON.parse(property.features || '[]') 
        : (property.features ? [property.features] : []);
    } catch (error) {
      console.warn('Error parsing features, using empty array');
    }

    // Parse property images
    let images: string[] = [];
    try {
      if (property.property_images) {
        if (typeof property.property_images === 'string') {
          if (property.property_images.startsWith('[') && property.property_images.endsWith(']')) {
            images = JSON.parse(property.property_images);
          } else if (property.property_images.startsWith('http')) {
            images = [property.property_images];
          }
        } else if (Array.isArray(property.property_images)) {
          images = property.property_images;
        }
      }
    } catch (error) {
      console.warn('Error parsing property images:', error);
    }

    // Parse agent details
    let agent = {
      name: 'Unknown Agent',
      phone: 'N/A'
    };
    
    try {
      if (property.agent_details) {
        if (typeof property.agent_details === 'string') {
          const parsedAgentDetails = JSON.parse(property.agent_details);
          agent = {
            name: parsedAgentDetails.name || 'Unknown Agent',
            phone: parsedAgentDetails.phone || 'N/A'
          };
        } else if (typeof property.agent_details === 'object') {
          const agentObj = property.agent_details as Record<string, string>;
          agent = {
            name: agentObj.name || 'Unknown Agent',
            phone: agentObj.phone || 'N/A'
          };
        }
      }
    } catch (error) {
      console.warn('Error parsing agent details:', error);
    }

    // Parse location
    let location = {
      latitude: 0,
      longitude: 0
    };
    
    try {
      if (property.google_map_location) {
        if (typeof property.google_map_location === 'string') {
          if (property.google_map_location.includes('lat') && property.google_map_location.includes('lng')) {
            const parsedLocation = JSON.parse(property.google_map_location) as Record<string, number>;
            location = {
              latitude: parsedLocation.lat || 0,
              longitude: parsedLocation.lng || 0
            };
          }
        } else if (typeof property.google_map_location === 'object') {
          const locationObj = property.google_map_location as Record<string, number>;
          location = {
            latitude: locationObj.lat || 0,
            longitude: locationObj.lng || 0
          };
        }
      }
    } catch (error) {
      console.warn('Error parsing location:', error);
    }

    // Parse square feet
    let squareFeet = null;
    try {
      if (property.property_size) {
        const sizeStr = property.property_size.toString();
        const numericSize = parseFloat(sizeStr.replace(/[^\d.]/g, ''));
        if (!isNaN(numericSize)) {
          squareFeet = numericSize;
        }
      }
    } catch (error) {
      console.warn('Error parsing square feet:', error);
    }

    return {
      id: property._id || String(Math.random()),
      address: property.address || 'Unknown Address',
      price: typeof property.price === 'number' ? property.price : 
             parseInt(String(property.price).replace(/[^\d]/g, '')) || 0,
      bedrooms: typeof property.bedrooms === 'number' ? property.bedrooms : 
                parseInt(String(property.bedrooms)) || null,
      bathrooms: typeof property.bathrooms === 'number' ? property.bathrooms : 
                 parseInt(String(property.bathrooms)) || null,
      square_feet: squareFeet,
      image_url: images.length > 0 ? images[0] : null,
      propertyType: property.property_type || 'Unknown',
      description: property.description || '',
      features: features,
      agent: agent,
      location: location,
      dateAdded: property.listing_history || new Date().toISOString(),
      listedSince: property.listing_history || new Date().toISOString(),
      url: property.url,
      propertyDetails: {
        market_demand: "Medium",
        area_growth: "3.5%",
        crime_rate: "Average",
        nearby_schools: 3,
        energy_rating: "C",
        council_tax_band: "D",
        property_features: features.slice(0, 3)
      },
      marketTrends: {
        appreciation_rate: 3.2
      }
    };
  } catch (error) {
    console.error('Error mapping property:', error);
    return null;
  }
}

/**
 * Map Zoopla API property format to UKProperty format
 */
const mapZooplaToUKProperties = (zooplaProperties: ZooplaProperty[]): UKProperty[] => {
  return zooplaProperties.map(prop => {
    // Parse images
    let imageUrl = null;
    try {
      if (prop.property_images) {
        if (typeof prop.property_images === 'string') {
          if (prop.property_images.startsWith('[')) {
            const images = JSON.parse(prop.property_images);
            imageUrl = images.length > 0 ? images[0] : null;
          } else if (prop.property_images.startsWith('http')) {
            imageUrl = prop.property_images;
          }
        }
      }
    } catch (error) {
      console.warn('Error parsing images:', error);
    }
    
    // Parse agent details
    let agent = {
      name: 'Unknown Agent',
      phone: 'N/A'
    };
    
    try {
      if (prop.agent_details) {
        if (typeof prop.agent_details === 'string') {
          const parsedAgent = JSON.parse(prop.agent_details);
          agent = {
            name: parsedAgent.name || 'Unknown Agent',
            phone: parsedAgent.phone || 'N/A'
          };
        }
      }
    } catch (error) {
      console.warn('Error parsing agent details:', error);
    }
    
    // Parse location
    let latitude = undefined;
    let longitude = undefined;
    
    try {
      if (prop.google_map_location) {
        if (typeof prop.google_map_location === 'string') {
          const parsedLocation = JSON.parse(prop.google_map_location);
          latitude = parsedLocation.lat || parsedLocation.latitude;
          longitude = parsedLocation.lng || parsedLocation.longitude;
        }
      }
    } catch (error) {
      console.warn('Error parsing location:', error);
    }
    
    // Parse square feet
    let squareFeet = null;
    try {
      if (prop.property_size) {
        const sizeStr = prop.property_size.toString();
        const numericSize = parseFloat(sizeStr.replace(/[^\d.]/g, ''));
        if (!isNaN(numericSize)) {
          squareFeet = numericSize;
        }
      }
    } catch (error) {
      console.warn('Error parsing square feet:', error);
    }
    
    return {
      id: prop._id || String(Math.random()),
      address: prop.address || '',
      price: typeof prop.price === 'number' ? prop.price : 
             parseInt(String(prop.price).replace(/[^\d]/g, '')) || 0,
      bedrooms: typeof prop.bedrooms === 'number' ? prop.bedrooms : null,
      bathrooms: typeof prop.bathrooms === 'number' ? prop.bathrooms : null,
      square_feet: squareFeet,
      image_url: imageUrl,
      property_type: prop.property_type || '',
      description: prop.description || '',
      latitude,
      longitude,
      agent,
      created_at: prop.listing_history || new Date().toISOString(),
      updated_at: prop.listing_history || new Date().toISOString()
    };
  });
};

export const searchDatabaseProperties = async (searchTerm: string): Promise<UKProperty[]> => {
  console.log("Searching database properties with term:", searchTerm);
  
  try {
    // ... rest of the function ...
  } catch (error) {
    console.error("Error searching database properties:", error);
    return [];
  }
}; 