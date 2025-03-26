// Mock API for property analysis
interface PropertyData {
  id: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  property_type?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
}

interface SimilarProperty {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  property_type?: string;
  distance: number; // in meters
  price_difference: number; // percentage higher than the original property
  image_url?: string;
}

export const findSimilarProperties = async (propertyData: PropertyData, allProperties: PropertyData[]): Promise<SimilarProperty[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const { latitude, longitude, price, bedrooms, bathrooms, property_type } = propertyData;
  
  if (!latitude || !longitude) {
    return generateMockSimilarProperties(propertyData);
  }
  
  // Filter properties within 1km radius with higher prices
  const similarProperties = allProperties
    .filter(p => {
      if (p.id === propertyData.id) return false; // Exclude the current property
      if (!p.latitude || !p.longitude) return false;
      if (p.price <= price) return false; // Only higher priced properties
      
      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        latitude, longitude,
        p.latitude, p.longitude
      );
      
      return distance <= 1000; // Within 1km (1000 meters)
    })
    .map(p => {
      const distance = calculateDistance(
        latitude, longitude,
        p.latitude!, p.longitude!
      );
      
      return {
        id: p.id,
        address: p.address,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        square_feet: p.square_feet,
        property_type: p.property_type,
        distance: Math.round(distance),
        price_difference: Math.round(((p.price - price) / price) * 100),
        image_url: p.image_url
      };
    })
    .sort((a, b) => a.distance - b.distance); // Sort by closest first
  
  // If no real similar properties found, generate mock ones
  if (similarProperties.length === 0) {
    return generateMockSimilarProperties(propertyData);
  }
  
  return similarProperties.slice(0, 3); // Return top 3 similar properties
};

// Generate mock similar properties when real data isn't available
const generateMockSimilarProperties = (propertyData: PropertyData): SimilarProperty[] => {
  const { price, bedrooms, bathrooms, square_feet, property_type, address } = propertyData;
  
  // Generate 2-4 mock similar properties
  const count = Math.floor(Math.random() * 3) + 2;
  const mockProperties: SimilarProperty[] = [];
  
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
      image_url: getRandomPropertyImage()
    });
  }
  
  return mockProperties.sort((a, b) => a.distance - b.distance);
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Get random property image
const getRandomPropertyImage = (): string => {
  const images = [
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750"
  ];
  return images[Math.floor(Math.random() * images.length)];
};

export const analyzeProperty = async (propertyData: PropertyData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { price, bedrooms, bathrooms, square_feet, address } = propertyData;
  
  // Generate mock analysis
  const analysis = `
1. Automated Valuation:
   Based on comparable properties in the area, the estimated fair market value for this property is ${formatCurrency(calculateFairValue(price, square_feet || 1000))}. 
   
   The price per square foot is ${formatCurrency(price / (square_feet || 1000))} which is ${price / (square_feet || 1000) > 200 ? 'above' : 'below'} the area average of $200 per square foot.
   
   Recent market trends show a ${Math.random() > 0.5 ? 'positive' : 'negative'} growth rate of ${(Math.random() * 5 + 2).toFixed(1)}% annually in this area.

2. Area Analysis:
   The property is located in ${address.split(',')[0]}, which is a ${['highly desirable', 'moderately desirable', 'up-and-coming'][Math.floor(Math.random() * 3)]} neighborhood.
   
   Crime rates in this area are ${['low', 'moderate', 'variable depending on the specific location'][Math.floor(Math.random() * 3)]}.
   
   The area has ${['excellent', 'good', 'average'][Math.floor(Math.random() * 3)]} schools with ratings averaging ${Math.floor(Math.random() * 3) + 7}/10.
   
   Public transportation is ${['readily available', 'limited', 'accessible with some walking'][Math.floor(Math.random() * 3)]}.
   
   Local amenities include shopping centers, restaurants, parks, and healthcare facilities within a ${Math.floor(Math.random() * 2) + 1}-mile radius.

3. Investment Potential:
   The projected value appreciation over the next 5 years is estimated at ${(Math.random() * 15 + 5).toFixed(1)}%.
   
   Rental demand in this area is ${['high', 'moderate', 'growing'][Math.floor(Math.random() * 3)]}, with an estimated monthly rental income of ${formatCurrency(calculateRentalIncome(price, bedrooms))}.
   
   The gross rental yield is approximately ${(calculateRentalIncome(price, bedrooms) * 12 / price * 100).toFixed(1)}%.
   
   Risk assessment: ${['Low', 'Moderate', 'Moderate-to-Low'][Math.floor(Math.random() * 3)]} risk investment.
   
   Suggested improvements to increase value: ${['Kitchen renovation', 'Bathroom updates', 'Landscaping improvements', 'Energy efficiency upgrades'][Math.floor(Math.random() * 4)]}.

4. Deal Score:
   Based on our comprehensive analysis, this property scores ${calculateDealScore(price, square_feet, bedrooms)}/100.
   
   Price vs. market value: ${price > calculateFairValue(price, square_feet || 1000) ? 'Above market value' : 'Below market value'}
   Location quality: ${['Excellent', 'Good', 'Average'][Math.floor(Math.random() * 3)]}
   Property condition: ${['Excellent', 'Good', 'Average', 'Needs work'][Math.floor(Math.random() * 4)]} (based on listing details)
   Investment potential: ${['High', 'Moderate', 'Average'][Math.floor(Math.random() * 3)]}
   Risk factors: ${['Low vacancy risk', 'Moderate maintenance costs', 'Potential for increased property taxes'][Math.floor(Math.random() * 3)]}
  `;
  
  // Generate mock area data
  const areaData = {
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
  
  // Generate similar properties
  const similarProperties = await generateMockSimilarProperties(propertyData);
  
  return {
    success: true,
    analysis,
    area_data: areaData,
    similar_properties: similarProperties
  };
};

// Helper functions
const calculateFairValue = (price: number, squareFeet: number): number => {
  // Simulate a fair value calculation
  const adjustment = (Math.random() * 0.2) - 0.1; // -10% to +10%
  return price * (1 + adjustment);
};

const calculateRentalIncome = (price: number, bedrooms: number | null): number => {
  // Simple rental calculation
  const baseRent = price * 0.005; // 0.5% of property value monthly
  const bedroomAdjustment = bedrooms ? (bedrooms - 2) * 100 : 0; // $100 per bedroom above/below 2
  return baseRent + bedroomAdjustment;
};

const calculateDealScore = (price: number, squareFeet: number | null, bedrooms: number | null): number => {
  // Calculate a deal score out of 100
  const fairValue = calculateFairValue(price, squareFeet || 1000);
  const valueScore = price < fairValue ? Math.min(40, 40 * (fairValue / price)) : Math.max(20, 40 * (price / fairValue));
  const sizeScore = squareFeet ? Math.min(30, squareFeet / 50) : 15;
  const bedroomScore = bedrooms ? bedrooms * 5 : 10;
  
  return Math.min(100, Math.round(valueScore + sizeScore + bedroomScore));
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}; 