import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PropertyAnalysis } from "@/components/PropertyAnalysis";
import { analyzeProperty, PropertyAnalysisResult } from "@/utils/openai-api";

// Import the PropertyListing type
interface PropertyListing {
  id: string;
  address: string;
  price: number;
  bedrooms: number | null;
  bedrooms_verified?: boolean;
  bathrooms: number | null;
  bathrooms_verified?: boolean;
  square_feet: number | null;
  square_feet_verified?: boolean;
  image_url: string | null;
  roi_estimate: number | null;
  rental_estimate: number | null;
  investment_highlights: Record<string, string>;
  investment_score: number | null;
  created_at: string;
  updated_at: string;
  source: string;
  listing_url: string;
  description?: string;
  property_type?: string;
  agent?: {
    name: string;
    phone: string;
  };
  ai_analysis: Record<string, string>;
  market_analysis: Record<string, string>;
  bidding_recommendation: number | null;
  last_sold_price: number | null;
  price_history: Record<string, unknown> | null;
  latitude?: number;
  longitude?: number;
  property_details?: {
    market_demand: string;
    area_growth: string;
    crime_rate: string;
    nearby_schools: number;
    energy_rating: string;
    council_tax_band: string;
    property_features: string[];
  };
  market_trends?: {
    appreciation_rate: number;
    market_activity: string;
  };
}

interface PropertyProposalDialogProps {
  property: PropertyListing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyProposalDialog({
  property,
  open,
  onOpenChange
}: PropertyProposalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [analysis, setAnalysis] = useState<PropertyAnalysisResult | null>(null);
  const [generatedProposal, setGeneratedProposal] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const proposalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Log property details for debugging and trigger analysis - RESTORED
  useEffect(() => {
    if (open) {
      console.log("Property details:", property);
      // Removed automatic analysis to save API consumption
    }
  }, [open, property]);

  const handleAnalyzeProperty = async () => {
    setLoading(true);
    try {
      // Format the property for OpenAI analysis
      const propertyData = {
        id: property.id,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        square_feet: property.square_feet,
        propertyType: property.property_type || 'Unknown',
        address: property.address,
        description: property.description || '',
        dateAdded: new Date().toISOString(),
        listedSince: new Date().toISOString(),
        image_url: property.image_url || null,
        location: {
          latitude: property.latitude || 0,
          longitude: property.longitude || 0
        }
      };

      // Use OpenAI directly for analysis
      const result = await analyzeProperty(propertyData);
      setAnalysis(result);
      setAnalysisCompleted(true);
      toast.success("Property analyzed successfully with OpenAI!");
    } catch (error) {
      console.error("Error analyzing property with OpenAI:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`OpenAI Analysis failed: ${errorMessage}`);
      // We're not setting analysisCompleted to true since the analysis failed
    } finally {
      setLoading(false);
    }
  };

  const generateProposal = () => {
    try {
      if (!analysis) {
        toast.error("Analysis data is not available. Please wait for analysis to complete.");
        return;
      }

      // Create a safer formatting function
      const formatCurrency = (value: number | null | undefined): string => {
        if (value === null || value === undefined) return 'Not available';
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP',
          maximumFractionDigits: 0,
        }).format(value);
      };

      // Use data from property and analysis to generate a proposal with null checks
      const propertyDetails = {
        address: property.address || 'Address not available',
        price: formatCurrency(property.price),
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFeet: property.square_feet ? property.square_feet.toLocaleString() : 'Not specified',
        propertyType: property.property_type || 'Not specified',
        description: property.description || 'No description available',
        rentalEstimate: formatCurrency(analysis.rental_estimate),
        roiEstimate: typeof analysis.roi_estimate === 'number' ? `${analysis.roi_estimate.toFixed(2)}%` : 'Not available',
        investmentScore: typeof analysis.investment_score === 'number' ? `${analysis.investment_score}/100` : 'Not available',
        summary: analysis.summary || 'No analysis available',
        recommendation: analysis.recommendation || 'No recommendation available'
      };

      const proposal = `
INVESTMENT PROPOSAL FOR ${propertyDetails.address.toUpperCase()}

Property Details:
- Address: ${propertyDetails.address}
- Price: ${propertyDetails.price}
- Type: ${propertyDetails.propertyType}
- Bedrooms: ${propertyDetails.bedrooms}
- Bathrooms: ${propertyDetails.bathrooms}
- Square Feet: ${propertyDetails.squareFeet}

Property Description:
${propertyDetails.description}

Investment Analysis:
- AI Investment Score: ${propertyDetails.investmentScore}
- Estimated Monthly Rental: ${propertyDetails.rentalEstimate}
- Estimated Annual ROI: ${propertyDetails.roiEstimate}

Summary:
${propertyDetails.summary}

Recommendation:
${propertyDetails.recommendation}
      `;

      // Save the generated proposal to state
      setGeneratedProposal(proposal);
      
      // Copy to clipboard with proper error handling
      try {
        navigator.clipboard.writeText(proposal).then(() => {
          toast.success("Proposal copied to clipboard!");
          setCopySuccess(true);
          
          // Reset the success icon after 2 seconds
          setTimeout(() => setCopySuccess(false), 2000);
          
          // Log for debugging
          console.log("Generated proposal:", proposal);
        }).catch(err => {
          console.error("Clipboard write failed:", err);
          toast.error("Failed to copy to clipboard automatically. Please use the manual copy button.");
          
          // Focus on the textarea for easy manual copying
          if (proposalTextareaRef.current) {
            proposalTextareaRef.current.focus();
            proposalTextareaRef.current.select();
          }
        });
      } catch (clipboardError) {
        console.error("Clipboard API error:", clipboardError);
        toast.error("Your browser doesn't support automatic clipboard copying. Please use the manual copy button.");
        
        // Focus on the textarea for easy manual copying
        if (proposalTextareaRef.current) {
          proposalTextareaRef.current.focus();
          proposalTextareaRef.current.select();
        }
      }
    } catch (error) {
      console.error("Error generating proposal:", error);
      toast.error("Failed to generate proposal. Please try again.");
    }
  };

