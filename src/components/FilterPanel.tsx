import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { 
  Home, 
  DollarSign, 
  Bed, 
  Bath, 
  Ruler, 
  Building2, 
  Calendar,
  Filter,
  MapPin,
  Loader2,
  X,
  History
} from "lucide-react";

export interface FilterState {
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  maxBedrooms: string;
  minBathrooms: string;
  maxBathrooms: string;
  minSquareFeet: string;
  maxSquareFeet: string;
  propertyStatus: string;
  listingType: string;
  dateAdded: string;
  features: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string | string[] | number) => void;
  onClear: () => void;
  onSearch?: () => void;
}

interface LocationSuggestion {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
}

export const FilterPanel = ({ filters, onFilterChange, onClear, onSearch }: FilterPanelProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent locations from localStorage on component mount
  useEffect(() => {
    const savedLocations = localStorage.getItem('recentLocations');
    if (savedLocations) {
      try {
        const parsedLocations = JSON.parse(savedLocations);
        if (Array.isArray(parsedLocations)) {
          setRecentLocations(parsedLocations.slice(0, 5)); // Keep only the most recent 5
        }
      } catch (e) {
        console.error('Error parsing recent locations:', e);
      }
    }
  }, []);

  // Save recent locations to localStorage whenever they change
  useEffect(() => {
    if (recentLocations.length > 0) {
      localStorage.setItem('recentLocations', JSON.stringify(recentLocations));
    }
  }, [recentLocations]);

  // Handle clicks outside the suggestions dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        locationInputRef.current && 
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to fetch location suggestions as user types
  const fetchLocationSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Use OpenStreetMap Nominatim API for location suggestions
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&country=UK&limit=5`
      );
      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Format suggestions for display
        const suggestions = data.map((item: {
          display_name: string;
          lat: string;
          lon: string;
        }) => ({
          name: item.display_name.split(',')[0].trim(),
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        }));
        
        setLocationSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounce function for location input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.location && filters.location.trim().length >= 2) {
        fetchLocationSuggestions(filters.location);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [filters.location]);

  // Function to add a location to recent searches
  const addToRecentLocations = (location: string) => {
    if (!location || location.trim() === '') return;
    
    setRecentLocations(prev => {
      // Add to start of array, remove duplicates, and keep only the most recent 5
      const newLocations = [location, ...prev.filter(loc => loc !== location)].slice(0, 5);
      return newLocations;
    });
  };

  // Function to clear location input
  const clearLocationInput = () => {
    onFilterChange('location', '');
    setShowSuggestions(false);
  };

  // Helper function for general location search (name to coordinates)
  const performGeneralLocationSearch = async (searchTerm: string): Promise<boolean> => {
    setIsSearching(true);
    let success = false;
    
    try {
      console.log(`Performing general location search for: "${searchTerm}"`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&country=UK&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Extract coordinates from location search
        const latitude = parseFloat(data[0].lat);
        const longitude = parseFloat(data[0].lon);
        const displayName = data[0].display_name.split(',').slice(0, 2).join(',');
        
        console.log(`Found coordinates for ${searchTerm}:`, { latitude, longitude });
        
        // Update filter state with coordinates
        onFilterChange('latitude', latitude);
        onFilterChange('longitude', longitude);
        
        // Update location input to be more specific if needed (e.g., from suggestion)
        onFilterChange('location', displayName); 
        
        // Get nearest postcode for feedback (optional, could be removed if not needed)
        try {
          const reversePostcodeUrl = `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}`;
          const postcodeResponse = await fetch(reversePostcodeUrl);
          const postcodeData = await postcodeResponse.json();
          
          if (postcodeData.status === 200 && postcodeData.result && postcodeData.result.length > 0) {
            const nearestPostcode = postcodeData.result[0].postcode;
            toast.success(`Found location: ${displayName} (${nearestPostcode})`);
            // Optional: Update location filter with postcode? 
            // onFilterChange('location', nearestPostcode); 
          } else {
            toast.success(`Found location: ${displayName}`);
          }
        } catch (e) {
          toast.success(`Found location: ${displayName}`);
        }
        
        success = true;
      } else {
        console.log(`No location found for "${searchTerm}"`);
        toast.error("Location not found in the UK. Please try a different search term");
      }
    } catch (error) {
      console.error("Error in general location search:", error);
      toast.error("Error finding location, please try a more specific search term");
    } finally {
      setIsSearching(false);
      setShowSuggestions(false);
      // Trigger search ONLY if coordinates were successfully found
      if (success && onSearch) {
         setTimeout(() => {
           console.log("Triggering search after general location lookup");
           onSearch();
         }, 50); // Short delay to ensure state update
      }
    }
    return success; // Return success status outside finally
  };

  // Function to handle postcode search (postcode to coordinates)
  const performPostcodeSearch = async (searchTerm: string): Promise<boolean> => {
    setIsSearching(true);
    let success = false;
    try {
      console.log(`Checking if '${searchTerm}' is a valid UK postcode`);
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.status === 200 && data.result) {
        const latitude = data.result.latitude;
        const longitude = data.result.longitude;
        const locationName = [
          data.result.parish,
          data.result.admin_district,
          data.result.admin_county,
          data.result.country
        ].filter(Boolean)[0] || searchTerm; // Use postcode if no better name found

        console.log(`Found coordinates for postcode ${searchTerm}:`, { latitude, longitude });
        
        // Update filter state with coordinates and potentially a better location name
        onFilterChange('latitude', latitude);
        onFilterChange('longitude', longitude);
        onFilterChange('location', locationName); // Update location to be more descriptive

        toast.success(`Found location: ${locationName}`);
        success = true;
      } else {
        console.log(`${searchTerm} is not a valid UK postcode or lookup failed.`);
        // Don't show error here, let it fall back to general search
      }
    } catch (error) {
      console.error("Error validating postcode:", error);
      toast.error("Error checking postcode");
    } finally {
      setIsSearching(false);
       // Trigger search ONLY if coordinates were successfully found
       if (success && onSearch) {
         setTimeout(() => {
           console.log("Triggering search after postcode lookup");
           onSearch();
         }, 50); // Short delay to ensure state update
       }
    }
    return success; // Return success status outside finally
  };
  
  // Main handler for the location search button
  const handleLocationSearch = async () => {
    const searchTerm = filters.location?.trim();
    if (!searchTerm) {
      toast.error("Please enter a location or postcode");
      return;
    }

    addToRecentLocations(searchTerm); // Add original term to recent searches
    setShowSuggestions(false);
    
    // Show loading toast
    const loadingToast = toast.loading(`Finding location for ${searchTerm}...`);

    // Check if input is likely a postcode
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    const isPostcodeAttempt = ukPostcodeRegex.test(searchTerm.replace(/\s/g, ''));

    let foundLocation = false;
    if (isPostcodeAttempt) {
      foundLocation = await performPostcodeSearch(searchTerm);
    }

    // If it's not a postcode or postcode lookup failed, try general location search
    if (!foundLocation) {
      foundLocation = await performGeneralLocationSearch(searchTerm);
    }
    
    toast.dismiss(loadingToast); // Dismiss loading toast once done
    
    if (!foundLocation && !isPostcodeAttempt) {
      // Explicitly inform user if general search also failed after postcode check failed/skipped
      toast.error(`Could not find coordinates for "${searchTerm}". Please try again.`);
      return; // Don't trigger search if we don't have coordinates
    }

    // Only trigger search if we have valid coordinates
    if (filters.latitude && filters.longitude && onSearch) {
      console.log("Triggering search with coordinates:", {
        latitude: filters.latitude,
        longitude: filters.longitude
      });
      onSearch();
    } else {
      toast.error("Unable to determine location coordinates. Please try a different search term.");
    }
  };

  // Function to handle location suggestion selection
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    console.log("Selected suggestion:", suggestion);
    // Update location input value and coordinates directly from suggestion
    onFilterChange('location', suggestion.name);
    onFilterChange('latitude', suggestion.lat);
    onFilterChange('longitude', suggestion.lon);
    
    addToRecentLocations(suggestion.name);
    setShowSuggestions(false);
    toast.success(`Location set to ${suggestion.name}`);
    
    // Trigger search immediately after selecting a suggestion
    if (onSearch) {
      console.log("Triggering search after suggestion selection");
      onSearch();
    }
  };

  // Function to handle selecting a recent location
  const handleSelectRecentLocation = async (location: string) => {
    console.log("Selected recent location:", location);
    // Update the input field first
    onFilterChange('location', location); 
    setShowSuggestions(false);
    
    // Treat recent location click like a new search to get fresh coordinates
    const loadingToast = toast.loading(`Finding location for ${location}...`);
    
    // Check if it's a postcode or location name and perform appropriate search
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    const isPostcodeAttempt = ukPostcodeRegex.test(location.replace(/\s/g, ''));
    
    let foundLocation = false;
    if (isPostcodeAttempt) {
        foundLocation = await performPostcodeSearch(location);
    } 
    if (!foundLocation) {
        foundLocation = await performGeneralLocationSearch(location);
    }

    toast.dismiss(loadingToast);
    
    if (!foundLocation && !isPostcodeAttempt) {
        toast.error(`Could not find coordinates for "${location}". Please try again.`);
    }
    // Note: The search is triggered within performPostcodeSearch/performGeneralLocationSearch if successful
  };
  
  return (
    <ScrollArea className="h-[600px] rounded-md border p-4">
      <div className="space-y-6">
        {/* Location Search */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location Search
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={locationInputRef}
                type="text"
                placeholder="City, town or postcode"
                value={filters.location || ''}
                onChange={(e) => onFilterChange('location', e.target.value)}
                className="pl-9 pr-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLocationSearch();
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  } else if (e.key === 'ArrowDown' && showSuggestions && locationSuggestions.length > 0) {
                    // Focus first suggestion
                    const firstSuggestion = document.querySelector('.location-suggestion') as HTMLElement;
                    if (firstSuggestion) firstSuggestion.focus();
                  }
                }}
                onFocus={() => {
                  if (filters.location && filters.location.length >= 2 && locationSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
              {filters.location && (
                <button
                  type="button"
                  onClick={clearLocationInput}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {/* Location suggestions dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  <div className="py-1">
                    {locationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="location-suggestion w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSelectSuggestion(suggestion);
                          } else if (e.key === 'Escape') {
                            setShowSuggestions(false);
                            locationInputRef.current?.focus();
                          } else if (e.key === 'ArrowDown') {
                            const nextSuggestion = document.querySelectorAll('.location-suggestion')[index + 1] as HTMLElement;
                            if (nextSuggestion) nextSuggestion.focus();
                          } else if (e.key === 'ArrowUp') {
                            if (index === 0) {
                              locationInputRef.current?.focus();
                            } else {
                              const prevSuggestion = document.querySelectorAll('.location-suggestion')[index - 1] as HTMLElement;
                              if (prevSuggestion) prevSuggestion.focus();
                            }
                          }
                        }}
                      >
                        <div className="font-medium">{suggestion.name}</div>
                        <div className="text-xs text-gray-500 truncate">{suggestion.display_name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Enter any UK city, town, postcode, or area name to search for properties
          </p>
          
          {/* Recent searches */}
          {recentLocations.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <History className="h-3 w-3" />
                Recent locations:
              </p>
              <div className="flex flex-wrap gap-1">
                {recentLocations.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectRecentLocation(location)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 flex items-center gap-1"
                  >
                    <span>{location}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Label className="text-xs text-gray-500" htmlFor="radius">Search radius (miles)</Label>
              <Input
                id="radius"
                type="number"
                placeholder="Radius"
                value={filters.radius || 5}
                onChange={(e) => onFilterChange('radius', Number(e.target.value))}
                min={1}
                max={25}
              />
            </div>
          </div>
        </div>
        
        <Separator />

        {/* Property Type */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Property Type
          </Label>
          <Select value={filters.propertyType || "any"} onValueChange={(value) => onFilterChange('propertyType', value === "any" ? "" : value)}>
            <SelectTrigger>
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

        <Separator />

        {/* Price Range */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Range
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => onFilterChange('minPrice', e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Bed className="h-4 w-4" />
            Bedrooms
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="Min"
                value={filters.minBedrooms}
                onChange={(e) => onFilterChange('minBedrooms', e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative flex-1">
              <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxBedrooms}
                onChange={(e) => onFilterChange('maxBedrooms', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Clear Filters Button */}
        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          className="w-full"
        >
          Clear All Filters
        </Button>
        
        {/* Apply Filters Button */}
        {onSearch && (
          <Button
            type="button"
            onClick={onSearch}
            className="w-full"
          >
            Apply Filters
          </Button>
        )}
      </div>
    </ScrollArea>
  );
}; 