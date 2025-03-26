
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const PropertyScraper = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!url.trim()) {
        throw new Error('Please enter a valid URL');
      }

      const { data, error } = await supabase.functions.invoke('property-scraper', {
        body: { url: url.trim() }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Successfully scraped property listing');
        setUrl('');
      } else {
        throw new Error(data.error || 'Failed to scrape property');
      }
    } catch (error: any) {
      console.error('Scraping error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Property Listing Scraper</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleScrape} className="space-y-4">
          <div className="flex gap-4">
            <Input
              type="url"
              placeholder="Enter property listing URL (e.g., https://www.zoopla.co.uk/for-sale/...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? "Scraping..." : "Scrape Listing"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
