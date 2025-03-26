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
import { searchZooplaProperties, MappedProperty } from "@/utils/zoopla-api";
// Import PropertyData API (commented out to avoid exceeding limits)
// import { searchProperties, searchDatabaseProperties, PropertySearchParams } from "@/utils/propertyApi";
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
  LineChart
} from "lucide-react";
import { CrawlerProgress } from "./PropertyCrawler/CrawlerProgress";
import { UnifiedSearchParams, CrawlerParams } from "./PropertyCrawler/types";
import { PropertyListing } from "@/types/property";
import { analyzeProperty } from "@/utils/openai-api";
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
    searchMode: "zoopla"
  });
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  const handleChange = (name: keyof UnifiedSearchParams, value: string | number) => {
    setParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApiSearch = async () => {
    if (!params.location.trim() && !params.searchTerm.trim()) {
      toast.error("Please enter a location or search term");
      return;
    }

    setLoading(true);
    onSearchStart?.();

    try {
      const searchTerm = params.location.trim() || params.searchTerm.trim();
      console.log("Starting Zoopla API search for:", searchTerm);
      
      const mappedProperties = await searchZooplaProperties(searchTerm);
      
      const filteredProperties = mappedProperties.filter(property => {
        if (params.propertyType && property.propertyType !== params.propertyType) return false;
        if (params.minPrice && property.price < Number(params.minPrice)) return false;
        if (params.maxPrice && property.price > Number(params.maxPrice)) return false;
        if (params.minBeds && property.bedrooms && property.bedrooms < Number(params.minBeds)) return false;
        if (params.maxBeds && property.bedrooms && property.bedrooms > Number(params.maxBeds)) return false;
        return true;
      });
      
      console.log(`Found ${filteredProperties.length} properties from Zoopla search`);
      
      // Process properties with OpenAI analysis
      try {
        // We'll use Promise.allSettled instead of Promise.all to handle partial failures
        const propertyAnalysisResults = await Promise.allSettled(
          filteredProperties.map(async property => {
            // Get AI analysis for the property
            const analysis = await analyzeProperty(property);
            
            return {
              id: property.id,
              address: property.address,
              price: property.price,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              square_feet: property.square_feet,
              image_url: property.image_url,
              source: 'zoopla',
              listing_url: property.url || '',
              created_at: property.dateAdded,
              updated_at: property.listedSince,
              roi_estimate: analysis.roi_estimate,
              rental_estimate: analysis.rental_estimate,
              investment_highlights: analysis.investment_highlights,
              investment_score: analysis.investment_score,
              ai_analysis: {
                summary: analysis.summary,
                recommendation: analysis.recommendation
              },
              market_analysis: analysis.market_analysis,
              bidding_recommendation: analysis.bidding_recommendation,
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
          })
        );
        
        // Filter out any properties where the AI analysis failed
        const propertyListings = propertyAnalysisResults
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<PropertyListing>).value);
        
        if (propertyListings.length === 0) {
          throw new Error("OpenAI analysis failed for all properties. Please check your OpenAI API key configuration.");
        }
        
        if (propertyListings.length < filteredProperties.length) {
          toast.warning(`OpenAI analysis failed for ${filteredProperties.length - propertyListings.length} properties. Showing ${propertyListings.length} successfully analyzed properties.`);
        }
        
        onPropertiesFound(propertyListings);
        toast.success(`Found ${propertyListings.length} properties via Zoopla with OpenAI analysis`);
      } catch (error) {
        console.error("OpenAI analysis error:", error);
        toast.error(`OpenAI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        onPropertiesFound([]);
      }
    } catch (error) {
      console.error("Zoopla API search error:", error);
      toast.error(error instanceof Error ? error.message : "Error searching for properties");
      onPropertiesFound([]);
    } finally {
      setLoading(false);
      onSearchComplete?.();
    }
  };

  const handleCrawlerSearch = async () => {
    setLoading(true);
    setProgress(0);
    onSearchStart?.();
    
    try {
      toast.info("Starting property crawler. This may take a few minutes...");
      
      const interval = setInterval(() => {
        setProgress(prev => {
          const nextProgress = prev + (90 - prev) * 0.1;
          return prev < 90 ? nextProgress : prev;
        });
      }, 1000);
      
      const crawlerParams: CrawlerParams = {
        city: params.location || params.searchTerm,
        maxPages: params.maxPages,
        minBeds: parseInt(params.minBeds) || 2,
        maxPrice: parseInt(params.maxPrice) || 500000,
        analysisThreshold: params.analysisThreshold
      };
      
      const { data, error } = await supabase.functions.invoke('zoopla-crawler', {
        body: crawlerParams
      });
      
      clearInterval(interval);
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.success) {
        setProgress(100);
        toast.success(`Found ${data.propertiesFound} high-value properties.`);
        
        const filters: Record<string, string> = {};
        if (params.propertyType) filters.propertyType = params.propertyType;
        if (params.minPrice) filters.minPrice = params.minPrice;
        if (params.maxPrice) filters.maxPrice = params.maxPrice;
        if (params.minBeds) filters.minBeds = params.minBeds;
        if (params.maxBeds) filters.maxBeds = params.maxBeds;
        
        const zooplaProperties = await searchZooplaProperties('');
        
        try {
          // Map Zoopla properties to PropertyListing format with OpenAI analysis
          // Using Promise.allSettled to handle partial failures
          const propertyAnalysisResults = await Promise.allSettled(
            zooplaProperties.map(async property => {
              // Get AI analysis for the property
              const analysis = await analyzeProperty(property);
              
              return {
                id: property.id,
                address: property.address,
                price: property.price,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                square_feet: property.square_feet,
                image_url: property.image_url,
                source: 'zoopla',
                listing_url: property.url || '',
                created_at: property.dateAdded || new Date().toISOString(),
                updated_at: property.listedSince || new Date().toISOString(),
                roi_estimate: analysis.roi_estimate,
                rental_estimate: analysis.rental_estimate,
                investment_highlights: analysis.investment_highlights,
                investment_score: analysis.investment_score,
                ai_analysis: {
                  summary: analysis.summary,
                  recommendation: analysis.recommendation
                },
                market_analysis: analysis.market_analysis,
                bidding_recommendation: analysis.bidding_recommendation,
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
            })
          );
          
          // Filter out any properties where the AI analysis failed
          const propertyListings = propertyAnalysisResults
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<PropertyListing>).value);
          
          if (propertyListings.length === 0) {
            throw new Error("OpenAI analysis failed for all properties. Please check your OpenAI API key configuration.");
          }
          
          if (propertyListings.length < zooplaProperties.length) {
            toast.warning(`OpenAI analysis failed for ${zooplaProperties.length - propertyListings.length} properties. Showing ${propertyListings.length} successfully analyzed properties.`);
          }
          
          onPropertiesFound(propertyListings);
          toast.success(`Found ${propertyListings.length} properties with OpenAI analysis`);
        } catch (error) {
          console.error("OpenAI analysis error:", error);
          toast.error(`OpenAI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`);
          onPropertiesFound([]);
        }
      } else {
        throw new Error(data.error || "Failed to crawl properties");
      }
    } catch (error) {
      console.error("Crawler error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to run property crawler");
      onPropertiesFound([]);
    } finally {
      setLoading(false);
      onSearchComplete?.();
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    switch(params.searchMode) {
      case "zoopla":
        handleApiSearch();
        break;
      case "crawler":
        handleCrawlerSearch();
        break;
      default:
        handleApiSearch();
        break;
    }
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
        <div className="flex flex-col gap-2 mb-2">
          <Label className="font-medium">Search Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={params.searchMode === "zoopla" ? "default" : "outline"}
              onClick={() => handleChange('searchMode', "zoopla")}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              Zoopla
            </Button>
            <Button
              type="button"
              variant={params.searchMode === "crawler" ? "default" : "outline"}
              onClick={() => handleChange('searchMode', "crawler")}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <LineChart className="h-4 w-4" />
              Crawler
            </Button>
          </div>
        </div>

        {params.searchMode === "zoopla" && (
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
        )}

        {(params.searchMode === "zoopla" || params.searchMode === "crawler") && (
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

            {params.searchMode === "crawler" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-pages">Max Pages to Crawl</Label>
                  <Select
                    value={params.maxPages.toString()}
                    onValueChange={(value) => handleChange('maxPages', parseInt(value))}
                  >
                    <SelectTrigger id="max-pages">
                      <SelectValue placeholder="Pages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 page (~25 listings)</SelectItem>
                      <SelectItem value="2">2 pages (~50 listings)</SelectItem>
                      <SelectItem value="3">3 pages (~75 listings)</SelectItem>
                      <SelectItem value="5">5 pages (~125 listings)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Quality Threshold</Label>
                  <Select
                    value={params.analysisThreshold.toString()}
                    onValueChange={(value) => handleChange('analysisThreshold', parseInt(value))}
                  >
                    <SelectTrigger id="threshold">
                      <SelectValue placeholder="Threshold" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">Above average (60+)</SelectItem>
                      <SelectItem value="65">Good (65+)</SelectItem>
                      <SelectItem value="70">Very good (70+)</SelectItem>
                      <SelectItem value="75">Excellent (75+)</SelectItem>
                      <SelectItem value="80">Outstanding (80+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

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
                      <SelectItem value="any">Any type</SelectItem>
                      <SelectItem value="Detached">Detached</SelectItem>
                      <SelectItem value="Semi-detached">Semi-detached</SelectItem>
                      <SelectItem value="Terraced">Terraced</SelectItem>
                      <SelectItem value="Flat">Flat</SelectItem>
                      <SelectItem value="Bungalow">Bungalow</SelectItem>
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
        )}

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
        
        {params.searchMode === "crawler" && (
          <CrawlerProgress 
            isLoading={loading}
            progress={progress}
          />
        )}
      </form>
    </div>
  );
};
