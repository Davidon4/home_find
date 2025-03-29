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
  searchZooplaProperties
} from "@/utils/piloterr-api";
import { MappedProperty } from "@/types/property-types";
import { 
  MapPin, 
  Search, 
  ChevronDown, 
  SlidersHorizontal,
  Info
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
  const [searchMode, setSearchMode] = useState<"zoopla">("zoopla");
  const [radiusMiles, setRadiusMiles] = useState("1");
  const [lastApiCall, setLastApiCall] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
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
  const MAX_SEARCHES_PER_SESSION = 5; // Reduced for Piloterr API credit conservation

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic input validation
    const input = searchTerm.trim();
    if (!input) {
      toast.error("Please enter a search term");
      return;
    }
    
    // If already searched with same term and has results, don't search again to save API credits
    if (hasSearched && !loading && searchTerm.trim() === input) {
      toast.info("Using existing search results to save API credits");
      return;
    }
    
    // All searches now go through Zoopla API
    setSearchTerm(input);
    handleZooplaSearch(input);
  };

  const handleZooplaSearch = async (query: string) => {
    // Check session search limit
    if (searchCountRef.current >= MAX_SEARCHES_PER_SESSION) {
      toast.error(`You've reached the maximum number of searches (${MAX_SEARCHES_PER_SESSION}) for this session to save API credits. Please refresh the page to continue.`);
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
      // Use Zoopla Piloterr API
      console.log("Starting Zoopla search for:", query);
      
      // Search using Zoopla API
      const properties = await searchZooplaProperties(query);
      
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
      
      console.log(`Found ${filteredProperties.length} properties from Zoopla search`);
      onPropertiesFound(filteredProperties);
      setHasSearched(true);
      
      if (filteredProperties.length === 0) {
        toast.info("No properties found matching your search. Try a different search term.");
      } else {
        toast.success(`Found ${filteredProperties.length} properties`);
      }
      
      lastSearchRef.current = now;
      searchCountRef.current += 1;
    } catch (error) {
      console.error("Zoopla search error:", error);
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

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 p-2 mb-4 bg-blue-50 text-blue-700 rounded-md">
        <Info className="h-5 w-5" />
        <p className="text-sm">
          Searching properties via Zoopla API (limited to 50 credits)
        </p>
      </div>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search properties (address, postcode, area, etc.)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <SlidersHorizontal className="h-4 w-4" />
            {filtersVisible ? "Hide Filters" : "Show Filters"}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                filtersVisible ? "transform rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        {filtersVisible && (
          <FilterPanel 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onClear={clearFilters} 
          />
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Searching properties...
            </span>
          ) : (
            <span className="flex items-center">
              <Search className="mr-2 h-4 w-4" />
              Search Zoopla Properties
            </span>
          )}
        </Button>
      </form>
    </div>
  );
};
