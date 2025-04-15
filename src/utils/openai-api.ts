import OpenAI from "openai";
import { MappedProperty } from "./rightmove-api";
import axios from "axios";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true // Allows the SDK to be used in browser environments
});

// Ensure the API key is set
const isConfigured = !!import.meta.env.VITE_OPENAI_API_KEY;

// Define the property analysis result interface
export interface PropertyAnalysisResult {
  summary: string;
  investment_score: number;
  recommendation: string;
  roi_estimate: number;
  rental_estimate: number;
  bidding_recommendation: number;
  market_analysis: {
    trend: string;
    demand: string;
  };
  investment_highlights: {
    location: string;
    type: string;
    features: string;
  };
}

interface MarketData {
  soldData?: {
    median?: number;
    mean?: number;
    data_points?: number;
    recent_sales?: Array<{
      price: number;
      date: string;
      price_per_sqft?: number;
    }>;
  };
  floorAreaData?: {
    median_per_sqft?: number;
  };
  geographyData?: {
    local_authority?: string;
    region?: string;
  };
  crimeData?: {
    crime_rate?: string;
    total_crimes?: number;
    crime_breakdown?: Record<string, number>;
  };
}

interface SoldProperty {
  price: number;
  date: string;
  price_per_sqft?: number;
}

/**
 * Analyze a property using OpenAI to generate insights
 */
