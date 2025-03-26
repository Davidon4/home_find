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
