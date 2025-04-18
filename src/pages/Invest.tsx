import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Home, MapPin, Search, Filter, Bed, Bath, Ruler } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js"
import { PropertyProposalDialog } from "@/components/PropertyProposalDialog";
import { fetchPatmaPropertyData } from "@/utils/rightmove-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { FilterPanel, FilterState } from "@/components/FilterPanel";
import { Spinner } from "@/components/ui/spinner";
import { fetchPropertyDetails } from "@/utils/rightmove-api";

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
    planning_applications?: Array<{
      description: string;
      status: string;
      date_submitted: string;
      reference?: string;
      decision?: string;
      url?: string;
    }>;
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
  planning_details?: {
    description: string;
  };
  has_planning?: boolean;
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
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
  ],
  house: [
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6",
    "https://images.unsplash.com/photo-1592595896616-c37162298647"
  ],
  detached: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    "https://images.unsplash.com/photo-1549517045-bc93de075e53",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126",
    "https://images.unsplash.com/photo-1598228723793-52759bba239c"
  ],
  terrace: [
    "https://images.unsplash.com/photo-1625602812206-5ec545ca1231",
    "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6",
    "https://images.unsplash.com/photo-1584738766473-61c083514bf4",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d",
    "https://images.unsplash.com/photo-1605146768851-eda79da39897"
  ],
  semi: [
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83",
    "https://images.unsplash.com/photo-1600047509358-9dc75507daeb",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    "https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb"
  ],
  bungalow: [
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126",
    "https://images.unsplash.com/photo-1568092806323-8ea26e271fb5",
    "https://images.unsplash.com/photo-1565953554309-d181306db7d5",
    "https://images.unsplash.com/photo-1593696140826-c58b021acf8b",
    "https://images.unsplash.com/photo-1570793005386-840846445fed",
    "https://images.unsplash.com/photo-1597047084897-51e81819a499"
  ],
  commercial: [
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
    "https://images.unsplash.com/photo-1577979536252-88d631d6d36d",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
    "https://images.unsplash.com/photo-1478860409698-8707f313ee8b",
    "https://images.unsplash.com/photo-1556156653-e5a7676af8e4",
    "https://images.unsplash.com/photo-1524397057410-1e775ed476f3"
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
  } else if (type.includes('bungalow') || address?.toLowerCase().includes('bungalow')) {
    category = 'bungalow';
  } else if (type.includes('detached') || address?.toLowerCase().includes('detached')) {
    category = 'detached';
  } else if (type.includes('semi') || address?.toLowerCase().includes('semi')) {
    category = 'semi';
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

// Helper function to estimate square footage based on property type and bedrooms
const estimateSquareFootage = (propertyType: string | undefined, bedrooms: number | undefined): number => {
  // Default values if property type or bedrooms are unknown
  if (!propertyType || !bedrooms) return 0;
  
  const propertyTypeLower = propertyType.toLowerCase();
  
  // Base square footage estimates by property type
  const baseFootage = {
    flat: 600,
    apartment: 600,
    maisonette: 750,
    house: 850,
    terrace: 800,
    terraced: 800,
    semi: 900,
    "semi-detached": 900,
    detached: 1200,
    bungalow: 900,
    cottage: 750,
    land: 0,
    commercial: 1500,
  };
  
  // Find the matching property type or use default
  let base = 800; // default if no match
  
  for (const [type, footage] of Object.entries(baseFootage)) {
    if (propertyTypeLower.includes(type)) {
      base = footage;
      break;
    }
  }
  
  // Adjust for number of bedrooms
  // Each bedroom after the first adds approximately 200-300 sq ft
  const bedroomAdjustment = bedrooms > 1 ? (bedrooms - 1) * 250 : 0;
  
  return base + bedroomAdjustment;
};

const highlightKeywords = [
  "garden", "renovated", "spacious", "modern", "garage", "parking", "refurbished", "potential",
  "planning application", "extension", "renovation", "development", "modernization", "modernisation"
];

const PropertyCard = ({ property, onClick }: { property: PropertyListing, onClick: () => void }) => {
  // Function to highlight keywords in description
  const highlightText = (text: string) => {
    if (!text) return "";
    
    let result = text;
    
    // Highlight keywords with a yellow background
    highlightKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      result = result.replace(regex, match => `<span class="bg-yellow-100 dark:bg-yellow-900">${match}</span>`);
    });
    
    return result;
  };

  // Check for planning information
  const hasPlanningDetails = property.description?.toLowerCase().includes('planning application') || property.property_details?.planning_applications?.length > 0;

  // Handle image loading errors
  const [imageError, setImageError] = useState(false);
  const [showPlanningDetails, setShowPlanningDetails] = useState(false);

  // Get planning details if available
  const planningDetails = property.property_details?.planning_applications || [];
  
  // Get a fallback image based on property type if the main image fails
  const getFallbackImage = () => {
    const type = property.property_type?.toLowerCase() || '';
    let category = 'house';
    
    if (type.includes('flat') || type.includes('apartment')) {
      category = 'flat';
    } else if (type.includes('bungalow')) {
      category = 'bungalow';
    } else if (type.includes('detached')) {
      category = 'detached';
    } else if (type.includes('semi')) {
      category = 'semi';
    } else if (type.includes('terrace')) {
      category = 'terrace';
    }
    
    const images = propertyTypeImages[category as keyof typeof propertyTypeImages] || propertyTypeImages.house;
    return images[Math.floor(Math.random() * images.length)];
  };
  
  return (
    <div
      className="group rounded-lg border p-4 shadow-sm transition-all hover:shadow-md cursor-pointer bg-white dark:bg-gray-800"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-md mb-4">
        {property.image_url ? (
          <img
            src={property.image_url}
            alt={property.address}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={e => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = getFallbackImage();
            }}
          />
        ) : (
          <img
            src={getFallbackImage()}
            alt="Property"
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2 flex flex-wrap gap-1">
          {property.listing_type === "auction" && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
              Auction
            </span>
          )}
          {property.source && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
              {property.source}
            </span>
          )}
          {hasPlanningDetails && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
              Planning
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg truncate">{property.address}</h3>
        <div className="flex justify-between">
          <span className="text-lg font-bold">{formatCurrency(property.price)}</span>
          <span className="text-sm text-green-600">{formatROI(property.roi_estimate)}</span>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <span className="flex items-center">
            <Bed className="mr-1 h-4 w-4 text-gray-400" />
            {property.bedrooms}
            {property.bedrooms_verified === false && <span className="text-xs text-gray-400 ml-1">(est.)</span>}
          </span>
          {property.bathrooms && (
            <span className="flex items-center">
              <Bath className="mr-1 h-4 w-4 text-gray-400" />
              {property.bathrooms}
              {property.bathrooms_verified === false && <span className="text-xs text-gray-400 ml-1">(est.)</span>}
            </span>
          )}
          {property.square_feet && (
            <span className="flex items-center">
              <Ruler className="mr-1 h-4 w-4 text-gray-400" />
              {property.square_feet.toLocaleString()}
              {property.square_feet_verified === false && <span className="text-xs text-gray-400 ml-1">(est.)</span>}
            </span>
          )}
        </div>
        {property.description && (
          <p 
            className="text-sm text-gray-500 line-clamp-3" 
            dangerouslySetInnerHTML={{ __html: highlightText(property.description) }}
          />
        )}
        
        {hasPlanningDetails && (
          <div className="mt-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowPlanningDetails(!showPlanningDetails);
              }}
              className="text-xs bg-green-100 hover:bg-green-200 text-green-800 font-medium rounded-full px-2 py-1 flex items-center gap-1"
            >
              <span>{showPlanningDetails ? 'Hide Planning Details' : 'View Planning Details'}</span>
            </button>
            
            {showPlanningDetails && planningDetails.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs" onClick={(e) => e.stopPropagation()}>
                {planningDetails.map((app, index) => (
                  <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                    <p className="font-medium">{app.description}</p>
                    <div className="mt-1 text-gray-600">
                      <p>Status: {app.status}</p>
                      <p>Date: {new Date(app.date_submitted).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Invest = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [patmaProperties, setPatmaProperties] = useState<PatmaProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    propertyType: "",
    minPrice: "70000",
    maxPrice: "275000",
    minBedrooms: "1",
    maxBedrooms: "3",
    minBathrooms: "2",
    maxBathrooms: "",
    minSquareFeet: "",
    maxSquareFeet: "",
    propertyStatus: "",
    listingType: "",
    dateAdded: "",
    features: [],
    location: "",
    latitude: 51.507351,
    longitude: -0.127758,
    radius: 5
  });
  const navigate = useNavigate();
  const investmentKeywords = ["garden", "renovated", "spacious", "modern", "garage", "parking", "refurbished", "potential"];
  const [isSearching, setIsSearching] = useState(false);
  const [propertyListings, setPropertyListings] = useState<PropertyListing[]>([]);

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
          filters.latitude, 
          filters.longitude, 
          filters.radius
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

  const handleFilterChange = (key: keyof FilterState, value: string | string[] | number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      propertyType: "",
      minPrice: "",
      maxPrice: "",
      minBedrooms: "",
      maxBedrooms: "",
      minBathrooms: "",
      maxBathrooms: "",
      minSquareFeet: "",
      maxSquareFeet: "",
      propertyStatus: "",
      listingType: "",
      dateAdded: "",
      features: [],
      location: "",
      findPropertiesInBadCondition: false // Reset the new property
    });
  };

  const handleSearch = async () => {
    // Log current filter state for debugging
    console.log("Search triggered with filters:", filters);
    
    // Start loading state and reset properties
    setIsSearching(true);
    setProperties([]);
    setPropertyListings([]);
    
    // Check if we have coordinates to search
    if (!filters.latitude || !filters.longitude) {
      toast.error("Please specify a location to search.");
      setIsSearching(false);
      return;
    }
    
    try {
      // Set up filters for API call
      const patmaFilters = {
        minBedrooms: parseInt(filters.minBedrooms) || 1,
        maxBedrooms: parseInt(filters.maxBedrooms) || 5,
        minBathrooms: parseInt(filters.minBathrooms) || 1,
        maxBathrooms: parseInt(filters.maxBathrooms) || 3,
        minPrice: parseInt(filters.minPrice) || 0,
        maxPrice: parseInt(filters.maxPrice) || 1000000,
        propertyTypes: filters.propertyType ? [filters.propertyType] : ['semi-detached', 'detached', 'terraced', 'bungalow'],
        includeKeywords: ['potential', 'renovation', 'opportunity', 'cash only'],
        excludeKeywords: ['new home', 'retirement', 'shared ownership', 'auction', 'flat', 'apartment'],
        findPropertiesInBadCondition: !!filters.findPropertiesInBadCondition
      };
      
      // Show loading toast
      const searchToast = toast.loading(`Searching for properties near ${filters.location || 'selected location'}...`);
      
      console.log("Fetching properties with params:", {
        latitude: filters.latitude,
        longitude: filters.longitude,
        radius: filters.radius,
        filters: patmaFilters
      });
      
      // Fetch property data from PaTMa API
      const patmaResults = await fetchPatmaPropertyData(
        filters.latitude,
        filters.longitude,
        filters.radius || 5,
        patmaFilters,
        true // bypass cache
      );
      
      console.log(`PaTMa returned ${patmaResults?.length || 0} properties`);
      
      if (!patmaResults || patmaResults.length === 0) {
        toast.dismiss(searchToast);
        toast.error("No properties found matching your criteria.");
        setIsSearching(false);
        return;
      }
      
      // Store raw PatMa properties for reference
      setPatmaProperties(patmaResults);
      
      // Process properties in batches to check availability
      const batchSize = 5;
      const availableProperties: PatmaProperty[] = [];
      const unavailableProperties: PatmaProperty[] = [];
      
      toast.dismiss(searchToast);
      let processToast = toast.loading(`Processing ${patmaResults.length} properties...`);
      
      // Process properties in batches
      for (let i = 0; i < patmaResults.length; i += batchSize) {
        const batch = patmaResults.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (property) => {
            try {
              const isAvailable = property.url 
                ? await isPropertyUrlActive(property.url)
                : true; // If no URL assume it's available
              
              console.log(`Property ${property.id || i}: ${isAvailable ? 'Available' : 'Unavailable'}`);
              return { property, isAvailable };
            } catch (error) {
              console.error(`Error checking property ${property.id || i}:`, error);
              return { property, isAvailable: false, error };
            }
          })
        );
        
        // Separate available and unavailable properties
        batchResults.forEach(({ property, isAvailable }) => {
          if (isAvailable) {
            availableProperties.push(property);
          } else {
            unavailableProperties.push(property);
          }
        });
        
        // Update toast with progress
        toast.dismiss(processToast);
        const progressToast = toast.loading(`Processed ${i + batch.length}/${patmaResults.length} properties...`);
        processToast = progressToast;
      }
      
      toast.dismiss(processToast);
      
      console.log(`Found ${availableProperties.length} available properties`);
      console.log(`Filtered out ${unavailableProperties.length} unavailable properties`);
      
      // Map properties to the display format
      const mappedProperties = await Promise.all(availableProperties.map(async (patmaProperty) => {
        // Extract postcode for additional data
        const postcodeMatch = patmaProperty.address?.match(/([A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2})/i);
        const postcode = postcodeMatch ? postcodeMatch[1] : null;
        
        // Fetch planning and other property details if postcode is available
        let propertyDetails = null;
        if (postcode) {
          try {
            propertyDetails = await fetchPropertyDetails(postcode);
            console.log(`Fetched details for ${patmaProperty.address}:`, propertyDetails);
          } catch (error) {
            console.error(`Error fetching details for ${patmaProperty.address}:`, error);
          }
        }
        
        // Map the property with additional details
        const mappedProperty = mapPatmaToPropertyListing(patmaProperty);
        
        // Add planning details if available
        if (propertyDetails?.planning && propertyDetails.planning.applications?.length > 0) {
          if (!mappedProperty.property_details) {
            mappedProperty.property_details = {
              market_demand: "Medium",
              area_growth: "Steady",
              crime_rate: "Low",
              nearby_schools: 3,
              energy_rating: "C",
              council_tax_band: "D",
              property_features: patmaProperty.features || []
            };
          }
          
          mappedProperty.property_details.planning_applications = propertyDetails.planning.applications.map(app => ({
            description: app.description,
            status: app.status,
            date_submitted: app.date_submitted,
            reference: app.reference,
            decision: app.decision,
            url: app.url
          }));
          
          // Add planning information to description
          if (mappedProperty.description) {
            mappedProperty.description += "\n\n" + propertyDetails.planning.applications
              .map(app => `Planning application: ${app.description} (${app.status})`)
              .join("\n");
          }
        }
        
        return mappedProperty;
      }));
      
      // Update state with the processed properties
      setProperties(mappedProperties);
      setPropertyListings(mappedProperties);
      
      // Show success message
      if (mappedProperties.length > 0) {
        toast.success(`Found ${mappedProperties.length} properties matching your criteria.`);
      } else {
        toast.info("No available properties found matching your criteria.");
      }
      
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error searching for properties. Please try again.");
    } finally {
      // End loading state
      setIsSearching(false);
      console.log("Search completed.");
    }
  };

  const isPropertyUrlActive = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.status === 200;
    } catch (error) {
      console.error(`Error checking URL ${url}:`, error);
      return true; // Assume it's active if we can't check
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
        else actualBedrooms = 3; // Cap at 3 bedrooms
      } else {
        // For terraced, semi-detached, and others
        if (price < 120000) actualBedrooms = 2;
        else if (price < 200000) actualBedrooms = 3;
        else actualBedrooms = 3; // Cap at 3 bedrooms
      }
    }
    
    // Ensure bedrooms are within our 1-3 range regardless of API data or estimates
    if (actualBedrooms !== null) {
      if (actualBedrooms < 1) actualBedrooms = 1;
      if (actualBedrooms > 3) actualBedrooms = 3;
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
    
    // Estimate square footage based on property type and bedrooms if not provided
    const squareFeet = patmaProperty.square_feet || patmaProperty.floor_area_sqft || patmaProperty.floor_area_sqm ? 
      (patmaProperty.square_feet || patmaProperty.floor_area_sqft || (patmaProperty.floor_area_sqm ? patmaProperty.floor_area_sqm * 10.764 : null)) :
      estimateSquareFootage(patmaProperty.property_type || '', patmaProperty.bedrooms || 0);
    
    // Generate property description if not provided
    let description = patmaProperty.description || '';
    
    // Add planning application description to the property description if available
    if (patmaProperty.planning_details?.description) {
      description += `\n\nPlanning application: ${patmaProperty.planning_details.description}`;
    } else if (patmaProperty.has_planning) {
      description += '\n\nThis property has a planning application.';
    }
    
    // Create investment highlights
    const investmentHighlights = {
      location: patmaProperty.location || patmaProperty.address || "Unknown",
      type: propertyType,
      features: patmaProperty.features ? patmaProperty.features.slice(0, 3).join(", ") : ""
    };
    
    // Handle planning details if available
    const property_details = patmaProperty.planning_details ? {
      market_demand: 'Medium', // Default value
      area_growth: 'Steady',  // Default value
      crime_rate: 'Low',      // Default value
      nearby_schools: 3,      // Default value
      energy_rating: 'C',     // Default value
      council_tax_band: 'D',  // Default value
      property_features: patmaProperty.features || [],
      planning_applications: patmaProperty.planning_details ? [{
        description: patmaProperty.planning_details.description || 'Planning application available',
        status: 'Unknown',
        date_submitted: patmaProperty.updated_at || new Date().toISOString()
      }] : []
    } : undefined;
    
    return {
      id: patmaProperty.id || `patma-${Math.random().toString(36).substr(2, 9)}`,
      address: patmaProperty.address || patmaProperty.location || "Unknown address",
      price: price,
      bedrooms: actualBedrooms,
      bedrooms_verified: bedroomsVerified,
      bathrooms: bathrooms,
      bathrooms_verified: bathroomsVerified,
      square_feet: squareFeet,
      square_feet_verified: true,
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
      investment_highlights: investmentHighlights,
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
      property_details,
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
        <div className="flex flex-col gap-6">
          {/* Filter Panel Toggle */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Property Search</h1>
            <Button
              variant="outline"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {isFilterPanelOpen ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {/* Filter Panel - Collapsible */}
          {isFilterPanelOpen && (
            <div className="w-full">
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onClear={handleClearFilters}
                onSearch={handleSearch}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="w-full">
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
                <CardDescription>
                  {properties.length} properties found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Spinner />
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No properties found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {properties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        onClick={() => handlePropertyClick(property)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {selectedProperty && (
          <PropertyProposalDialog
            property={selectedProperty}
            open={!!selectedProperty}
            onOpenChange={(open) => {
              if (!open) setSelectedProperty(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Invest;