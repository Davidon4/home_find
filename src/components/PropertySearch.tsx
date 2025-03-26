import { useState, useEffect } from "react";
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
import { searchProperties, searchDatabaseProperties, PropertySearchParams } from "@/utils/propertyApi";
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

interface PropertySearchProps {
  onPropertiesFound: (properties: any[]) => void;
  onSearchStart?: () => void;
  onSearchComplete?: () => void;
}

export const PropertySearch = ({ onPropertiesFound, onSearchStart, onSearchComplete }: PropertySearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [loading, setLoading] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchMode, setSearchMode] = useState<"database" | "api">("database");

  const handleApiSearch = async () => {
    if (!location.trim()) {
      toast.error("Please enter a location to search");
      return;
    }

    setLoading(true);
    onSearchStart?.();

    try {
      console.log("Starting UK property API search for:", location);
      
      const params: PropertySearchParams = {
        area: location,
        page_size: "20"
      };
      
      if (propertyType) params.property_type = propertyType;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (minBedrooms) params.min_bedrooms = minBedrooms;
      if (maxBedrooms) params.max_bedrooms = maxBedrooms;

      const result = await searchProperties(params);
      
      console.log(`Found ${result.data.length} properties from API search`);
      onPropertiesFound(result.data);
      toast.success(`Found ${result.data.length} properties in ${location}`);
    } catch (error: any) {
      console.error("API search error:", error);
      toast.error(error.message || "Error searching for properties");
      onPropertiesFound([]);
    } finally {
      setLoading(false);
      onSearchComplete?.();
    }
  };

  const handleDatabaseSearch = async () => {
    setLoading(true);
    onSearchStart?.();

    try {
      console.log("Starting database search for:", searchTerm);
      const properties = await searchDatabaseProperties(searchTerm);
      console.log(`Found ${properties.length} properties in database`);
      onPropertiesFound(properties);
      
      if (properties.length === 0) {
        toast.info("No properties found matching your search. Try generating some first with the crawler!");
      } else {
        toast.success(`Found ${properties.length} properties`);
      }
    } catch (error: any) {
      console.error("Database search error:", error);
      toast.error(error.message || "Error searching for properties");
      onPropertiesFound([]);
    } finally {
      setLoading(false);
      onSearchComplete?.();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === "api") {
      handleApiSearch();
    } else {
      handleDatabaseSearch();
    }
  };

  const clearFilters = () => {
    setPropertyType("");
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("");
    setMaxBedrooms("");
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2 mb-2">
          <Button
            type="button"
            variant={searchMode === "database" ? "default" : "outline"}
            onClick={() => setSearchMode("database")}
            className="flex-1"
          >
            Search Database
          </Button>
          <Button
            type="button"
            variant={searchMode === "api" ? "default" : "outline"}
            onClick={() => setSearchMode("api")}
            className="flex-1"
          >
            Search API
          </Button>
        </div>

        {searchMode === "database" ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search properties (address, price, bedrooms, etc.)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Enter location (e.g. London, UK)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
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
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger id="propertyType">
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
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
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
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
                        value={minBedrooms}
                        onChange={(e) => setMinBedrooms(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="relative flex-1">
                      <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxBedrooms}
                        onChange={(e) => setMaxBedrooms(e.target.value)}
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
      </form>
    </div>
  );
};
