
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Database, MapPin, Home, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface CrawlerResponse {
  success: boolean;
  message: string;
  count: number;
  sample: any[];
  error?: string;
  details?: string;
}

export const DatabaseCrawler = () => {
  const [location, setLocation] = useState("");
  const [count, setCount] = useState<number>(20);
  const [propertyType, setPropertyType] = useState<string>("");
  const [minBedrooms, setMinBedrooms] = useState<number>(1);
  const [maxBedrooms, setMaxBedrooms] = useState<number>(5);
  const [priceRange, setPriceRange] = useState<[number, number]>([200000, 1000000]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrawlerResponse | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      toast.error("Please enter a location (city, state)");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log(`Crawling for property listings in ${location}`);
      const { data, error } = await supabase.functions.invoke('property-crawler', {
        body: { 
          location, 
          count,
          property_type: propertyType || undefined,
          min_bedrooms: minBedrooms,
          max_bedrooms: maxBedrooms,
          min_price: priceRange[0],
          max_price: priceRange[1],
        }
      });

      if (error) {
        console.error('Crawler error:', error);
        throw new Error(error.message || 'Failed to crawl property listings');
      }

      setResult(data as CrawlerResponse);
      if (data.success) {
        toast.success(`Generated ${data.count} property listings for ${location}`);
      } else {
        toast.error(data.error || 'Failed to crawl properties');
      }
    } catch (error: any) {
      console.error('Crawler function error:', error);
      toast.error(error.message || "Failed to crawl property listings");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Property Database Generator
        </CardTitle>
        <CardDescription>
          Generate realistic property listings for testing and demonstration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCrawl} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location (city, state)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                placeholder="e.g. Miami, FL"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="count">Number of listings to generate</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 20)}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Button 
              type="button" 
              variant="link" 
              className="p-0 h-auto text-sm"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              {showAdvancedOptions ? "Hide" : "Show"} advanced options
            </Button>
          </div>
          
          {showAdvancedOptions && (
            <div className="space-y-4 pt-2 pb-2 border-t border-b">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    <SelectItem value="Single Family Home">Single Family Home</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Multi-family">Multi-family</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Bedroom Range</Label>
                <div className="flex gap-4 items-center">
                  <div className="w-12 text-center">{minBedrooms}</div>
                  <Input
                    type="range"
                    min={1}
                    max={10}
                    value={minBedrooms}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setMinBedrooms(value);
                      if (value > maxBedrooms) {
                        setMaxBedrooms(value);
                      }
                    }}
                  />
                  <div className="text-center">to</div>
                  <Input
                    type="range"
                    min={minBedrooms}
                    max={10}
                    value={maxBedrooms}
                    onChange={(e) => setMaxBedrooms(parseInt(e.target.value))}
                  />
                  <div className="w-12 text-center">{maxBedrooms}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Price Range</Label>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                  </span>
                </div>
                <Slider
                  min={100000}
                  max={5000000}
                  step={50000}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  className="py-4"
                />
              </div>
            </div>
          )}
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Listings...
              </span>
            ) : (
              <span className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Generate Property Listings
              </span>
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800">Success!</h3>
                  <p className="text-green-600">{result.message}</p>
                  <p className="text-sm text-green-700 mt-2">
                    Generated {result.count} property listings for {location}
                  </p>
                </div>
              </div>
            </div>
            
            {result.sample && result.sample.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Sample Properties:</h3>
                <div className="bg-gray-50 p-3 rounded-md text-xs overflow-auto max-h-60">
                  {result.sample.map((property, index) => (
                    <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                      <div className="font-semibold">{property.address}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                        <div>Price: {formatCurrency(property.price)}</div>
                        <div>Beds: {property.bedrooms}</div>
                        <div>Baths: {property.bathrooms}</div>
                        <div>Area: {property.square_feet} sqft</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
