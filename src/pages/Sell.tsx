import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search, DollarSign, Building } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PropertyAnalysis } from "@/components/PropertyAnalysis";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PropertyListing } from "@/components/PropertyListing";

interface Property {
  property_id: string;
  address: {
    line: string;
    city: string;
    state: string;
    postal_code: string;
  };
  price: number;
  beds: number;
  baths: number;
  building_size: {
    size: number;
    units: string;
  };
  lot_size: {
    size: number;
    units: string;
  };
  photos: string[];
}

const Sell = () => {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const searchProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast.error("Please enter an address or property URL");
      return;
    }

    setLoading(true);
    setProperties([]);

    try {
      if (isValidUrl(address)) {
        console.log('Scraping property from URL:', address);
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('property-scraper', {
          body: { url: address }
        });

        if (scrapeError) throw scrapeError;

        if (scrapeData.success) {
          toast.success('Successfully imported property listing');
          const scrapedProperty: Property = {
            property_id: scrapeData.data.id,
            address: {
              line: scrapeData.data.address,
              city: scrapeData.data.city || '',
              state: scrapeData.data.state || '',
              postal_code: scrapeData.data.postal_code || '',
            },
            price: scrapeData.data.price,
            beds: scrapeData.data.bedrooms || 0,
            baths: scrapeData.data.bathrooms || 0,
            building_size: {
              size: scrapeData.data.square_feet || 0,
              units: 'sqft',
            },
            lot_size: {
              size: 0,
              units: 'sqft',
            },
            photos: scrapeData.data.image_urls || [],
          };
          setProperties([scrapedProperty]);
        }
      } else {
        console.log('Searching properties with query:', address);
        const { data, error } = await supabase.functions.invoke('realty-api', {
          body: { searchQuery: address }
        });

        if (error) {
          console.error('Search error:', error);
          throw new Error(error.message || 'Failed to search properties');
        }

        if (data?.properties && data.properties.length > 0) {
          setProperties(data.properties);
          toast.success(`Found ${data.properties.length} properties`);
        } else {
          toast.info("No properties found for this location");
        }
      }
    } catch (error: any) {
      console.error('Search/Scrape error:', error);
      toast.error(error.message || "Failed to fetch property details");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow py-12 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">List Your Property</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              List your property with us to reach qualified investors, or search for properties to learn more about their potential value
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <PropertyListing />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-6 w-6" />
                    Property Search or Import
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={searchProperty} className="space-y-4">
                    <div className="flex gap-4">
                      <Input
                        placeholder="Enter location or paste property listing URL"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={loading || !address}>
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            {isValidUrl(address) ? "Importing..." : "Searching..."}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            {isValidUrl(address) ? "Import" : "Search"}
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {properties.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
                  <div className="grid gap-6">
                    {properties.map((property) => (
                      <Card key={property.property_id} className="overflow-hidden">
                        {property.photos?.[0] && (
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={property.photos[0]}
                              alt={property.address.line}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Address</label>
                              <p className="text-lg font-medium">{`${property.address.line}, ${property.address.city}, ${property.address.state} ${property.address.postal_code}`}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Price</label>
                              <p className="text-lg font-medium text-primary">{formatCurrency(property.price)}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Beds</label>
                                <p className="text-lg font-medium">{property.beds}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Baths</label>
                                <p className="text-lg font-medium">{property.baths}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Sqft</label>
                                <p className="text-lg font-medium">
                                  {property.building_size?.size.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <PropertyAnalysis propertyId={property.property_id} />
                            <Button className="w-full" size="lg">
                              <DollarSign className="h-4 w-4 mr-2" />
                              List Similar Property
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sell;
