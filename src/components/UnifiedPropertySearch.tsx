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
  DollarSign
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
    minPrice: "",
    maxPrice: "",
    minBeds: "",
    maxBeds: "",
    maxPages: 3,
    analysisThreshold: 65,
    searchMode: "rightmove"
  });
  
  const [loading, setLoading] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  const handleChange = (name: keyof UnifiedSearchParams, value: string | number) => {
    setParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!params.location.trim() && !params.searchTerm.trim()) {
      toast.error("Please enter a location or search term");
      return;
    }

    setLoading(true);
    onSearchStart?.();

    try {
      const searchTerm = params.location.trim() || params.searchTerm.trim();
      console.log("Starting Rightmove API search for:", searchTerm);
      
      const mappedProperties = await searchRightmoveProperties(searchTerm);
      
      const filteredProperties = mappedProperties.filter(property => {
        // For property type, check if the type contains our search term (case insensitive)
        if (params.propertyType && property.propertyType && 
            !property.propertyType.toLowerCase().includes(params.propertyType.toLowerCase())) {
          return false;
        }
        
        if (params.minPrice && property.price < Number(params.minPrice)) return false;
        if (params.maxPrice && property.price > Number(params.maxPrice)) return false;
        if (params.minBeds && property.bedrooms && property.bedrooms < Number(params.minBeds)) return false;
        if (params.maxBeds && property.bedrooms && property.bedrooms > Number(params.maxBeds)) return false;
        return true;
      });
      
      console.log(`Found ${filteredProperties.length} properties from Rightmove search`);
      
      // Map properties to PropertyListing format without OpenAI analysis
      const propertyListings = filteredProperties.map(property => {
        // Calculate rental estimate based on property details
        const rentalEstimate = property.rental_estimate || 
          calculateRentalEstimate(property.price, property.bedrooms, property.propertyType);
        
        // Calculate ROI based on price and rental estimate
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
      toast.success(`Found ${propertyListings.length} properties via Rightmove search`);
    } catch (error) {
      console.error("Rightmove API search error:", error);
      toast.error(error instanceof Error ? error.message : "Error searching for properties");
      onPropertiesFound([]);
    } finally {
      setLoading(false);
      onSearchComplete?.();
    }
  };

  // Helper functions for property calculations
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

  const calculateInvestmentScore = (property: MappedProperty): number => {
    let score = 70;
    
    if (property.bedrooms && property.bedrooms >= 3) score += 5;
    if (property.bathrooms && property.bathrooms >= 2) score += 5;
    if (property.square_feet && property.square_feet > 1000) score += 5;
    if (Array.isArray(property.features) && property.features.length > 5) score += 5;
    if (property.price < 200000) score += 10;
    
    return Math.min(100, Math.max(0, score));
  };

  const clearFilters = () => {
    setParams(prev => ({
      ...prev,
      propertyType: "",
      minPrice: "",
      maxPrice: "",
      minBeds: "",
      maxBeds: ""
    }));
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search properties (address, price, bedrooms, etc.)"
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
              placeholder="Enter location (e.g. London, Manchester)"
              value={params.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Search Filters</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="flex items-center gap-1 text-sm"
            >
              <Filter className="h-4 w-4" />
              Filters
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
                    <SelectItem value="detached h">Detached</SelectItem>
                    <SelectItem value="semi-detached h">Semi-detached</SelectItem>
                    <SelectItem value="terraced h">Terraced</SelectItem>
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
                      placeholder="Min"
                      value={params.minPrice}
                      onChange={(e) => handleChange('minPrice', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="Max"
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
                      placeholder="Min"
                      value={params.minBeds}
                      onChange={(e) => handleChange('minBeds', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="Max"
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
              Searching...
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
