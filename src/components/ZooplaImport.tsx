
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, Globe } from "lucide-react";
import { toast } from "sonner";
import { PropertyListing, ScrapedProperty } from "@/types/property";

interface ZooplaImportProps {
  onPropertyImported: (property: PropertyListing) => void;
}

export const ZooplaImport = ({ onPropertyImported }: ZooplaImportProps) => {
  const [zooplaUrl, setZooplaUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  const handleScrapeProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!zooplaUrl) {
      toast.error("Please enter a Zoopla property URL");
      return;
    }
    
    // Validate URL format and check if it's from Zoopla
    if (!zooplaUrl.startsWith('https://www.zoopla.co.uk/')) {
      toast.error("Please enter a valid Zoopla URL");
      return;
    }
    
    setIsScraping(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('website-scraper', {
        body: { 
          url: zooplaUrl,
          isZoopla: true
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.property) {
        throw new Error("Could not extract property data from this page");
      }
      
      const scrapedProperty: ScrapedProperty = data.property;
      console.log("Scraped property:", scrapedProperty);
      
      // Generate a unique ID for the scraped property
      const id = crypto.randomUUID();
      
      // Map the scraped property to our PropertyListing format
      const newProperty: PropertyListing = {
        id,
        address: scrapedProperty.address,
        price: scrapedProperty.priceValue || 0,
        bedrooms: scrapedProperty.bedrooms,
        bathrooms: scrapedProperty.bathrooms,
        square_feet: null, // Not available from Zoopla scraping
        image_url: scrapedProperty.imageUrls?.[0] || null,
        roi_estimate: Math.random() * 10 + 5, // Placeholder - would be calculated
        rental_estimate: Math.random() * 1000 + 1000, // Placeholder - would be calculated
        investment_highlights: {
          features: scrapedProperty.features
        },
        investment_score: Math.floor(Math.random() * 30) + 70, // Placeholder
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: "zoopla",
        listing_url: zooplaUrl,
        description: scrapedProperty.description,
        property_type: scrapedProperty.propertyType,
        agent: {
          name: scrapedProperty.agentName || "Unknown Agent",
          phone: scrapedProperty.agentPhone || "Not available"
        },
        ai_analysis: null,
        market_analysis: null,
        bidding_recommendation: null,
        last_sold_price: null,
        price_history: null,
        market_trends: {
          appreciation_rate: (Math.random() * 5 + 2).toFixed(1)
        }
      };
      
      onPropertyImported(newProperty);
      toast.success("Successfully imported property from Zoopla");
      setZooplaUrl("");
    } catch (err: any) {
      console.error("Scraping error:", err);
      toast.error(err.message || "Failed to scrape property");
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Import Property from Zoopla
        </CardTitle>
        <CardDescription>
          Enter a Zoopla property URL to import and analyze it
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleScrapeProperty} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="url"
              placeholder="https://www.zoopla.co.uk/for-sale/details/..."
              value={zooplaUrl}
              onChange={(e) => setZooplaUrl(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isScraping}>
            {isScraping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Import Property
              </>
            )}
          </Button>
        </form>
        <div className="mt-4 text-sm text-gray-500">
          <p>Example URLs:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>https://www.zoopla.co.uk/for-sale/details/...</li>
            <li>https://www.zoopla.co.uk/to-rent/details/...</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
