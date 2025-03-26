import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '', // Make sure this is set in your .env file
  dangerouslyAllowBrowser: true // Note: In production, you should proxy through your backend
});

export async function generatePropertyProposal(property: {
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  rental_estimate: number | null;
  roi_estimate: number | null;
  market_analysis: Record<string, string>;
  bidding_recommendation: number | null;
  property_type?: string;
}) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo" for a more cost-effective option
      messages: [
        {
          role: "system",
          content: "You are an experienced real estate investor who writes professional property purchase proposals. Write in a professional but warm tone. Be concise but comprehensive."
        },
        {
          role: "user",
          content: `Generate a property purchase proposal for the following property:
            Address: ${property.address}
            Price: ${property.price}
            Bedrooms: ${property.bedrooms}
            Bathrooms: ${property.bathrooms}
            Square Feet: ${property.square_feet}
            Property Type: ${property.property_type}
            Estimated Monthly Rental: ${property.rental_estimate}
            Estimated ROI: ${property.roi_estimate}%
            Market Analysis: ${property.market_analysis.trend}
            Recommended Bid: ${property.bidding_recommendation}

            Include: 
            1. Professional greeting
            2. Expression of interest
            3. Property details appreciation
            4. Investment potential analysis
            5. Clear offer amount
            6. Justification for the offer
            7. Next steps
            8. Professional closing`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating proposal with OpenAI:', error);
    throw new Error('Failed to generate proposal');
  }
} 