export async function analyzeProperty(property: MappedProperty): Promise<PropertyAnalysisResult> {
  if (!isConfigured) {
    throw new Error("OpenAI API key is not configured. Please add your VITE_OPENAI_API_KEY to the .env file.");
  }

  try {
    // Extract postcode from address
    const postcodeMatch = property.address.match(/([A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2})/i);
    if (!postcodeMatch) {
      throw new Error('Could not extract postcode from address');
    }
    const postcode = postcodeMatch[1];
    const apiKey = import.meta.env.VITE_ACCESS_TOKEN;
    const baseUrl = 'https://app.patma.co.uk/api/prospector/v1';

    if (!apiKey) {
      throw new Error('Access token is not configured. Please add your VITE_ACCESS_TOKEN to the .env file.');
    }

    // Normalize property type
    const normalizePropertyType = (type: string): string => {
      const typeMap: { [key: string]: string } = {
        'Semi-Detached': 'semi-detached',
        'Detached': 'detached',
        'Terraced': 'terraced',
        'Flat': 'flat',
        'Bungalow': 'bungalow'
      };
      
      // First try exact match in our map
      const normalized = typeMap[type];
      if (normalized) return normalized;
      
      // If no exact match, try case-insensitive match
      const lowerType = type.toLowerCase();
      for (const [key, value] of Object.entries(typeMap)) {
        if (lowerType.includes(key.toLowerCase())) {
          return value;
        }
      }
      
      return type.toLowerCase();
    };

    const normalizedPropertyType = normalizePropertyType(property.propertyType);
    console.log('Property type normalized:', { original: property.propertyType, normalized: normalizedPropertyType });

    // Configure axios headers
    const config = {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    // Fetch all relevant data
    const [soldPricesResponse, floorAreaResponse, geographiesResponse, crimeResponse] = await Promise.all([
      axios.get(`${baseUrl}/sold-prices-within`, {
        ...config,
        params: {
          postcode,
          radius: 5,
          property_type: normalizedPropertyType,
          apply_indexation: true,
          min_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 12 months
        }
      }).catch(error => {
        console.error('Error fetching sold prices:', error.response?.data || error.message);
        return { data: { data: null } };
      }),
      axios.get(`${baseUrl}/sold-prices-floor-area-within`, {
        ...config,
        params: {
          postcode,
          radius: 5,
          property_type: normalizedPropertyType,
          apply_indexation: true
        }
      }).catch(error => {
        console.error('Error fetching floor area data:', error.response?.data || error.message);
        return { data: { data: null } };
      }),
      axios.get(`${baseUrl}/geographies`, {
        ...config,
        params: { postcode }
      }).catch(error => {
        console.error('Error fetching geography data:', error.response?.data || error.message);
        return { data: { data: null } };
      }),
      axios.get(`${baseUrl}/crime`, {
        ...config,
        params: { postcode }
      }).catch(error => {
        console.error('Error fetching crime data:', error.response?.data || error.message);
        return { data: { data: null } };
      })
    ]);

    // Log raw responses for debugging
    console.log('API Responses:', {
      soldPrices: soldPricesResponse.data,
      floorArea: floorAreaResponse.data,
      geographies: geographiesResponse.data,
      crime: crimeResponse.data
    });

    // Extract and format the data
    const soldData = soldPricesResponse.data.data;
    const floorAreaData = floorAreaResponse.data.data;
    const geographyData = geographiesResponse.data.data;
    const crimeData = crimeResponse.data.data;

    // Format market data with proper error checking
    const marketData: MarketData = {
      soldData: {
        median: soldData?.median || null,
        mean: soldData?.mean || null,
        data_points: soldData?.data_points || 0,
        recent_sales: soldData?.recent_sales?.map(sale => ({
          price: sale.price,
          date: sale.date,
          price_per_sqft: sale.price_per_sqft
        })) || []
      },
      floorAreaData: {
        median_per_sqft: floorAreaData?.median_per_sqft || null
      },
      geographyData: {
        local_authority: geographyData?.local_authority || null,
        region: geographyData?.region || null
      },
      crimeData: {
        crime_rate: crimeData?.crime_rating || null,
        total_crimes: crimeData?.crimes_last_12m?.total || null,
        crime_breakdown: crimeData?.crimes_last_12m || null
      }
    };

    // Log formatted market data
    console.log('Formatted Market Data:', marketData);

    const prompt = generatePropertyAnalysisPrompt(property, marketData);
    console.log('Generated Prompt:', prompt);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a real estate investment analysis expert. Analyze the property details and local market data to provide insights on investment potential. Base your analysis ONLY on the actual market data provided. If data is available, use it - do not say there is insufficient data if values are provided. Calculate ROI using the provided sold prices and rental estimates."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.3
    });
    
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }
    
    const analysis = JSON.parse(responseContent) as PropertyAnalysisResult;
    return analysis;
  } catch (error) {
    console.error("Error analyzing property with OpenAI:", error);
    throw new Error(`Failed to analyze property with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a prompt for property analysis
 */
function generatePropertyAnalysisPrompt(property: MappedProperty, marketData: MarketData): string {
  const formatPrice = (price: number | null | undefined) => 
    price ? `£${price.toLocaleString()}` : 'Not available';
  
  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-GB');
    } catch {
      return date;
    }
  };

  return `Please analyze this property for investment potential:

Property Details:
- Address: ${property.address}
- Price: ${formatPrice(property.price)}
- Type: ${property.propertyType}
- Bedrooms: ${property.bedrooms}
- Square Feet: ${property.square_feet || 'Not specified'}

Local Market Data (Last 12 Months):
${marketData.soldData?.median ? `- Median Sale Price: ${formatPrice(marketData.soldData.median)}` : ''}
${marketData.soldData?.mean ? `- Mean Sale Price: ${formatPrice(marketData.soldData.mean)}` : ''}
${marketData.soldData?.data_points ? `- Number of Comparable Sales: ${marketData.soldData.data_points}` : ''}
${marketData.floorAreaData?.median_per_sqft ? `- Median Price per Square Foot: ${formatPrice(marketData.floorAreaData.median_per_sqft)}` : ''}

Recent Sales:
${marketData.soldData?.recent_sales?.map(sale => 
  `- ${formatPrice(sale.price)} sold on ${formatDate(sale.date)}${sale.price_per_sqft ? ` (£${sale.price_per_sqft}/sqft)` : ''}`
).join('\n') || 'No recent sales data'}

Area Information:
${marketData.geographyData?.local_authority ? `- Local Authority: ${marketData.geographyData.local_authority}` : ''}
${marketData.geographyData?.region ? `- Region: ${marketData.geographyData.region}` : ''}

Crime Statistics:
${marketData.crimeData?.crime_rate ? `- Crime Rating: ${marketData.crimeData.crime_rate}` : ''}
${marketData.crimeData?.total_crimes ? `- Total Crimes (Last 12 Months): ${marketData.crimeData.total_crimes}` : ''}
${marketData.crimeData?.crime_breakdown ? `\nCrime Breakdown:\n${Object.entries(marketData.crimeData.crime_breakdown)
  .filter(([key]) => key !== 'total')
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}` : ''}

Based on this real market data, please provide:
1. A summary of the property's investment potential
2. An investment score (0-100)
3. A clear recommendation (Buy/Hold/Avoid)
4. Estimated ROI based on local market data
5. Estimated monthly rental value based on local market conditions
6. A recommended bidding strategy with specific price points
7. Current market analysis including trends and demand
8. Key investment highlights focusing on location, property type, and unique features

Please ensure all analysis is based on the actual market data provided above. If data is available, use it for your analysis. Format the response as a JSON object with the following structure:
{
  "summary": "...",
  "investment_score": number,
  "recommendation": "...",
  "roi_estimate": number,
  "rental_estimate": number,
  "bidding_recommendation": number,
  "market_analysis": {
    "trend": "...",
    "demand": "..."
  },
  "investment_highlights": {
    "location": "...",
    "type": "...",
    "features": "..."
  }
}`;
} 