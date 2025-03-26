import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, 
  DollarSign, 
  Bed, 
  Bath, 
  Ruler, 
  Building2, 
  Calendar 
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
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string | string[]) => void;
  onClear: () => void;
}

export const FilterPanel = ({ filters, onFilterChange, onClear }: FilterPanelProps) => {
  return (
    <ScrollArea className="h-[400px] rounded-md border p-4">
      <div className="space-y-6">
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

        <Separator />

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

        {/* Bathrooms */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Bath className="h-4 w-4" />
            Bathrooms
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="Min"
                value={filters.minBathrooms}
                onChange={(e) => onFilterChange('minBathrooms', e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative flex-1">
              <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxBathrooms}
                onChange={(e) => onFilterChange('maxBathrooms', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Square Footage */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Square Footage
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="Min"
                value={filters.minSquareFeet}
                onChange={(e) => onFilterChange('minSquareFeet', e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative flex-1">
              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxSquareFeet}
                onChange={(e) => onFilterChange('maxSquareFeet', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Property Status */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Property Status
          </Label>
          <Select value={filters.propertyStatus || "any"} onValueChange={(value) => onFilterChange('propertyStatus', value === "any" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Under Offer">Under Offer</SelectItem>
              <SelectItem value="Sold">Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Date Added */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Added
          </Label>
          <Select value={filters.dateAdded || "any"} onValueChange={(value) => onFilterChange('dateAdded', value === "any" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any time</SelectItem>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
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
      </div>
    </ScrollArea>
  );
}; 