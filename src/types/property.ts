interface InvestmentHighlights {
  location: string;
  type: string;
  features: string;
}

interface AIAnalysis {
  summary: string;
  recommendation: string;
}

interface MarketAnalysis {
  trend: string;
  demand: string;
}

interface PriceHistory {
  dates: string[];
  prices: number[];
}

interface MarketTrends {
  appreciation_rate: number;
  market_activity: string;
}

export interface PropertyListing {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  image_url: string | null;
  roi_estimate: number | null;
  rental_estimate: number | null;
  investment_highlights: InvestmentHighlights;
  investment_score: number | null;
  created_at: string;
  updated_at: string;
  source: string;
  listing_url: string;
  description?: string;
  property_type?: string;
  agent?: {
    name: string;
    phone: string;
  };
  ai_analysis: AIAnalysis;
  market_analysis: MarketAnalysis;
  bidding_recommendation: number | null;
  last_sold_price: number | null;
  price_history: PriceHistory;
  market_trends: MarketTrends;
  property_details?: {
    market_demand: string;
    area_growth: string;
    crime_rate: string;
    nearby_schools: number;
    property_features: string[];
    energy_rating: string;
    council_tax_band: string;
  }
}

export interface ScrapedProperty {
  title: string;
  price: string | null;
  priceValue: number | null;
  address: string;
  description: string;
  bedrooms: number | null;
  bathrooms: number | null;
  livingRooms: number | null;
  features: string[];
  imageUrls: string[];
  agentName: string | null;
  agentPhone: string | null;
  propertyType: string | null;
}

export interface PatmaProperty {
  id?: string;
  address?: string;
  location?: string;
  price?: number;
  asking_price?: number;
  bedrooms?: number;
  bedrooms_estimated?: boolean;
  bathrooms?: number;
  square_feet?: number;
  area?: number;
  floor_area_sqft?: number;
  floor_area_sqm?: number;
  image_url?: string;
  main_image?: string;
  roi?: number;
  rental_value?: number;
  property_type?: string;
  features?: string[];
  investment_score?: number;
  created_at?: string;
  updated_at?: string;
  url?: string;
  listing_type?: string;
  description?: string;
  agent?: {
    name: string;
    phone: string;
  };
  ai_analysis?: string;
  recommendation?: string;
  market_trend?: string;
  demand?: string;
  bidding_recommendation?: number;
  last_sold_price?: number;
  last_sold_date?: string;
  last_sold_as_new?: boolean;
  current_indexation_value?: number;
  price_history?: Record<string, unknown>;
  sold_history?: Array<{
    amount: number;
    date: string;
    new: boolean;
  }>;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  market_demand?: string;
  area_growth?: string;
  crime_rate?: string;
  nearby_schools?: number;
  energy_rating?: string;
  council_tax_band?: string;
  appreciation_rate?: number;
  market_activity?: string;
  tenure?: string;
  uprn?: string;
  built_form?: string;
  habitable_rooms?: number;
}
