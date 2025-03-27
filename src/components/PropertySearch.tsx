import { useState, useRef } from "react";
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
// Commenting out PropertyData imports
// import { 
//   searchDatabaseProperties, 
//   searchPropertyData, 
//   PropertyDataSearchParams,
//   UKProperty,
//   getPropertyDataApiKey
// } from "@/utils/propertyApi";
// Import Zoopla API functions
import { 
  searchRightmoveProperties, 
  MappedProperty 
} from "@/utils/rightmove-api";
import { 
  MapPin, 
  Search, 
  ChevronDown, 
  SlidersHorizontal
} from "lucide-react";
import { FilterPanel, FilterState } from "./FilterPanel";

interface PropertySearchProps {
  // Accept either type, but we're only using MappedProperty for now
  onPropertiesFound: (properties: MappedProperty[] /*| UKProperty[]*/) => void;
  onSearchStart?: () => void;
  onSearchComplete?: () => void;
}

export const PropertySearch = ({ onPropertiesFound, onSearchStart, onSearchComplete }: PropertySearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchMode, setSearchMode] = useState<"rightmove">("rightmove");
  const [radiusMiles, setRadiusMiles] = useState("1");
  const [lastApiCall, setLastApiCall] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
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
    features: []
  });

  // Rate limiting constants
  const RATE_LIMIT_MS = 2000; // 2 seconds between searches
  const lastSearchRef = useRef<number>(0);
  const searchCountRef = useRef<number>(0);
  const MAX_SEARCHES_PER_SESSION = 10; // Increased to 10 for Rightmove

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic input validation
    const input = searchTerm.trim();
    if (!input) {
      toast.error("Please enter a search term");
      return;
    }
    
    // All searches now go through Rightmove API
    setSearchTerm(input);
    handleRightmoveSearch(input);
  };

  const handleRightmoveSearch = async (query: string) => {
    // Check session search limit
    if (searchCountRef.current >= MAX_SEARCHES_PER_SESSION) {
      toast.error(`You've reached the maximum number of searches (${MAX_SEARCHES_PER_SESSION}) for this session. Please refresh the page to continue.`);
      return;
    }

    // Check rate limit
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchRef.current;
    
    if (timeSinceLastSearch < RATE_LIMIT_MS) {
      const remainingTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastSearch) / 1000);
      toast.error(`Please wait ${remainingTime} second${remainingTime !== 1 ? 's' : ''} before searching again`);
      return;
    }

    setLoading(true);
    onSearchStart?.();

    try {
      // Option 1: Use Rightmove API
      console.log("Starting Rightmove search for:", query);
      
      // Search using Rightmove API
      const properties = await searchRightmoveProperties(query);
      
      // Apply filters to the results if needed
      const filteredProperties = properties.filter(property => {
        if (filters.propertyType && property.propertyType && 
            !property.propertyType.toLowerCase().includes(filters.propertyType.toLowerCase())) {
          return false;
        }
        if (filters.minPrice && property.price < Number(filters.minPrice)) return false;
        if (filters.maxPrice && property.price > Number(filters.maxPrice)) return false;
        if (filters.minBedrooms && property.bedrooms && property.bedrooms < Number(filters.minBedrooms)) return false;
        if (filters.maxBedrooms && property.bedrooms && property.bedrooms > Number(filters.maxBedrooms)) return false;
        return true;
      });
      
      console.log(`Found ${filteredProperties.length} properties from Rightmove search`);
      onPropertiesFound(filteredProperties);
      
      if (filteredProperties.length === 0) {
        toast.info("No properties found matching your search. Try a different search term.");
      } else {
        toast.success(`Found ${filteredProperties.length} properties`);
      }
      
      lastSearchRef.current = now;
      searchCountRef.current += 1;
    } catch (error) {
      console.error("Rightmove search error:", error);
      toast.error(error instanceof Error ? error.message : "Error searching for properties");
      onPropertiesFound([]);
    } finally {
      setLoading(false);
      onSearchComplete?.();
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
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
      features: []
    });
  };

  /* PropertyData API search functions (commented out to avoid exceeding limits)
  const handlePropertyDataSearch = async () => {
    // Check session search limit
    if (searchCountRef.current >= MAX_SEARCHES_PER_SESSION) {
      toast.error(`You've reached the maximum number of searches (${MAX_SEARCHES_PER_SESSION}) for this session. Please refresh the page to continue.`);
      return;
    }

    // Check rate limit
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchRef.current;
    
    if (timeSinceLastSearch < RATE_LIMIT_MS) {
      const remainingTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastSearch) / 1000);
      toast.error(`Please wait ${remainingTime} second${remainingTime !== 1 ? 's' : ''} before searching again`);
      return;
    }

    setLoading(true);
    onSearchStart?.();
    
    try {
      const apiKey = getPropertyDataApiKey();
      
      if (!apiKey) {
        toast.error("PropertyData API key is not configured in environment variables");
        return;
      }
      
      console.log("Starting PropertyData API search for:", location);
      
      const params: PropertyDataSearchParams = {
        key: apiKey,
        location,
        radius_miles: radiusMiles,
        page_size: "20"
      };
      
      // Add filters to params
      if (filters.propertyType) params.property_type = filters.propertyType;
      if (filters.minPrice) params.min_price = filters.minPrice;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.minBedrooms) params.min_beds = filters.minBedrooms;
      if (filters.maxBedrooms) params.max_beds = filters.maxBedrooms;
      
      const result = await searchPropertyData(params);
      
      console.log(`Found ${result.data.length} properties from PropertyData.co.uk API`);
      
      if (result.data.length === 0) {
        toast.info("No properties found. Try a different location or wider search radius.");
      } else {
        toast.success(`Found ${result.data.length} properties`);
      }
      
      onPropertiesFound(result.data);
      lastSearchRef.current = now;
      searchCountRef.current += 1;
    } catch (error) {
      console.error("PropertyData API search error:", error);
      toast.error(error instanceof Error ? error.message : "Error searching for properties");
      onPropertiesFound([]);
    } finally {
      setLoading(false);
      onSearchComplete?.();
    }
  };
  
  const handleDatabaseSearch = async () => {
    // Check session search limit
    if (searchCountRef.current >= MAX_SEARCHES_PER_SESSION) {
      toast.error(`You've reached the maximum number of searches (${MAX_SEARCHES_PER_SESSION}) for this session. Please refresh the page to continue.`);
      return;
    }

    // Check rate limit
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchRef.current;
    
    if (timeSinceLastSearch < RATE_LIMIT_MS) {
      const remainingTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastSearch) / 1000);
      toast.error(`Please wait ${remainingTime} second${remainingTime !== 1 ? 's' : ''} before searching again`);
      return;
    }

    setLoading(true);
    onSearchStart?.();

    try {
      console.log("Starting database search for:", searchTerm);
      const properties = await searchDatabaseProperties(searchTerm);
      
      console.log(`Found ${properties.length} properties from database`);
      
      if (properties.length === 0) {
        toast.info("No properties found. Try a different search term.");
      } else {
        toast.success(`Found ${properties.length} properties`);
      }
      
      onPropertiesFound(properties);
      lastSearchRef.current = now;
      searchCountRef.current += 1;
    } catch (error) {
      console.error("Database search error:", error);
      toast.error(error instanceof Error ? error.message : "Error searching database");
      onPropertiesFound([]);
    } finally {
      setLoading(false);
      onSearchComplete?.();
    }
  };
  */

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/3 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by address, postcode, price, or bedrooms"
            value={searchTerm || location}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              setLocation(value);
            }}
            className="pl-10"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter a location of your choice
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Advanced Filters</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="flex items-center gap-1 text-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  filtersVisible ? "transform rotate-180" : ""
                }`}
              />
            </Button>
          </div>

          {filtersVisible && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="radiusMiles">Search Radius (miles) - for postcode search</Label>
                <Select value={radiusMiles} onValueChange={setRadiusMiles}>
                  <SelectTrigger id="radiusMiles">
                    <SelectValue placeholder="Radius in miles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.25">¼ mile</SelectItem>
                    <SelectItem value="0.5">½ mile</SelectItem>
                    <SelectItem value="1">1 mile</SelectItem>
                    <SelectItem value="2">2 miles</SelectItem>
                    <SelectItem value="5">5 miles</SelectItem>
                    <SelectItem value="10">10 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onClear={clearFilters}
              />
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
