import OpenAI from "openai";
import { MappedProperty } from "./rightmove-api";

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

/**
 * Analyze a property using OpenAI to generate insights
 */
export async function analyzeProperty(property: MappedProperty): Promise<PropertyAnalysisResult> {
  if (!isConfigured) {
    // Instead of using mock data, throw an error
    throw new Error("OpenAI API key is not configured. Please add your VITE_OPENAI_API_KEY to the .env file.");
  }

  try {
    const prompt = generatePropertyAnalysisPrompt(property);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a real estate investment analysis expert. Analyze the property details and provide insights on investment potential."
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
    
    // Parse the JSON response
    const analysis = JSON.parse(responseContent) as PropertyAnalysisResult;
    return analysis;
  } catch (error) {
    // Instead of falling back to mock data, propagate the error
    console.error("Error analyzing property with OpenAI:", error);
    throw new Error(`Failed to analyze property with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a prompt for property analysis
 */
function generatePropertyAnalysisPrompt(property: MappedProperty): string {
  return `
Analyze this property as a potential investment:

Address: ${property.address}
Price: £${property.price}
Type: ${property.propertyType}
Bedrooms: ${property.bedrooms || 'Unknown'}
Bathrooms: ${property.bathrooms || 'Unknown'}
Square Feet: ${property.square_feet || 'Unknown'}
Features: ${Array.isArray(property.features) ? property.features.join(", ") : 'None listed'}
Description: ${property.description || 'No description available'}

Provide a detailed investment analysis in JSON format with the following structure:
{
  "summary": "Brief summary of the property and its investment potential",
  "investment_score": "A number from 0-100 indicating the overall investment quality",
  "recommendation": "Short, actionable recommendation for potential investors",
  "roi_estimate": "Estimated ROI percentage as a number",
  "rental_estimate": "Estimated monthly rental income in GBP as a number",
  "bidding_recommendation": "Recommended bidding price as a number",
  "market_analysis": {
    "trend": "Brief description of market trends in this area",
    "demand": "Brief assessment of rental demand"
  },
  "investment_highlights": {
    "location": "Brief assessment of the location",
    "type": "Comment on the property type and its market appeal",
    "features": "Highlight of key features that add value"
  }
}
`;
} 