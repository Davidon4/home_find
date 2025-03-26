/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Main function handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    const property = requestData.property;
    
    console.log('Received property data:', property);

    // Generate mock data
    const analysis = generateAnalysis(property);
    const areaData = generateAreaData(property);
    const similarProperties = generateSimilarProperties(property);

    // Prepare response
    const responseData = { 
      success: true, 
      analysis,
      area_data: areaData,
      similar_properties: similarProperties
    };
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-property function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
        error_details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})

function generateAnalysis(property: any) {
  const { price, bedrooms, bathrooms, square_feet, address } = property;
  
  return `
1. Automated Valuation:
   Based on comparable properties in the area, the estimated fair market value for this property is $${Math.round(price * (1 + (Math.random() * 0.2 - 0.1))).toLocaleString()}. 
   
   The price per square foot is $${Math.round(price / (square_feet || 1000))} which is ${price / (square_feet || 1000) > 200 ? 'above' : 'below'} the area average of $200 per square foot.
   
   Recent market trends show a ${Math.random() > 0.5 ? 'positive' : 'negative'} growth rate of ${(Math.random() * 5 + 2).toFixed(1)}% annually in this area.

2. Area Analysis:
   The property is located in ${address.split(',')[0]}, which is a ${['highly desirable', 'moderately desirable', 'up-and-coming'][Math.floor(Math.random() * 3)]} neighborhood.
   
   Crime rates in this area are ${['low', 'moderate', 'variable depending on the specific location'][Math.floor(Math.random() * 3)]}.
   
   The area has ${['excellent', 'good', 'average'][Math.floor(Math.random() * 3)]} schools with ratings averaging ${Math.floor(Math.random() * 3) + 7}/10.
   
   Public transportation is ${['readily available', 'limited', 'accessible with some walking'][Math.floor(Math.random() * 3)]}.
   
   Local amenities include shopping centers, restaurants, parks, and healthcare facilities within a ${Math.floor(Math.random() * 2) + 1}-mile radius.

3. Investment Potential:
   The projected value appreciation over the next 5 years is estimated at ${(Math.random() * 15 + 5).toFixed(1)}%.
   
   Rental demand in this area is ${['high', 'moderate', 'growing'][Math.floor(Math.random() * 3)]}, with an estimated monthly rental income of $${Math.round(price * 0.005 + (bedrooms ? (bedrooms - 2) * 100 : 0)).toLocaleString()}.
   
   The gross rental yield is approximately ${((price * 0.005 + (bedrooms ? (bedrooms - 2) * 100 : 0)) * 12 / price * 100).toFixed(1)}%.
   
   Risk assessment: ${['Low', 'Moderate', 'Moderate-to-Low'][Math.floor(Math.random() * 3)]} risk investment.
   
   Suggested improvements to increase value: ${['Kitchen renovation', 'Bathroom updates', 'Landscaping improvements', 'Energy efficiency upgrades'][Math.floor(Math.random() * 4)]}.

4. Deal Score:
   Based on our comprehensive analysis, this property scores ${Math.floor(Math.random() * 30) + 60}/100.
   
   Price vs. market value: ${Math.random() > 0.5 ? 'Above market value' : 'Below market value'}
   Location quality: ${['Excellent', 'Good', 'Average'][Math.floor(Math.random() * 3)]}
   Property condition: ${['Excellent', 'Good', 'Average', 'Needs work'][Math.floor(Math.random() * 4)]} (based on listing details)
   Investment potential: ${['High', 'Moderate', 'Average'][Math.floor(Math.random() * 3)]}
   Risk factors: ${['Low vacancy risk', 'Moderate maintenance costs', 'Potential for increased property taxes'][Math.floor(Math.random() * 3)]}
  `;
}

function generateAreaData(property: any) {
  const { address } = property;
  
  return {
    crime_stats: {
      recent_incidents: Math.floor(Math.random() * 50) + 10,
      categories: {
        'anti-social-behavior': Math.floor(Math.random() * 10) + 1,
        'burglary': Math.floor(Math.random() * 5) + 1,
        'robbery': Math.floor(Math.random() * 3),
        'vehicle-crime': Math.floor(Math.random() * 7) + 1,
        'violent-crime': Math.floor(Math.random() * 6) + 1,
        'other-crime': Math.floor(Math.random() * 8) + 1
      }
    },
    amenities: {
      'road': address.split(',')[0],
      'city': address.split(',')[1]?.trim() || 'Unknown City',
      'county': 'Sample County',
      'postcode': 'AB12 3CD'
    },
    infrastructure: {
      transport_links: [
        'Bus stop (0.2 miles)',
        'Train station (1.5 miles)',
        'Highway access (2.3 miles)'
      ],
      schools: [
        'Primary School (0.5 miles)',
        'Secondary School (1.2 miles)',
        'College (3.5 miles)'
      ],
      healthcare: [
        'General Practice (0.8 miles)',
        'Hospital (4.2 miles)',
        'Pharmacy (0.3 miles)'
      ]
    }
  };
}

function generateSimilarProperties(property: any) {
  const { price, bedrooms, bathrooms, square_feet, property_type, address } = property;
  
  // Generate 2-4 mock similar properties
  const count = Math.floor(Math.random() * 3) + 2;
  const mockProperties = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a price 5-25% higher
    const priceDifference = Math.floor(Math.random() * 20) + 5;
    const higherPrice = price * (1 + priceDifference / 100);
    
    // Generate a distance between 100-900 meters
    const distance = Math.floor(Math.random() * 800) + 100;
    
    // Slightly vary the bedrooms/bathrooms
    const bedroomVariation = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
    const bathroomVariation = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
    
    // Generate a mock address nearby
    const addressParts = address.split(',');
    const streetName = addressParts[0].trim();
    const streetNumber = parseInt(streetName.match(/\d+/)?.[0] || '100');
    const newStreetNumber = streetNumber + (Math.floor(Math.random() * 20) - 10);
    const newStreetName = streetName.replace(/\d+/, newStreetNumber.toString());
    const newAddress = [newStreetName, ...addressParts.slice(1)].join(',');
    
    mockProperties.push({
      id: `mock-${i}-${Date.now()}`,
      address: newAddress,
      price: higherPrice,
      bedrooms: bedrooms ? Math.max(1, bedrooms + bedroomVariation) : bedrooms,
      bathrooms: bathrooms ? Math.max(1, bathrooms + bathroomVariation) : bathrooms,
      square_feet: square_feet ? square_feet * (1 + (Math.random() * 0.2 - 0.1)) : square_feet,
      property_type,
      distance,
      price_difference: priceDifference,
      image_url: getRandomImage()
    });
  }
  
  return mockProperties;
}

function getRandomImage() {
  const images = [
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750"
  ];
  return images[Math.floor(Math.random() * images.length)];
}
