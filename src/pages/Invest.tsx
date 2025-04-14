import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Home, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js"
import { PropertyProposalDialog } from "@/components/PropertyProposalDialog";
import { fetchPatmaPropertyData } from "@/utils/rightmove-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from 'axios';

interface PropertyListing {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bedrooms_verified?: boolean;
  bathrooms: number | null;
  bathrooms_verified?: boolean;
  square_feet: number | null;
  square_feet_verified?: boolean;
  image_url: string | null;
  roi_estimate: number | null;
  rental_estimate: number | null;
  investment_highlights: Record<string, string>;
  investment_score: number | null;
  created_at: string;
  updated_at: string;
  source: string;
  listing_url: string;
  listing_type: string;
  description?: string;
  property_type?: string;
  agent?: {
    name: string;
    phone: string;
  };
  ai_analysis: Record<string, string>;
  market_analysis: Record<string, string>;
  bidding_recommendation: number | null;
  last_sold_price: number | null;
  price_history: Record<string, unknown> | null;
  latitude?: number;
  longitude?: number;
  property_details?: {
    market_demand: string;
    area_growth: string;
    crime_rate: string;
    nearby_schools: number;
    energy_rating: string;
    council_tax_band: string;
    property_features: string[];
  };
  market_trends?: {
    appreciation_rate: number;
    market_activity: string;
  };
}

interface PatmaProperty {
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
  agent?: { name: string; phone: string };
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

const placeholderImages = [
  "https://images.unsplash.com/photo-1433832597046-4f10e10ac764",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b",
  "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb",
];

// Improved property images based on property type
const propertyTypeImages = {
  flat: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
    "https://images.unsplash.com/photo-1551361415-69c87624334f",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"
  ],
  house: [
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be"
  ],
  detached: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    "https://images.unsplash.com/photo-1549517045-bc93de075e53"
  ],
  terrace: [
    "https://images.unsplash.com/photo-1625602812206-5ec545ca1231",
    "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6"
  ],
  commercial: [
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
    "https://images.unsplash.com/photo-1577979536252-88d631d6d36d",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab"
  ]
};

// Function to get a type-specific image
const getPropertyImage = (propertyType: string, address: string): string => {
  // Determine property category based on address and property type
  const type = propertyType.toLowerCase();
  let category = 'house';
  
  if (type.includes('flat') || type.includes('apartment') || 
      address?.toLowerCase().includes('flat') || address?.toLowerCase().includes('apartment')) {
    category = 'flat';
  } else if (type.includes('detached') || address?.toLowerCase().includes('detached')) {
    category = 'detached';
  } else if (type.includes('terrace') || address?.toLowerCase().includes('terrace') || 
             address?.toLowerCase().includes('row')) {
    category = 'terrace';
  } else if (type.includes('commercial') || type.includes('office') || 
             address?.toLowerCase().includes('commercial') || address?.toLowerCase().includes('office')) {
    category = 'commercial';
  }
  
  // Get images for that category, or fallback to house
  const images = propertyTypeImages[category as keyof typeof propertyTypeImages] || propertyTypeImages.house;
  
  // Create a stable random selection based on the address (if available)
  const hash = address ? 
    address.split('').reduce((a, b) => (a * 31 + b.charCodeAt(0)) & 0xFFFFFFFF, 0) : 
    Math.floor(Math.random() * 1000);
  
  // Select an image based on the hash
  return images[hash % images.length];
};

const getRandomPlaceholder = () => {
  return placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
};

