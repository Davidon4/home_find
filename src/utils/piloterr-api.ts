import { MappedProperty, ZooplaProperty } from "@/types/property-types";

// API token should be stored in environment variables in a real application
const PILOTERR_API_KEY = import.meta.env.VITE_PILOTERR_API_KEY || "";
const API_BASE_URL = "https://piloterr.com/api/v2/zoopla/property";

// Cache to store API responses and prevent duplicate calls
const searchCache: Record<string, ZooplaProperty[]> = {};

// Track remaining API credits
let remainingCredits = 50;

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
      throw new Error("API credit limit reached and no cached results available");
    }

    // Check if we already have cached results for this query
    if (searchCache[query]) {
      console.log(`Using cached results for query: "${query}"`);
      return mapZooplaProperties(searchCache[query]);
    }
    
    // Make API request
    console.log(`Searching Zoopla properties via Piloterr API for: "${query}"`);
    const response = await fetch(`${API_BASE_URL}?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PILOTERR_API_KEY
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
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