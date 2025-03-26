
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
  investment_highlights: any;
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
  ai_analysis: any;
  market_analysis: any;
  bidding_recommendation: number | null;
  last_sold_price: number | null;
  price_history: any;
  market_trends: any;
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
