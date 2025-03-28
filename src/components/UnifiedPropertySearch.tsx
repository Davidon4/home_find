import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { searchRightmoveProperties, MappedProperty } from "@/utils/rightmove-api";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  Home, 
  Search, 
  Filter, 
  ChevronDown, 
  Bed, 
  Bath, 
  SquareCode, 
  DollarSign,
  Info
} from "lucide-react";
import { UnifiedSearchParams } from "./PropertyCrawler/types";
import { PropertyListing } from "@/types/property";

interface UnifiedPropertySearchProps {
  onPropertiesFound: (properties: PropertyListing[]) => void;
  onSearchStart?: () => void;
  onSearchComplete?: () => void;
}

export const UnifiedPropertySearch = ({ 
  onPropertiesFound, 
  onSearchStart, 
  onSearchComplete 
}: UnifiedPropertySearchProps) => {
  const [params, setParams] = useState<UnifiedSearchParams>({
    searchTerm: "",
    location: "",
    propertyType: "",
    minPrice: "70000",
    maxPrice: "275000",
    minBeds: "2",
    maxBeds: "3",
    maxPages: 3,
    analysisThreshold: 65,
    searchMode: "rightmove"
  });
  
  const [loading, setLoading] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  
  const handleChange = (name: keyof UnifiedSearchParams, value: string | number) => {
    setParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let searchTerm = params.searchTerm.trim();
    if (!searchTerm && params.location) {
      searchTerm = params.location.trim();
    }
    
    if (!searchTerm) {
      toast.error("Please enter a search term or location");
      return;
    }
    
    // Always enforce our default constraints if empty
    const minPrice = params.minPrice || "70000";
    const maxPrice = params.maxPrice || "275000";
    const minBeds = params.minBeds || "2";
    const maxBeds = params.maxBeds || "3";
    
    setLoading(true);
    onSearchStart?.();

    try {
      console.log("Starting property search for:", searchTerm);
      console.log("Applying filters:", {
        price: `£${minPrice}-£${maxPrice}`,
        bedrooms: `${minBeds}-${maxBeds}`,
        propertyType: params.propertyType || "any"
      });
      
      const mappedProperties = await searchRightmoveProperties(searchTerm);
      
      const filteredProperties = mappedProperties.filter(property => {
        // Property type check
        if (params.propertyType && property.propertyType) {
          const propertyTypeFilter = params.propertyType.toLowerCase();
          const actualPropertyType = property.propertyType.toLowerCase();
          
          if (propertyTypeFilter && !actualPropertyType.includes(propertyTypeFilter)) {
            return false;
          }
        }
        
        // Price range check - strictly enforce our price range
        if (property.price < Number(minPrice)) return false;
        if (property.price > Number(maxPrice)) return false;
        
        // Bedroom count check - strictly require bedrooms to be in range
        if (!property.bedrooms) return false; // Must have bedroom data
        if (property.bedrooms < Number(minBeds)) return false;
        if (property.bedrooms > Number(maxBeds)) return false;
        
        return true;
      });
      
      console.log(`Found ${filteredProperties.length} properties matching all criteria`);
      
      const propertyListings = filteredProperties.map(property => {
        const rentalEstimate = property.rental_estimate || 
          calculateRentalEstimate(property.price, property.bedrooms, property.propertyType);
        
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
          source: 'rightmove',
          listing_url: property.url || '',
          created_at: property.dateAdded,
          updated_at: property.listedSince,
          roi_estimate: roiEstimate,
          rental_estimate: rentalEstimate,
          investment_highlights: {
            location: property.address,
            type: property.propertyType || '',
            features: Array.isArray(property.features) ? property.features.slice(0, 3).join(", ") : ""
          },
          investment_score: calculateInvestmentScore(property),
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
          price_history: { 
            dates: [], 
            prices: [] 
          },
          market_trends: {
            appreciation_rate: property.marketTrends?.appreciation_rate || 3.2,
            market_activity: property.marketTrends?.market_activity || "Moderate"
          },
          description: property.description,
          property_type: property.propertyType,
          agent: property.agent,
          latitude: property.location?.latitude,
          longitude: property.location?.longitude,
          property_details: property.propertyDetails
        };
      });
      
      onPropertiesFound(propertyListings);
      toast.success(`Found ${propertyListings.length} properties matching your criteria`);
    } catch (error) {
      console.error("Property search error:", error);
      toast.error(error instanceof Error ? error.message : "Error searching for properties");
      onPropertiesFound([]);
    } finally {
      setLoading(false);
      onSearchComplete?.();
    }
  };

  const calculateRentalEstimate = (price: number, bedrooms: number | null, propertyType: string): number => {
    if (!price) return 0;
    if (!bedrooms) bedrooms = 2;
    
    let baseRental = (price * 0.008) / 12;
    
    baseRental *= (1 + (bedrooms - 2) * 0.1);
    
    if (propertyType.toLowerCase().includes('flat') || propertyType.toLowerCase().includes('apartment')) {
      baseRental *= 1.1;
    } else if (propertyType.toLowerCase().includes('detached')) {
      baseRental *= 0.9;
    }
    
    return Math.round(baseRental);
  };

  const calculateROI = (price: number, monthlyRental: number): number => {
    if (!price || !monthlyRental) return 0;
    const annualRental = monthlyRental * 12;
    return (annualRental / price) * 100;
  };

  const calculateInvestmentScore = (property: MappedProperty): number => {
    let score = 70;
    
    if (property.bedrooms && property.bedrooms >= 3) score += 5;
    if (property.bathrooms && property.bathrooms >= 2) score += 5;
    if (Array.isArray(property.features) && property.features.length > 5) score += 5;
    if (property.price < 200000) score += 10;
    
    return Math.min(100, Math.max(0, score));
  };

  const clearFilters = () => {
    setParams(prev => ({
      ...prev,
      propertyType: "",
      minPrice: "70000",
      maxPrice: "275000",
      minBeds: "2",
      maxBeds: "3"
    }));
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 p-2 mb-4 bg-blue-50 text-blue-700 rounded-md">
        <Info className="h-5 w-5" />
        <p className="text-sm">
          Showing investment properties with 2-3 bedrooms between £70,000-£275,000.
        </p>
      </div>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search properties (address, postcode, area, etc.)"
            value={params.searchTerm}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Enter location (city, town, area)"
              value={params.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filters (2-3 beds, £70k-£275k)</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="flex items-center gap-1 text-sm"
            >
              <Filter className="h-4 w-4" />
              {filtersVisible ? "Hide Filters" : "Show Filters"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  filtersVisible ? "transform rotate-180" : ""
                }`}
              />
            </Button>
          </div>

          {filtersVisible && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 pb-2">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select 
                  value={params.propertyType} 
                  onValueChange={(value) => handleChange('propertyType', value)}
                >
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    <SelectItem value="detached">Detached</SelectItem>
                    <SelectItem value="semi-detached">Semi-detached</SelectItem>
                    <SelectItem value="terraced">Terraced</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="bungalow">Bungalow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="70000"
                      value={params.minPrice}
                      onChange={(e) => handleChange('minPrice', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="275000"
                      value={params.maxPrice}
                      onChange={(e) => handleChange('maxPrice', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="2"
                      value={params.minBeds}
                      onChange={(e) => handleChange('minBeds', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="3"
                      value={params.maxBeds}
                      onChange={(e) => handleChange('maxBeds', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Searching properties...
            </span>
          ) : (
            <span className="flex items-center">
              <Search className="mr-2 h-4 w-4" />
              Search Properties
            </span>
          )}
        </Button>
      </form>
    </div>
  );
};