const getBidRecommendation = (property: PropertyListing) => {
  if (!property.bidding_recommendation) return null;
  const diff = ((property.bidding_recommendation - property.price) / property.price) * 100;
  return {
    value: property.bidding_recommendation,
    difference: diff,
    recommendation: diff > 0 ? "Bid higher" : "Bid lower",
  };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatROI = (value: number | null) => {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

const PropertyCard = ({ property, onClick }: { property: PropertyListing, onClick: () => void }) => {
  // Check if the property has keywords like "cash only" or "modernization" to highlight
  const highlightKeywords = ["cash only", "modernization", "modernisation", "modernization needed"];
  const hasHighlightedKeywords = property.description && 
    highlightKeywords.some(keyword => 
      property.description?.toLowerCase().includes(keyword.toLowerCase())
    );
  
  return (
    <Card 
      className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${hasHighlightedKeywords ? 'ring-2 ring-yellow-400 dark:ring-yellow-600' : ''}`}
      onClick={onClick}
    >
      <div className="aspect-video relative overflow-hidden">
        {property.image_url ? (
          <img 
            src={property.image_url} 
            alt={property.address} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = "https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image+Available";
            }}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Home className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Investment opportunity badge for highlighted properties */}
        {hasHighlightedKeywords && (
          <div className="absolute top-2 left-2 bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white text-xs font-bold px-2 py-1 rounded-full">
            Investment Opportunity
          </div>
        )}
        
        <div className="absolute top-2 right-2 bg-background/90 px-2 py-1 rounded text-sm font-medium">
          {property.property_type || 'Property'}
        </div>
        
        {/* Price badge at the bottom of the image */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-white">{formatCurrency(property.price)}</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-white bg-green-600/90 px-2 py-0.5 rounded">
                {formatROI(property.roi_estimate)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{property.address}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{property.address}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <span className="text-xs text-muted-foreground">Beds</span>
            <span className="font-medium">
              {property.bedrooms}
              {property.bedrooms_verified === false && (
                <span className="text-xs text-muted-foreground ml-1">(est.)</span>
              )}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <span className="text-xs text-muted-foreground">Baths</span>
            <span className="font-medium">
              {property.bathrooms || 'N/A'}
              {property.bathrooms && property.bathrooms_verified === false && (
                <span className="text-xs text-muted-foreground ml-1">(est.)</span>
              )}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <span className="text-xs text-muted-foreground">Sq Ft</span>
            <span className="font-medium">
              {property.square_feet ? property.square_feet.toLocaleString() : 'N/A'}
              {property.square_feet && property.square_feet_verified === false && (
                <span className="text-xs text-muted-foreground ml-1">(est.)</span>
              )}
            </span>
          </div>
        </div>
        
        {property.description && (
          <div className={`mt-2 mb-3 p-2 rounded ${hasHighlightedKeywords ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-700'}`}>
            <h4 className="text-sm font-medium mb-1 flex items-center">
              Description
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-3">{property.description}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col p-2 bg-green-50 dark:bg-green-950 rounded border border-green-100 dark:border-green-800">
            <span className="text-xs text-muted-foreground">Est. Rental</span>
            <span className="font-medium">{property.rental_estimate ? formatCurrency(property.rental_estimate) + '/mo' : 'N/A'}</span>
          </div>
          <div className="flex flex-col p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-100 dark:border-blue-800">
            <span className="text-xs text-muted-foreground">Last Sold</span>
            <span className="font-medium">
              {property.last_sold_price ? formatCurrency(property.last_sold_price) : 'Unknown'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Invest = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [patmaProperties, setPatmaProperties] = useState<PatmaProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState({
    location: "",  // Changed from postcode to location
    latitude: 51.507351,  // Default to London
    longitude: -0.127758,
    radius: 5
  });
  const navigate = useNavigate();

  // Check Supabase session
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch initial data using default coordinates (London)
        const patmaResults = await fetchPatmaPropertyData(
          locationSearch.latitude, 
          locationSearch.longitude, 
          locationSearch.radius
        );
        console.log("Fetched initial PaTMa Property Data:", patmaResults);
        
        if (patmaResults && Array.isArray(patmaResults)) {
          setPatmaProperties(patmaResults);
          
          // Convert PaTMa properties to the PropertyListing format
          const mappedProperties = patmaResults.map((patmaProperty) => {
            return mapPatmaToPropertyListing(patmaProperty);
          });
          
          // Set properties state with ONLY the mapped PaTMa properties
          setProperties(mappedProperties);
          
          if (mappedProperties.length > 0) {
            toast.success(`Found ${mappedProperties.length} properties in London (default location)`);
          } else {
            toast.info("No properties found in the default area. Try searching for a specific location.");
          }
        }
      } catch (error) {
        console.error("Error fetching PaTMa data:", error);
        toast.error("Failed to fetch property data from PaTMa");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // Check user session for saved properties
    checkSession();
  }, []);

  const calculateRentalEstimate = (price: number, bedrooms: number | null, propertyType: string): number => {
    if (!price) return 0;
    if (!bedrooms) bedrooms = 2; // Default to 2 bedrooms if not specified
    
    // Base rental is roughly 0.8% of property value annually, divided by 12 for monthly
    let baseRental = (price * 0.008) / 12;
    
    // Adjust for bedrooms
    baseRental *= (1 + (bedrooms - 2) * 0.1); // +/- 10% per bedroom difference from 2
    
    // Adjust for property type
    if (propertyType.toLowerCase().includes('flat') || propertyType.toLowerCase().includes('apartment')) {
      baseRental *= 1.1; // Flats typically have higher rental yields
    } else if (propertyType.toLowerCase().includes('detached')) {
      baseRental *= 0.9; // Detached houses typically have lower rental yields
    }
    
    return Math.round(baseRental);
  };

  const calculateROI = (price: number, monthlyRental: number): number => {
    if (!price || !monthlyRental) return 0;
    const annualRental = monthlyRental * 12;
    return (annualRental / price) * 100; // Return as percentage
  };

  const handlePropertyClick = (property: PropertyListing) => {
    // Simply set the selected property and open dialog
    setSelectedProperty(property);
    setIsProposalDialogOpen(true);
  };

  const handleLocationSearch = async () => {
    if (!locationSearch.location.trim()) {
      toast.error("Please enter a location name or postcode");
      return;
    }
    
    setLoading(true);
    try {
      let geocodeUrl;
      const searchTerm = locationSearch.location.trim();
      
      // Check if input is likely a postcode (contains numbers)
      if (/\d/.test(searchTerm)) {
        // Use postcodes.io for UK postcodes
        geocodeUrl = `https://api.postcodes.io/postcodes/${encodeURIComponent(searchTerm)}`;
      } else {
        // Use OpenStreetMap Nominatim API for location names
        geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&country=UK&limit=1`;
      }
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      let latitude, longitude;
      
      if (/\d/.test(searchTerm) && data.status === 200 && data.result) {
        // Postcode.io response format
        latitude = data.result.latitude;
        longitude = data.result.longitude;
      } else if (!(/\d/.test(searchTerm)) && data.length > 0) {
        // Nominatim response format
        latitude = parseFloat(data[0].lat);
        longitude = parseFloat(data[0].lon);
      } else {
        throw new Error("Location not found");
      }
      
      if (latitude && longitude) {
        // Update state with new coordinates
        setLocationSearch(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        
        // Fetch properties with new coordinates
        const patmaResults = await fetchPatmaPropertyData(latitude, longitude, locationSearch.radius);
        console.log("Fetched PaTMa Property Data for location:", patmaResults);
        
        if (patmaResults && Array.isArray(patmaResults)) {
          setPatmaProperties(patmaResults);
          
          // Convert PaTMa properties to the PropertyListing format
          const mappedProperties = patmaResults.map((patmaProperty) => {
            return mapPatmaToPropertyListing(patmaProperty);
          });
          
          // Set properties state with ONLY the mapped PaTMa properties
          setProperties(mappedProperties);
          
          if (mappedProperties.length > 0) {
            toast.success(`Found ${mappedProperties.length} properties near ${locationSearch.location}`);
          } else {
            toast.info(`No properties found near ${locationSearch.location}`);
          }
        }
      }
    } catch (error) {
      console.error("Error searching by location:", error);
      toast.error("Location not found or error searching properties");
    } finally {
      setLoading(false);
    }
  };

  // Function to map PaTMa property data to PropertyListing format
  const mapPatmaToPropertyListing = (patmaProperty: PatmaProperty): PropertyListing => {
    // Determine the price - use last_sold_price if price/asking_price are not available
    const price = patmaProperty.price || patmaProperty.asking_price || patmaProperty.last_sold_price || 0;
    
    // Log the price to help debug prices outside our range
    if (price < 70000 || price > 275000) {
      console.warn(`Property outside price range: ${patmaProperty.address} - £${price.toLocaleString()}`);
    }
    
    // Extract property type from address if not available
    const propertyType = patmaProperty.property_type || 
      (patmaProperty.address?.toLowerCase().includes("flat") ? "Flat" : 
       patmaProperty.address?.toLowerCase().includes("house") ? "House" : "Property");
    
    // Get a property-specific image based on the property type and address
    const imageUrl = getPropertyImage(propertyType, patmaProperty.address || "");
    
    // Extract bedrooms/bathrooms from data
    const bedrooms = patmaProperty.bedrooms || 
      (patmaProperty.address?.match(/\b(\d+)\s*bed/i)?.[1] ? 
       parseInt(patmaProperty.address?.match(/\b(\d+)\s*bed/i)[1]) : null);
    
    // If no bedrooms data is available, estimate based on property type and price
    let actualBedrooms = bedrooms;
    const bedroomsVerified = patmaProperty.bedrooms_estimated === true ? false : 
                            (actualBedrooms === null ? false : true);
    
    if (actualBedrooms === null) {
      // Estimate bedrooms based on property type and price
      if (propertyType.toLowerCase().includes('flat') || propertyType.toLowerCase().includes('apartment')) {
        // For flats/apartments
        if (price < 120000) actualBedrooms = 1; 
        else if (price < 180000) actualBedrooms = 2;
        else actualBedrooms = 3;
      } else if (propertyType.toLowerCase().includes('detached')) {
        // For detached houses
        if (price < 150000) actualBedrooms = 2;
        else if (price < 230000) actualBedrooms = 3;
        else if (price < 300000) actualBedrooms = 4;
        else actualBedrooms = 5;
      } else {
        // For terraced, semi-detached, and others
        if (price < 120000) actualBedrooms = 2;
        else if (price < 200000) actualBedrooms = 3;
        else actualBedrooms = 4;
      }
    }
    
    // Generate fallback bathroom count based on property type and bedrooms
    let bathrooms = patmaProperty.bathrooms;
    let bathroomsVerified = true; // Default: assume data is verified if it exists
    
    if (bathrooms === null || bathrooms === undefined) {
      bathroomsVerified = false; // We're estimating, so mark as not verified
      // Estimate bathrooms based on number of bedrooms and property type
      if (actualBedrooms) {
        if (propertyType.toLowerCase().includes('flat') || propertyType.toLowerCase().includes('apartment')) {
          // Flats usually have fewer bathrooms
          bathrooms = actualBedrooms > 2 ? 2 : 1;
        } else if (propertyType.toLowerCase().includes('detached')) {
          // Detached houses usually have more bathrooms
          bathrooms = Math.min(Math.ceil(actualBedrooms / 2) + 1, actualBedrooms);
        } else {
          // For terraced, semi-detached, and other house types
          bathrooms = Math.min(Math.ceil(actualBedrooms / 2), actualBedrooms);
        }
      } else {
        // Default to 1 bathroom if no bedroom info either
        bathrooms = 1;
      }
    }
    
    // Generate a description if none exists
    const description = patmaProperty.description || (() => {
      const bedroomText = actualBedrooms ? `${actualBedrooms} bedroom` : '';
      const locationText = patmaProperty.address ? 
        `in ${patmaProperty.address.split(',').pop()?.trim() || 'a great location'}` : '';
      
      return `A ${bedroomText} ${propertyType} ${locationText}. This property has potential as an investment opportunity. Please contact the agent for more details and to arrange a viewing.`;
    })();
    
    // Determine if square footage is directly from the API (verified) or estimated
    let squareFeet = patmaProperty.floor_area_sqft || patmaProperty.square_feet || patmaProperty.area || null;
    let squareFeetVerified = true; // Default to true if data exists
    
    // Check if we have direct floor_area_sqft data from the API
    if (patmaProperty.floor_area_sqft) {
      squareFeetVerified = true; // Directly from PaTMa API, so verified
    } else if (patmaProperty.square_feet || patmaProperty.area) {
      squareFeetVerified = false; // Using fallback data, so mark as unverified
    }
    
    // If no square footage data is available, estimate based on property type and bedrooms
    if (squareFeet === null) {
      squareFeetVerified = false; // We're estimating, so mark as not verified
      if (actualBedrooms) {
        // Rough estimates based on UK averages
        if (propertyType.toLowerCase().includes('flat') || propertyType.toLowerCase().includes('apartment')) {
          squareFeet = actualBedrooms * 350; // ~350 sq ft per bedroom for flats
        } else if (propertyType.toLowerCase().includes('detached')) {
          squareFeet = actualBedrooms * 450; // ~450 sq ft per bedroom for detached
        } else {
          squareFeet = actualBedrooms * 400; // ~400 sq ft per bedroom for other houses
        }
      } else {
        // Default estimate if we don't even have bedroom count
        squareFeet = 800; // Average 1-2 bedroom property
      }
    }
    
    return {
      id: patmaProperty.id || `patma-${Math.random().toString(36).substr(2, 9)}`,
      address: patmaProperty.address || patmaProperty.location || "Unknown address",
      price: price,
      bedrooms: actualBedrooms,
      bedrooms_verified: bedroomsVerified,
      bathrooms: bathrooms,
      bathrooms_verified: bathroomsVerified,
      square_feet: squareFeet,
      square_feet_verified: squareFeetVerified,
      image_url: imageUrl,
      roi_estimate: patmaProperty.roi || calculateROI(
        price, 
        patmaProperty.rental_value || calculateRentalEstimate(price, actualBedrooms, propertyType)
      ),
      rental_estimate: patmaProperty.rental_value || calculateRentalEstimate(
        price, 
        actualBedrooms, 
        propertyType
      ),
      investment_highlights: {
        location: patmaProperty.location || patmaProperty.address || "Unknown",
        type: propertyType,
        features: patmaProperty.features ? patmaProperty.features.slice(0, 3).join(", ") : ""
      },
      investment_score: patmaProperty.investment_score || 70,
      created_at: patmaProperty.created_at || new Date().toISOString(),
      updated_at: patmaProperty.updated_at || new Date().toISOString(),
      source: "patma",
      listing_url: patmaProperty.url || "#",
      listing_type: patmaProperty.listing_type || "sale",
      description: description,
      property_type: propertyType,
      agent: patmaProperty.agent || { name: "PaTMa Agent", phone: "N/A" },
      ai_analysis: {
        summary: patmaProperty.ai_analysis || "Analysis not available for this property",
        recommendation: patmaProperty.recommendation || "Consider researching the area further"
      },
      market_analysis: {
        trend: patmaProperty.market_trend || "Market data not available",
        demand: patmaProperty.demand || "Unknown"
      },
      bidding_recommendation: patmaProperty.bidding_recommendation || (price * 0.95),
      last_sold_price: patmaProperty.last_sold_price || null,
      price_history: patmaProperty.price_history || null,
      latitude: patmaProperty.latitude || patmaProperty.lat || null,
      longitude: patmaProperty.longitude || patmaProperty.lng || null,
      property_details: {
        market_demand: patmaProperty.market_demand || "Medium",
        area_growth: patmaProperty.area_growth || "3.5%",
        crime_rate: patmaProperty.crime_rate || "Average",
        nearby_schools: patmaProperty.nearby_schools || 0,
        energy_rating: patmaProperty.energy_rating || "Unknown",
        council_tax_band: patmaProperty.council_tax_band || "Unknown",
        property_features: patmaProperty.features || []
      },
      market_trends: {
        appreciation_rate: patmaProperty.appreciation_rate || 3.2,
        market_activity: patmaProperty.market_activity || "Moderate"
      }
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>Dashboard</Button>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
              ) : (
                <Link to="/sign-in">
                  <Button>Sign in</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invest in Properties</h1>
            <p className="text-gray-500 mt-1">Find your next investment opportunity.</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-2 items-end">
            <div>
              <Label htmlFor="location">Location or Postcode</Label>
              <div className="flex gap-2">
                <Input 
                  id="location"
                  placeholder="e.g. Manchester or M1 1AA" 
                  value={locationSearch.location}
                  onChange={(e) => setLocationSearch(prev => ({...prev, location: e.target.value}))}
                  className="w-36 md:w-44"
                />
                <Input 
                  id="radius"
                  type="number"
                  placeholder="Radius (miles)" 
                  value={locationSearch.radius}
                  onChange={(e) => setLocationSearch(prev => ({...prev, radius: Number(e.target.value) || 5}))}
                  className="w-32"
                  min="1"
                  max="25"
                />
                <Button onClick={handleLocationSearch} className="flex items-center gap-1">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Filtering for: 3+ beds, 2+ baths, price £70K-£275K, detached/semi-detached/terraced
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Listings</CardTitle>
              <CardDescription>
                Properties matching investment criteria: 3+ bedrooms, 2+ bathrooms, £70K-£275K, detached/semi-detached/terraced houses. Looking for properties with "cash only" or "modernization needed" opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : properties.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onClick={() => handlePropertyClick(property)}
                    />
                  ))}
                </div>
              ) :
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No properties found.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      const fetchData = async () => {
                        setLoading(true);
                        try {
                          // Use the current search location coordinates instead of defaults
                          const data = await fetchPatmaPropertyData(
                            locationSearch.latitude,
                            locationSearch.longitude,
                            locationSearch.radius,
                            undefined, // Use default filters
                            true // Bypass cache
                          );
                          console.log("Refreshed PaTMa Property Data:", data);
                          
                          if (data && Array.isArray(data)) {
                            setPatmaProperties(data);
                            
                            // Convert PaTMa properties to the PropertyListing format
                            const mappedProperties = data.map((patmaProperty) => {
                              return mapPatmaToPropertyListing(patmaProperty);
                            });
                            
                            // Update properties state with ONLY the mapped PaTMa properties
                            if (mappedProperties.length > 0) {
                              setProperties(mappedProperties);
                              toast.success(`Found ${mappedProperties.length} properties near ${locationSearch.location || "current location"}`);
                            } else {
                              toast.info(`No properties found near ${locationSearch.location || "current location"}`);
                            }
                          }
                        } catch (error) {
                          console.error("Error fetching PaTMa data:", error);
                          toast.error("Failed to fetch property data from PaTMa");
                        } finally {
                          setLoading(false);
                        }
                      };
                      
                      fetchData();
                    }}
                  >
                    Refresh Property Data
                  </Button>
                </div>
              }
            </CardContent>
          </Card>
        </div>
  
        {selectedProperty && (
          <PropertyProposalDialog
            property={selectedProperty}
            open={isProposalDialogOpen}
            onOpenChange={(open) => {
              setIsProposalDialogOpen(open);
              if (!open) setSelectedProperty(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Invest;