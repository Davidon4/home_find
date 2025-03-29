// Common property-related types

export interface PropertyLocation {
  latitude: number;
  longitude: number;
}

export interface PropertyAgent {
  name: string;
  phone: string;
  email?: string;
  logo?: string;
}

export interface PropertyDetails {
  market_demand: string;
  area_growth: string;
  crime_rate: string;
  nearby_schools: number;
  energy_rating: string;
  council_tax_band: string;
  property_features: string[];
}

export interface MarketTrends {
  appreciation_rate: number;
  market_activity: string;
}

export interface MappedProperty {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  description: string | null;
  propertyType: string | null;
  image_url: string | null;
  url: string | null;
  features: string[];
  dateAdded: string;
  listedSince: string;
  agent: PropertyAgent;
  rental_estimate?: number;
  roi_estimate?: number;
  location?: PropertyLocation;
  propertyDetails?: PropertyDetails;
  marketTrends?: MarketTrends;
}

// Export types from Piloterr API (Zoopla)
export interface ZooplaProperty {
  propertyId: string;
  title: string;
  price: string;
  address: string;
  description: string;
  agent: {
    name: string;
    phone: string;
    email: string;
  };
  images: string[];
  details: {
    bedrooms: number;
    bathrooms: number;
    receptions: number;
    squareFeet: number;
    type: string;
    tenure: string;
    garden: string;
    parking: string;
  };
  nearbySchools: string[];
  additionalInfo: {
    built: string;
    energyRating: string;
    councilTaxBand: string;
  };
  mapCoordinates: {
    latitude: number;
    longitude: number;
  };
} 