  const handleManualCopy = () => {
    if (proposalTextareaRef.current) {
      proposalTextareaRef.current.select();
      document.execCommand('copy');
      toast.success("Proposal copied to clipboard!");
      setCopySuccess(true);
      
      // Reset the success icon after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  console.log("Property details=>", property);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Property Details & Investment Analysis</DialogTitle>
          <DialogDescription>
            View detailed information and investment potential for this property.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{property.address}</h3>
              
              {!analysisCompleted && !loading ? (
                <Button 
                  onClick={handleAnalyzeProperty} 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Sparkles className="h-4 w-4" />
                  Analyze with AI
                </Button>
              ) : loading ? (
                <Button disabled size="sm" className="flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </Button>
              ) : (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Analysis Complete
                </span>
              )}
            </div>
            
            {property.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden mb-4">
                <img 
                  src={property.image_url} 
                  alt={property.address} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="block text-gray-500">Price</span>
                  <span className="font-medium">
                    {property.price.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500">Property Type</span>
                  <span className="font-medium">{property.property_type || 'Unknown'}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Bedrooms</span>
                  <span className="font-medium">
                    {property.bedrooms}
                    {property.bedrooms_verified === false && (
                      <span className="text-xs text-gray-400 ml-1">(est.)</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500">Bathrooms</span>
                  <span className="font-medium">
                    {property.bathrooms || 'Unknown'}
                    {property.bathrooms && property.bathrooms_verified === false && (
                      <span className="text-xs text-gray-400 ml-1">(est.)</span>
                    )}
                  </span>
                </div>
                {property.square_feet && (
                  <div>
                    <span className="block text-gray-500">Square Feet</span>
                    <span className="font-medium">
                      {property.square_feet.toLocaleString()}
                      {property.square_feet_verified === false && (
                        <span className="text-xs text-gray-400 ml-1">(est.)</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Property Description - Highlighted in a dedicated section */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium mb-2">Property Description</h4>
                {property.description ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{property.description}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No description available for this property.</p>
                )}
              </div>
              
              {property.agent && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-md font-medium mb-2">Agent Details</h4>
                  <div className="text-sm">
                    <p><span className="text-gray-500">Name:</span> {property.agent.name || 'Unknown'}</p>
                    {property.agent.phone && <p><span className="text-gray-500">Phone:</span> {property.agent.phone}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            {!analysisCompleted ? (
              <div className="space-y-4 flex flex-col items-center justify-center h-full">
                <p className="text-center text-gray-500">
                  {loading ? "Analyzing property with OpenAI..." : "Preparing property analysis..."}
                </p>
                
                {loading && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <PropertyAnalysis
                propertyId={property.id}
                currentScore={analysis ? analysis.investment_score : null}
                latitude={property.latitude}
                longitude={property.longitude}
                price={property.price}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                square_feet={property.square_feet}
                property_type={property.property_type}
                address={property.address}
              />
            )}
          </div>
        </div>

        {generatedProposal && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
              <h4 className="text-sm font-medium">Your Investment Proposal</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualCopy}
                className="h-8 px-3 flex items-center justify-center gap-1 w-full sm:w-auto"
              >
                {copySuccess ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy to clipboard</span>
                  </>
                )}
              </Button>
            </div>
            <textarea
              ref={proposalTextareaRef}
              className="w-full h-48 sm:h-64 p-3 text-sm font-mono bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              readOnly
              value={generatedProposal}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <p className="text-xs text-gray-500 mt-2">Click in the text area to select all content for easy copying.</p>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {analysisCompleted && (
            <Button onClick={generateProposal}>
              {generatedProposal ? "Regenerate Proposal" : "Generate & Copy Proposal"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 