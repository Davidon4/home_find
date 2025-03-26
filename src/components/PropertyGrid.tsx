
import { PropertyListing } from "@/types/property";
import { PropertyCard } from "@/components/PropertyCard";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyGridProps {
  properties: PropertyListing[];
  loading: boolean;
  searchPerformed: boolean;
  onCrawlerClick: () => void;
}

export const PropertyGrid = ({ properties, loading, searchPerformed, onCrawlerClick }: PropertyGridProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (properties.length > 0) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    );
  }

  if (searchPerformed) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
        <p className="text-gray-600 mb-6">Try adjusting your search criteria or use the property crawler to find listings</p>
        <Button 
          variant="outline" 
          onClick={onCrawlerClick}
          className="mx-auto"
        >
          Auto-Find Properties
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Start exploring investment properties</h3>
      <p className="text-gray-600 mb-4">Search for existing properties or use our automatic property finder</p>
    </div>
  );
};
