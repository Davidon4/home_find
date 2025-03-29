import { MappedProperty, ZooplaProperty } from "@/types/property-types";

// API token should be stored in environment variables in a real application
const PILOTERR_API_KEY = import.meta.env.VITE_PILOTERR_API_KEY || "";
const API_BASE_URL = "https://piloterr.com/api/v2/zoopla/property";

// CORS proxy options (choose one):
// 1. Use a public CORS proxy (for development only)
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/"; // Request access at: https://cors-anywhere.herokuapp.com/corsdemo
// 2. Or use your own deployed proxy if available
// const CORS_PROXY = "https://your-cors-proxy.com/";

// Use the proxy for development or testing, not for production
const shouldUseProxy = import.meta.env.DEV && import.meta.env.VITE_USE_CORS_PROXY === "true";
const getApiUrl = (endpoint: string) => shouldUseProxy ? `${CORS_PROXY}${endpoint}` : endpoint;

// Cache to store API responses and prevent duplicate calls
const searchCache: Record<string, ZooplaProperty[]> = {};

// Track remaining API credits
let remainingCredits = 50;

// Use mock data for development and testing
const USE_MOCK_DATA = import.meta.env.DEV && (import.meta.env.VITE_USE_MOCK_DATA === "true" || !PILOTERR_API_KEY);

// Sample mock data for development/testing
const MOCK_PROPERTIES: ZooplaProperty[] = [
  {
    propertyId: "12345678",
    title: "2 bed flat for sale",
    price: "£175,000",
    address: "123 Sample Street, London, SW1 1AA",
    description: "A beautiful 2 bedroom flat in central London with modern amenities and close to transport links.",
    agent: {
      name: "Sample Estate Agents",
      phone: "020 1234 5678",
      email: "info@sampleagents.com"
    },
    images: ["https://placehold.co/600x400?text=Property+Image"],
    details: {
      bedrooms: 2,
      bathrooms: 1,
      receptions: 1,
      squareFeet: 750,
      type: "Flat",
      tenure: "Leasehold",
      garden: "None",
      parking: "On-street"
    },
    nearbySchools: ["Sample Primary School", "Sample Secondary School"],
    additionalInfo: {
      built: "2000",
      energyRating: "C",
      councilTaxBand: "C"
    },
    mapCoordinates: {
      latitude: 51.5074,
      longitude: -0.1278
    }
  },
  {
    propertyId: "87654321",
    title: "3 bed semi-detached for sale",
    price: "£250,000",
    address: "456 Example Road, Manchester, M1 1BB",
    description: "Spacious 3 bedroom semi-detached house with garden and driveway parking.",
    agent: {
      name: "Example Property Services",
      phone: "0161 876 5432",
      email: "info@exampleproperties.com"
    },
    images: ["https://placehold.co/600x400?text=House+Image"],
    details: {
      bedrooms: 3,
      bathrooms: 2,
      receptions: 2,
      squareFeet: 1100,
      type: "Semi-detached",
      tenure: "Freehold",
      garden: "Rear garden",
      parking: "Driveway"
    },
    nearbySchools: ["Example Primary School", "Example High School"],
    additionalInfo: {
      built: "1970",
      energyRating: "D",
      councilTaxBand: "D"
    },
    mapCoordinates: {
      latitude: 53.4808,
      longitude: -2.2426
    }
  }
];

/**
 * Search for properties using the Piloterr Zoopla API
 * Includes caching to prevent duplicate API calls and respect rate limits
 */
