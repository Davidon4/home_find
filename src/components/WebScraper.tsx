
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Globe, Search, Image, Link2, FileText, BarChart3, Loader2 } from "lucide-react";

interface ScrapedData {
  title: string;
  content: string[];
  images: string[];
  links: string[];
  stats: {
    wordCount: number;
    paragraphCount: number;
    imageCount: number;
    linkCount: number;
  };
  analysis: {
    contentSummary: string;
    keyPhrases: string[];
    contentType: string;
  };
}

export const WebScraper = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error("Please enter a URL to scrape");
      return;
    }
    
    // Simple URL validation
    try {
      new URL(url);
    } catch (e) {
      toast.error("Please enter a valid URL");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Calling website-scraper function with URL:", url);
      
      const { data, error } = await supabase.functions.invoke('website-scraper', {
        body: { url }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log("Scraper response:", data);
      setScrapedData(data);
      toast.success("Website scraped successfully!");
    } catch (err: any) {
      console.error("Scraper error:", err);
      setError(err.message || "Failed to scrape website");
      toast.error(err.message || "Failed to scrape website");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Scraper
          </CardTitle>
          <CardDescription>
            Enter a URL to extract and analyze web content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScrape} className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Scrape Website
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-8 border-destructive">
          <CardHeader className="text-destructive">
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {scrapedData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{scrapedData.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge>{scrapedData.analysis.contentType}</Badge>
                <span className="text-sm text-muted-foreground">
                  {scrapedData.stats.wordCount} words
                </span>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Site Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                      <h3 className="font-medium text-sm text-muted-foreground">Words</h3>
                      <p className="text-2xl font-bold">{scrapedData.stats.wordCount}</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                      <h3 className="font-medium text-sm text-muted-foreground">Paragraphs</h3>
                      <p className="text-2xl font-bold">{scrapedData.stats.paragraphCount}</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                      <h3 className="font-medium text-sm text-muted-foreground">Images</h3>
                      <p className="text-2xl font-bold">{scrapedData.stats.imageCount}</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                      <h3 className="font-medium text-sm text-muted-foreground">Links</h3>
                      <p className="text-2xl font-bold">{scrapedData.stats.linkCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{scrapedData.analysis.contentSummary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Phrases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scrapedData.analysis.keyPhrases.length > 0 ? (
                      scrapedData.analysis.keyPhrases.map((phrase, index) => (
                        <div key={index} className="p-3 bg-secondary/20 rounded-md">
                          {phrase}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No key phrases identified</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Text Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scrapedData.content.map((text, index) => (
                      <div key={index} className="pb-4">
                        <p>{text}</p>
                        {index < scrapedData.content.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scrapedData.images.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scrapedData.images.map((src, index) => (
                        <div key={index} className="border rounded-md overflow-hidden">
                          <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
                            <img
                              src={src}
                              alt={`Scraped image ${index + 1}`}
                              className="object-contain max-h-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          </div>
                          <div className="p-2 text-xs text-muted-foreground break-all">
                            {src}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No images found on this page</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="links">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scrapedData.links.length > 0 ? (
                    <div className="space-y-2">
                      {scrapedData.links.map((href, index) => (
                        <div key={index} className="p-3 bg-secondary/20 rounded-md">
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {href}
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No links found on this page</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Content Type</h3>
                      <Badge className="text-sm">{scrapedData.analysis.contentType}</Badge>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Content Distribution</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Text</span>
                          <span>{Math.round((scrapedData.stats.wordCount / (scrapedData.stats.wordCount + scrapedData.stats.imageCount + scrapedData.stats.linkCount)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${Math.round((scrapedData.stats.wordCount / (scrapedData.stats.wordCount + scrapedData.stats.imageCount + scrapedData.stats.linkCount)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2">
                          <span>Images</span>
                          <span>{Math.round((scrapedData.stats.imageCount / (scrapedData.stats.wordCount + scrapedData.stats.imageCount + scrapedData.stats.linkCount)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${Math.round((scrapedData.stats.imageCount / (scrapedData.stats.wordCount + scrapedData.stats.imageCount + scrapedData.stats.linkCount)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2">
                          <span>Links</span>
                          <span>{Math.round((scrapedData.stats.linkCount / (scrapedData.stats.wordCount + scrapedData.stats.imageCount + scrapedData.stats.linkCount)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${Math.round((scrapedData.stats.linkCount / (scrapedData.stats.wordCount + scrapedData.stats.imageCount + scrapedData.stats.linkCount)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};
