import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { DollarSign, Home, TrendingUp, Clock, LineChart, Search, XCircle, Filter, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { PropertySearch } from "@/components/PropertySearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MappedProperty } from "@/types/property-types";
import { searchProperties, Property, PropertySearchFilters } from "@/utils/backend-api";
import { UKProperty, searchDatabaseProperties } from "@/utils/propertyApi";
import { Session } from "@supabase/supabase-js";
import { PropertyProposalDialog } from "@/components/PropertyProposalDialog";

interface PropertyListing {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  image_url: string | null;
  roi_estimate: number | null;
  rental_estimate: number | null;
  investment_highlights: Record<string, string>;
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

const placeholderImages = [
  "https://images.unsplash.com/photo-1433832597046-4f10e10ac764",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b",
  "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb",
];

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
  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg" 
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
        <div className="absolute top-2 right-2 bg-background/90 px-2 py-1 rounded text-sm font-medium">
          {property.property_type || 'Property'}
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-semibold text-lg line-clamp-1">{property.address}</h3>
          <span className="font-bold text-lg">{formatCurrency(property.price)}</span>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="line-clamp-1">{property.address}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <span className="text-xs text-muted-foreground">Beds</span>
            <span className="font-medium">{property.bedrooms || 'N/A'}</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <span className="text-xs text-muted-foreground">Baths</span>
            <span className="font-medium">{property.bathrooms || 'N/A'}</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <span className="text-xs text-muted-foreground">Sq Ft</span>
            <span className="font-medium">{property.square_feet ? property.square_feet.toLocaleString() : 'N/A'}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col p-2 bg-green-50 dark:bg-green-950 rounded">
            <span className="text-xs text-muted-foreground">Est. Rental</span>
            <span className="font-medium">{property.rental_estimate ? formatCurrency(property.rental_estimate) + '/mo' : 'N/A'}</span>
          </div>
          <div className="flex flex-col p-2 bg-blue-50 dark:bg-blue-950 rounded">
            <span className="text-xs text-muted-foreground">Est. ROI</span>
            <span className="font-medium">{property.roi_estimate ? formatROI(property.roi_estimate) : 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Invest = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [session, setSession] = useState<Session | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = "";

  const mapToPropertyListing = (property: Property): PropertyListing => {
    const rentalEstimate = property.rental_estimate || 
      calculateRentalEstimate(property.price, property.bedrooms, property.property_type || '');
    const roiEstimate = property.roi_estimate || 
      calculateROI(property.price, rentalEstimate);
    
    return {
      id: property.id,
      address: property.address,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      square_feet: property.square_feet,
      image_url: property.image_url,
      roi_estimate: roiEstimate,
      rental_estimate: rentalEstimate,
      investment_highlights: {
        location: property.address,
        type: property.property_type || '',
        features: Array.isArray(property.property_details?.property_features) ? property.property_details.property_features.slice(0, 3).join(", ") : ""
      },
      investment_score: calculateInvestmentScore(property),
      created_at: property.created_at,
      updated_at: property.updated_at,
      source: "rightmove",
      listing_url: property.rightmove_url || "#",
      description: property.description,
      property_type: property.property_type,
      agent: property.agent,
      ai_analysis: {
        summary: "Analysis not available for this property",
        recommendation: "Consider researching the area further"
      },
      market_analysis: {
        trend: "Market data not available",
        demand: "Unknown"
      },
      bidding_recommendation: property.price * 0.95,
      last_sold_price: null,
      price_history: null,
      latitude: property.location.latitude,
      longitude: property.location.longitude,
      property_details: {
        market_demand: property.property_details?.market_demand || "Medium",
        area_growth: property.property_details?.area_growth || "3.5%",
        crime_rate: property.property_details?.crime_rate || "Average",
        nearby_schools: property.property_details?.nearby_schools || 0,
        energy_rating: property.property_details?.energy_rating || "Unknown",
        council_tax_band: property.property_details?.council_tax_band || "Unknown",
        property_features: property.property_details?.property_features || []
      },
      market_trends: property.market_trends ? 
        { 
          appreciation_rate: property.market_trends.appreciation_rate || 3.2,
          market_activity: property.market_trends.market_activity || "Moderate" 
        } : 
        {
          appreciation_rate: 3.2,
          market_activity: "Moderate"
        }
    };
  };

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

  const calculateInvestmentScore = (property: Property): number => {
    let score = 70;
    
    if (property.bedrooms && property.bedrooms >= 3) score += 5;
    if (property.bathrooms && property.bathrooms >= 2) score += 5;
    if (property.square_feet && property.square_feet > 1000) score += 5;
    if (Array.isArray(property.property_details?.property_features) && property.property_details.property_features.length > 5) score += 5;
    if (property.price < 200000) score += 10;
    
    return Math.min(100, Math.max(0, score));
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const properties = await searchProperties("investment properties");
      const formattedProperties = properties.map(mapToPropertyListing);
      setProperties(formattedProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialProperties = async () => {
    setLoading(true);
    try {
      const defaultSearch = "investment properties";
      console.log("Fetching initial investment properties...");
      toast.info("Loading investment properties...");
      
      const properties = await searchProperties(defaultSearch);
      
      if (properties.length > 0) {
        const mappedProperties = properties.map(mapToPropertyListing);
        setProperties(mappedProperties);
        toast.success(`Loaded ${mappedProperties.length} investment properties`);
      } else {
        console.log("No initial properties found");
        toast.info("No properties found. Try searching with specific criteria.");
        setProperties([]);
      }
    } catch (error) {
      console.error("Error fetching initial properties:", error);
      toast.error("Error loading properties. Please try a manual search.");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const searchForProperties = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    setSearchParams({ searchTerm });
    console.log("Searching properties for:", searchTerm);

    try {
      const filters: PropertySearchFilters = {};
      
      const properties = await searchProperties(searchTerm, filters);
      
      if (properties.length === 0) {
        toast.info("No properties found. Try a different search term.");
        setProperties([]);
      } else {
        const mappedProperties = properties.map(mapToPropertyListing);
        setProperties(mappedProperties);
        toast.success(`Found ${mappedProperties.length} properties`);
      }
    } catch (error) {
      console.error("Error searching properties:", error);
      toast.error("Error searching properties. Please try again.");
      setProperties([]);
    } finally {
      setLoading(false);
      setSearchPerformed(true);
      setActiveTab("results");
    }
  };

  const handleSearch = (searchCriteria: Record<string, string>) => {
    setLoading(true);
    setSearchParams(searchCriteria);
    
    let searchQuery = "";
    
    if (searchCriteria.location) {
      searchQuery += searchCriteria.location;
    }
    
    if (searchCriteria.propertyType) {
      searchQuery += " " + searchCriteria.propertyType;
    }
    
    if (searchCriteria.bedrooms) {
      searchQuery += " " + searchCriteria.bedrooms + " bedroom";
    }
    
    searchForProperties(searchQuery.trim());
  };

  const handlePropertiesFound = async (foundProperties: MappedProperty[]) => {
    // Map the found properties to our PropertyListing format
    console.log("Found Properties:", foundProperties);
    
    try {
      setLoading(true);
      
      const propertyPromises = foundProperties.map(async (prop: MappedProperty) => {
        const rentalEstimate = prop.rental_estimate || 
          calculateRentalEstimate(prop.price, prop.bedrooms, prop.propertyType || '');
        
        const roiEstimate = prop.roi_estimate || 
          calculateROI(prop.price, rentalEstimate);
        
        return {
          id: prop.id,
          address: prop.address,
          price: prop.price,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          square_feet: prop.square_feet,
          image_url: prop.image_url,
          roi_estimate: roiEstimate,
          rental_estimate: rentalEstimate,
          investment_highlights: {
            location: prop.address,
            type: prop.propertyType || '',
            features: Array.isArray(prop.features) ? prop.features.slice(0, 3).join(", ") : ""
          },
          investment_score: 70,
          created_at: prop.dateAdded || new Date().toISOString(),
          updated_at: prop.listedSince || new Date().toISOString(),
          source: "rightmove",
          listing_url: prop.url || "#",
          description: prop.description,
          property_type: prop.propertyType,
          agent: prop.agent,
          ai_analysis: {
            summary: "Analysis not available for this property",
            recommendation: "Consider researching the area further"
          },
          market_analysis: {
            trend: "Market data not available",
            demand: "Unknown"
          },
          bidding_recommendation: prop.price * 0.95,
          last_sold_price: null,
          price_history: null,
          latitude: prop.location?.latitude,
          longitude: prop.location?.longitude,
          property_details: {
            market_demand: "Medium",
            area_growth: "3.5%",
            crime_rate: "Average",
            nearby_schools: 0,
            energy_rating: "Unknown",
            council_tax_band: "Unknown",
            property_features: []
          },
          market_trends: {
            appreciation_rate: 3.2,
            market_activity: "Moderate"
          }
        };
      });
      
      // Wait for all the property mappings to complete
      const resolvedProperties = await Promise.all(propertyPromises);
      
      setProperties(resolvedProperties);
      setSearchPerformed(true);
      setActiveTab("results");
    } catch (error) {
      console.error("Error processing properties:", error);
      toast.error("An error occurred while processing properties");
    } finally {
      setLoading(false);
    }
  };

  const handleClearResults = () => {
    setProperties([]);
    setSearchPerformed(false);
    setActiveTab("search");
  };

  const handlePropertyClick = (property: PropertyListing) => {
    // Simply set the selected property and open dialog
    setSelectedProperty(property);
    setIsProposalDialogOpen(true);
  };

  useEffect(() => {
    // Automatically fetch properties when the component mounts
    fetchInitialProperties();
    setSearchPerformed(true); // Mark search as performed so results are displayed
    
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    
    checkSession();
  }, []);

  // Helper function to map UKProperty to PropertyListing
  const mapUKPropertyToListing = (ukProperty: UKProperty): PropertyListing => {
    const rentalEstimate = calculateRentalEstimate(
      ukProperty.price, 
      ukProperty.bedrooms,
      ukProperty.property_type || ''
    );
    
    return {
      id: ukProperty.id,
      address: ukProperty.address,
      price: ukProperty.price,
      bedrooms: ukProperty.bedrooms,
      bathrooms: ukProperty.bathrooms,
      square_feet: ukProperty.square_feet,
      image_url: ukProperty.image_url,
      roi_estimate: calculateROI(ukProperty.price, rentalEstimate),
      rental_estimate: rentalEstimate,
      investment_highlights: {
        location: ukProperty.address,
        type: ukProperty.property_type || '',
        features: ''
      },
      investment_score: 70, // Default score
      created_at: ukProperty.created_at,
      updated_at: ukProperty.updated_at,
      source: "uk_property_api",
      listing_url: "#",
      description: ukProperty.description,
      property_type: ukProperty.property_type,
      agent: ukProperty.agent,
      ai_analysis: {
        summary: "Analysis not available for this property",
        recommendation: "Consider researching the area further"
      },
      market_analysis: {
        trend: "Market data not available",
        demand: "Unknown"
      },
      bidding_recommendation: ukProperty.price * 0.95,
      last_sold_price: null,
      price_history: null,
      latitude: ukProperty.latitude,
      longitude: ukProperty.longitude,
      property_details: {
        market_demand: ukProperty.property_details?.market_demand || "Medium",
        area_growth: ukProperty.property_details?.area_growth || "3.5%",
        crime_rate: ukProperty.property_details?.crime_rate || "Average",
        nearby_schools: ukProperty.property_details?.nearby_schools || 0,
        energy_rating: ukProperty.property_details?.energy_rating || "Unknown",
        council_tax_band: ukProperty.property_details?.council_tax_band || "Unknown",
        property_features: ukProperty.property_details?.property_features || []
      },
      market_trends: {
        appreciation_rate: 3.2,
        market_activity: "Moderate"
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Smart Investment Properties</h1>
          <p className="text-lg text-gray-600">AI-powered analysis and bidding recommendations for high-potential investments</p>
        </div>

        <div className="mb-8">
          <PropertySearch 
            onPropertiesFound={(properties: MappedProperty[]) => handlePropertiesFound(properties)}
            onSearchStart={() => setLoading(true)}
            onSearchComplete={() => setLoading(false)}
          />
        </div>

        {properties.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearResults}
              className="flex items-center gap-1"
            >
              <XCircle className="h-4 w-4" />
              Clear Results
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : properties.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => {
              const bidRec = getBidRecommendation(property);
              const addressParts = property.address.split(',');
              const city = addressParts[1]?.trim() || '';
              const stateZip = addressParts[2]?.trim().split(' ') || ['', ''];
              const state = stateZip[0] || '';
              const postalCode = stateZip[1] || '';
              
              return (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  onClick={() => handlePropertyClick(property)}
                />
              );
            })}
          </div>
        ) : searchPerformed ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or generate some listings</p>
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start exploring investment properties</h3>
            <p className="text-gray-600 mb-4">Search for existing properties or generate new listings</p>
          </div>
        )}

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