export async function searchZooplaProperties(query: string): Promise<MappedProperty[]> {
  try {
    // Check if we have any credits left
    if (remainingCredits <= 0) {
      console.warn("Piloterr API credit limit reached. Using cached results if available.");
      const cachedResults = Object.values(searchCache).flat();
      if (cachedResults.length > 0) {
        return mapZooplaProperties(cachedResults);
      }
      if (USE_MOCK_DATA) {
        console.warn("Using mock data because API credits are exhausted");
        return mapZooplaProperties(MOCK_PROPERTIES);
      }
      throw new Error("API credit limit reached and no cached results available");
    }

    // Check for API key and use mock data if needed
    if (!PILOTERR_API_KEY) {
      console.warn("PILOTERR_API_KEY is missing. Using mock data instead.");
      if (USE_MOCK_DATA) {
        return mapZooplaProperties(MOCK_PROPERTIES);
      }
      throw new Error("API key is missing. Please configure your API key in the .env file.");
    }

    // Check if we already have cached results for this query
    if (searchCache[query]) {
      console.log(`Using cached results for query: "${query}"`);
      return mapZooplaProperties(searchCache[query]);
    }
    
    // If we're explicitly using mock data, return it
    if (USE_MOCK_DATA) {
      console.log("Using mock data instead of API call");
      const mockResults = [...MOCK_PROPERTIES];
      
      // Add the location to the mock properties to simulate a real search
      mockResults.forEach(prop => {
        prop.address = prop.address.replace(/London|Manchester/, query.charAt(0).toUpperCase() + query.slice(1));
      });
      
      // Cache the results
      searchCache[query] = mockResults;
      return mapZooplaProperties(mockResults);
    }
    
    // Make API request
    console.log(`Searching Zoopla properties via Piloterr API for: "${query}"`);
    console.log(`Using ${shouldUseProxy ? 'proxy' : 'direct'} API call`);
    
    const apiUrl = getApiUrl(`${API_BASE_URL}?query=${encodeURIComponent(query)}`);
    console.log(`API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PILOTERR_API_KEY
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 401) {
        throw new Error("API authentication failed. Please check your API key.");
      } else if (response.status === 403) {
        throw new Error("API access forbidden. Your API key may have insufficient permissions.");
      } else if (response.status === 429) {
        throw new Error("API rate limit exceeded. Please try again later.");
      }
      
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }
    
    // Decrease remaining credits
    remainingCredits--;
    console.log(`Remaining Piloterr API credits: ${remainingCredits}`);
    
    const data = await response.json();
    
    // Normalize the response - handle both array and single property responses
    const properties = Array.isArray(data) ? data : [data];
    
    // Cache the results
    searchCache[query] = properties;
    
    // Map the properties to our application format
    return mapZooplaProperties(properties);
  } catch (error) {
    console.error('Error searching Zoopla properties:', error);
    
    // Fall back to mock data in development
    if (USE_MOCK_DATA) {
      console.warn("API call failed, using mock data as fallback");
      return mapZooplaProperties(MOCK_PROPERTIES);
    }
    
    // If we have cached results for any query, return those
    const cachedResults = Object.values(searchCache).flat();
    if (cachedResults.length > 0) {
      console.warn("API call failed, using cached results as fallback");
      return mapZooplaProperties(cachedResults);
    }
    
    return [];
  }
}

/**
 * Map Zoopla properties to the application's MappedProperty format
 */
function mapZooplaProperties(properties: ZooplaProperty[]): MappedProperty[] {
  return properties.map(property => {
    // Extract numeric price from string (e.g., "£300,000" -> 300000)
    const priceValue = extractNumericPrice(property.price);
    
    // Calculate rental estimate and ROI
    const rentalEstimate = calculateRentalEstimate(
      priceValue, 
      property.details.bedrooms, 
      property.details.type
    );
    
    const roiEstimate = calculateROI(priceValue, rentalEstimate);
    
    return {
      id: property.propertyId,
      address: property.address,
      price: priceValue,
      bedrooms: property.details.bedrooms,
      bathrooms: property.details.bathrooms,
      square_feet: property.details.squareFeet,
      description: property.description,
      propertyType: property.details.type,
      image_url: property.images && property.images.length > 0 ? property.images[0] : null,
      url: `https://www.zoopla.co.uk/for-sale/details/${property.propertyId}`,
      features: extractFeatures(property),
      dateAdded: new Date().toISOString(),
      listedSince: new Date().toISOString(),
      agent: {
        name: property.agent?.name || 'Zoopla Agent',
        phone: property.agent?.phone || ''
      },
      rental_estimate: rentalEstimate,
      roi_estimate: roiEstimate,
      location: {
        latitude: property.mapCoordinates?.latitude || 0,
        longitude: property.mapCoordinates?.longitude || 0
      },
      propertyDetails: {
        market_demand: "Medium",
        area_growth: "3.5%",
        crime_rate: "Average",
        nearby_schools: property.nearbySchools?.length || 0,
        energy_rating: property.additionalInfo?.energyRating || "Unknown",
        council_tax_band: property.additionalInfo?.councilTaxBand || "Unknown",
        property_features: extractFeatures(property)
      },
      marketTrends: {
        appreciation_rate: 3.2,
        market_activity: 'Moderate'
      }
    };
  });
}

/**
 * Extract numeric price from string (e.g., "£300,000" -> 300000)
 */
function extractNumericPrice(priceString: string): number {
  if (!priceString) return 0;
  
  // Extract digits and decimal points
  const numericString = priceString.replace(/[^0-9.]/g, '');
  return parseFloat(numericString) || 0;
}

/**
 * Extract features from property data
 */
function extractFeatures(property: ZooplaProperty): string[] {
  const features = [];
  
  // Add property type
  if (property.details.type) {
    features.push(property.details.type);
  }
  
  // Add tenure
  if (property.details.tenure) {
    features.push(property.details.tenure);
  }
  
  // Add garden info if available
  if (property.details.garden && property.details.garden !== "None") {
    features.push(`Has ${property.details.garden}`);
  }
  
  // Add parking info if available
  if (property.details.parking && property.details.parking !== "None") {
    features.push(`${property.details.parking} parking`);
  }
  
  // Add energy rating if available
  if (property.additionalInfo?.energyRating) {
    features.push(`Energy rating: ${property.additionalInfo.energyRating}`);
  }
  
  return features;
}

/**
 * Calculate rental estimate based on property details
 */
function calculateRentalEstimate(price: number, bedrooms: number, propertyType: string): number {
  if (!price) return 0;
  if (!bedrooms) bedrooms = 2; // Default to 2 bedrooms if not specified
  
  // Base rental is roughly 0.8% of property value annually, divided by 12 for monthly
  let baseRental = (price * 0.008) / 12;
  
  // Adjust for bedrooms
  baseRental *= (1 + (bedrooms - 2) * 0.1); // +/- 10% per bedroom difference from 2
  
  // Adjust for property type
  const propertyTypeLower = propertyType?.toLowerCase() || '';
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