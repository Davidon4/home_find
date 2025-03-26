
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { CrawlerForm } from "./PropertyCrawler/CrawlerForm";
import { CrawlerProgress } from "./PropertyCrawler/CrawlerProgress";
import { CrawlerResultDisplay } from "./PropertyCrawler/CrawlerResult";
import { CrawlerFooter } from "./PropertyCrawler/CrawlerFooter";
import { CrawlerParams, CrawlerResult } from "./PropertyCrawler/types";

export const PropertyCrawler = () => {
  const [params, setParams] = useState<CrawlerParams>({
    city: "london",
    maxPages: 3,
    minBeds: 2,
    maxPrice: 500000,
    analysisThreshold: 65
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CrawlerResult | null>(null);
  
  const handleChange = (name: keyof CrawlerParams, value: string | number) => {
    setParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setResult(null);
    
    try {
      toast.info("Starting property crawler. This may take a few minutes...");
      
      // Start progress animation
      const interval = setInterval(() => {
        setProgress(prev => {
          // Simulate progress up to 90%
          const nextProgress = prev + (90 - prev) * 0.1;
          return prev < 90 ? nextProgress : prev;
        });
      }, 1000);
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('zoopla-crawler', {
        body: params
      });
      
      clearInterval(interval);
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.success) {
        setResult(data);
        setProgress(100);
        toast.success(`Found ${data.propertiesFound} high-value properties.`);
      } else {
        throw new Error(data.error || "Failed to crawl properties");
      }
    } catch (error: any) {
      console.error("Crawler error:", error);
      setResult({
        success: false,
        error: error.message
      });
      toast.error(error.message || "Failed to run property crawler");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Automatic Property Crawler
        </CardTitle>
        <CardDescription>
          Find high-value investment properties automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CrawlerForm 
          params={params}
          isLoading={isLoading}
          onParamChange={handleChange}
          onSubmit={handleSubmit}
        />
        
        <CrawlerProgress 
          isLoading={isLoading}
          progress={progress}
        />
        
        <CrawlerResultDisplay 
          result={result}
          params={params}
        />
      </CardContent>
      
      <CrawlerFooter />
    </Card>
  );
};
