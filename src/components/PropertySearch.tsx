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
// Import Zoopla API functions
import { searchProperties, Property, PropertySearchFilters } from "@/utils/backend-api";
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic input validation
    const input = searchTerm.trim();
    if (!input) {
      toast.error("Please enter a search term");
      return;
    }
    
    // If already searched with same term and has results, don't search again to save API credits
    if (hasSearched && !loading && searchTerm.trim() === input) {
      toast.info("Using existing search results");
      return;
    }
    
    // Close the filter panel when search is clicked
    setFiltersVisible(false);
    
    setSearchTerm(input);
    setLoading(true);
    onSearchStart?.();

    try {
      console.log("Starting property search for:", input);
      
      // Log filters being applied
      console.log("Applying filters:", {
        location: location,
        propertyType: filters.propertyType || "any",
        price: `£${filters.minPrice || "0"}-£${filters.maxPrice || "unlimited"}`,
        bedrooms: `${filters.minBedrooms || "any"}-${filters.maxBedrooms || "any"}`,
      });

      // Create filters object
      const searchFilters: PropertySearchFilters = {
        location: location,
        propertyType: filters.propertyType,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        minBedrooms: filters.minBedrooms ? Number(filters.minBedrooms) : undefined,
        maxBedrooms: filters.maxBedrooms ? Number(filters.maxBedrooms) : undefined,
      };

      // Call the updated API function
      const properties = await searchProperties(input, searchFilters) as unknown as MappedProperty[];
      
      console.log(`Found ${properties.length} properties`);
      onPropertiesFound(properties);
      setHasSearched(true);
      
      if (properties.length === 0) {
        toast.info("No properties found matching your search. Try a different search term.");
      } else {
        toast.success(`Found ${properties.length} properties`);
      }

      // Update rate limit tracking
      lastSearchRef.current = Date.now();
      searchCountRef.current += 1;
    } catch (error) {
      console.error("Error searching properties:", error);
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
          Searching properties via real backend API
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
              Search Properties
            </span>
          )}
        </Button>
      </form>
    </div>
  );
};
