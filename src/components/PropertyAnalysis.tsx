import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LineChart, DollarSign, TrendingUp, AlertTriangle, MapPin, School, Train, Hospital, ShoppingBag, ArrowUp, Ruler, Home, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { analyzeProperty as openAIAnalyze } from "@/utils/openai-api";
import { MappedProperty } from "@/utils/zoopla-api";

interface PropertyAnalysisProps {
  propertyId: string;
  currentScore?: number | null;
  latitude?: number;
  longitude?: number;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  property_type?: string;
  address: string;
  allProperties?: PropertyListing[]; // All properties for finding similar ones
}

interface PropertyListing {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  property_type?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
}

interface SimilarProperty {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  property_type?: string;
  distance: number; // in meters
  price_difference: number; // percentage higher than the original property
  image_url?: string;
}

interface AnalysisData {
  summary: string;
  recommendation: string;
  roi_estimate: number;
  rental_estimate: number;
  investment_score: number;
  bidding_recommendation: number;
  market_analysis: {
    trend: string;
    demand: string;
  };
  investment_highlights: {
    location: string;
    type: string;
    features: string;
  };
  similar_properties?: SimilarProperty[];
}

export const PropertyAnalysis = ({ 
  propertyId, 
  currentScore, 
  latitude, 
  longitude,
  price,
  bedrooms,
  bathrooms,
  square_feet,
  property_type,
  address,
  allProperties = []
}: PropertyAnalysisProps) => {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically analyze property when component mounts - RESTORED
  useEffect(() => {
    if (!analysisData && !loading) {
      handleAnalyzeProperty();
    }
  }, [propertyId]);

  const handleAnalyzeProperty = async () => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      // Create a property object compatible with the MappedProperty interface
      const propertyData: MappedProperty = {
        id: propertyId,
        price,
        bedrooms,
        bathrooms,
        square_feet,
        propertyType: property_type || 'Unknown',
        address,
        description: '',
        dateAdded: new Date().toISOString(),
        listedSince: new Date().toISOString(),
        image_url: null,
        location: {
          latitude: latitude || 0,
          longitude: longitude || 0
        }
      };

      // Use the OpenAI analysis function directly
      const analysisResult = await openAIAnalyze(propertyData);
      
      // Transform the analysis result into the expected format
      const data: AnalysisData = {
        summary: analysisResult.summary,
        recommendation: analysisResult.recommendation,
        roi_estimate: analysisResult.roi_estimate,
        rental_estimate: analysisResult.rental_estimate,
        investment_score: analysisResult.investment_score,
        bidding_recommendation: analysisResult.bidding_recommendation,
        market_analysis: analysisResult.market_analysis,
        investment_highlights: analysisResult.investment_highlights,
        similar_properties: findSimilarProperties(propertyData, allProperties)
      };
      
      setAnalysisData(data);
      toast.success("Property analysis completed with OpenAI!");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setErrorMessage(errorMessage);
      toast.error(`OpenAI Analysis failed: ${errorMessage}`);
      console.error("OpenAI Analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to find similar properties
  const findSimilarProperties = (property: MappedProperty, allProperties: PropertyListing[]): SimilarProperty[] => {
    if (!allProperties || allProperties.length === 0) return [];
    
    // Filter out the current property and calculate distances
    const similarProperties = allProperties
      .filter(p => p.id !== property.id)
      .map(p => {
        // Calculate simple euclidean distance if both have coordinates
        let distance = 1000; // Default distance
        
        if (property.location?.latitude && property.location?.longitude && 
            p.latitude && p.longitude) {
          // Simple distance calculation
          distance = Math.sqrt(
            Math.pow((property.location.latitude - p.latitude) * 111000, 2) + 
            Math.pow((property.location.longitude - p.longitude) * 111000 * 
            Math.cos(property.location.latitude * Math.PI / 180), 2)
          );
        }
        
        // Calculate price difference
        const priceDifference = p.price / property.price - 1;
        
        return {
          ...p,
          distance,
          price_difference: priceDifference * 100
        };
      })
      // Sort by distance
      .sort((a, b) => a.distance - b.distance)
      // Take top 3
      .slice(0, 3);
      
    return similarProperties;
  };

  const formatAnalysisSection = (text: string) => {
    if (!text) return null;
    const sections = text.split('\n\n');
    return sections.map((section, index) => (
      <p key={index} className="mb-4 text-sm text-gray-600">
        {section}
      </p>
    ));
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Investment Analysis</span>
          {currentScore && (
            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
              Score: {currentScore}/100
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!analysisData ? (
          <div className="space-y-4">
            <div className="text-center p-6">
              {loading ? (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-gray-500">Analyzing with OpenAI...</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Preparing analysis...</p>
              )}
            </div>
            
            {errorMessage && (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">
                {errorMessage}
              </div>
            )}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="summary">
              <AccordionTrigger className="text-lg font-semibold">
                <LineChart className="h-5 w-5 mr-2" />
                Investment Summary
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg flex items-center">
                      <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400 mr-2" />
                      <div>
                        <span className="text-xs text-gray-500 block">Est. Monthly Rental</span>
                        <span className="font-bold">{formatCurrency(analysisData.rental_estimate)}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center">
                      <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-2" />
                      <div>
                        <span className="text-xs text-gray-500 block">Est. ROI</span>
                        <span className="font-bold">{analysisData.roi_estimate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Investment Score</span>
                      <span className="text-sm font-bold">{analysisData.investment_score}/100</span>
                    </div>
                    <Progress value={analysisData.investment_score} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Summary</h4>
                    <p className="text-sm text-gray-600">{analysisData.summary}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Recommendation</h4>
                    <p className="text-sm text-gray-600">{analysisData.recommendation}</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Bidding Recommendation</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">{formatCurrency(analysisData.bidding_recommendation)}</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        analysisData.bidding_recommendation > price 
                          ? "bg-green-100 text-green-800" 
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {((analysisData.bidding_recommendation - price) / price * 100).toFixed(1)}% 
                        {analysisData.bidding_recommendation > price ? " above" : " below"} asking
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="location">
              <AccordionTrigger className="text-lg font-semibold">
                <MapPin className="h-5 w-5 mr-2" />
                Location Analysis
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Location Assessment</h4>
                    <p className="text-sm text-gray-600">{analysisData.investment_highlights.location}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                      <h4 className="text-sm font-medium mb-1">Market Trend</h4>
                      <p className="text-sm">{analysisData.market_analysis.trend}</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <h4 className="text-sm font-medium mb-1">Demand</h4>
                      <p className="text-sm">{analysisData.market_analysis.demand}</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="features">
              <AccordionTrigger className="text-lg font-semibold">
                <Home className="h-5 w-5 mr-2" />
                Property Highlights
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Property Type Analysis</h4>
                    <p className="text-sm text-gray-600">{analysisData.investment_highlights.type}</p>
                  </div>
                  
                  {analysisData.investment_highlights.features && (
                    <div className="p-3 border rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Key Features</h4>
                      <p className="text-sm text-gray-600">{analysisData.investment_highlights.features}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {analysisData.similar_properties && analysisData.similar_properties.length > 0 && (
              <AccordionItem value="similar">
                <AccordionTrigger className="text-lg font-semibold">
                  <BuildingIcon className="h-5 w-5 mr-2" />
                  Similar Properties
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {analysisData.similar_properties.map((property, index) => (
                      <div key={property.id || index} className="flex gap-3 p-3 border rounded-lg">
                        {property.image_url ? (
                          <img 
                            src={property.image_url} 
                            alt={property.address} 
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                            <Home className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-medium truncate">{property.address}</h4>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm">{formatCurrency(property.price)}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              property.price_difference > 0 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {property.price_difference > 0 ? '+' : ''}
                              {property.price_difference.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-gray-500">
                            <span>{property.bedrooms || '?'} bed, {property.bathrooms || '?'} bath</span>
                            <span>{(property.distance / 1000).toFixed(1)}km away</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

// Helper component for the building icon
const BuildingIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M12 6h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 10h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M8 14h.01"></path>
  </svg>
);
