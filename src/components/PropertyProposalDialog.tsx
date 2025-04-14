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
import { Loader2, Copy, Check, Sparkles, AlertTriangle, School, Shield, Ruler } from "lucide-react";
import { toast } from "sonner";
import { PropertyAnalysis } from "@/components/PropertyAnalysis";
import { analyzeProperty, PropertyAnalysisResult } from "@/utils/openai-api";
import { fetchPropertyDetails } from "@/utils/rightmove-api";

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

interface PropertyDetails {
  floodRisk: {
    risk_level: string;
    flood_zone: string;
    risk_factors: string[];
    last_updated: string;
  } | null;
  schools: Array<{
    name: string;
    type: string;
    distance: number;
    rating: string;
    pupils: number;
    performance: {
      progress_score?: number;
      attainment_score?: number;
    };
  }>;
  crime: {
    crime_rate: string;
    total_crimes: number;
    crime_breakdown: Record<string, number>;
    trend: string;
    comparison: {
      above_average: string[];
      below_average: string[];
    };
  } | null;
  floorAreas: {
    total_area: number;
    floor_plans: Array<{
      floor: string;
      area: number;
      rooms: string[];
    }>;
    epc_rating?: string;
  } | null;
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
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const proposalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch additional property details when dialog opens
  useEffect(() => {
    if (open && property.address) {
      const fetchDetails = async () => {
        try {
          // Extract postcode from address
          const postcode = property.address.split(',').pop()?.trim();
          if (!postcode) {
            console.error('Could not extract postcode from address');
            toast.error("Could not load property details - missing postcode");
            return;
          }

          const details = await fetchPropertyDetails(postcode);
          if (details) {
            setPropertyDetails(details);
            console.log("Property details:", details);
          } else {
            console.log("No property details found");
            toast.error("Could not load property details");
          }
        } catch (error) {
          console.error("Error fetching property details:", error);
          toast.error("Error loading property details");
        }
      };
      fetchDetails();
    }
  }, [open, property.address]);

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
              
              {property.description && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-2">Property Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{property.description}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Flood Risk Section */}
            {propertyDetails?.floodRisk && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold">Flood Risk Assessment</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    Risk Level: <span className="font-medium">{propertyDetails.floodRisk.risk_level}</span>
                  </p>
                  <p className="text-sm">
                    Flood Zone: <span className="font-medium">{propertyDetails.floodRisk.flood_zone}</span>
                  </p>
                  {propertyDetails.floodRisk.risk_factors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Risk Factors:</p>
                      <ul className="text-sm list-disc list-inside">
                        {propertyDetails.floodRisk.risk_factors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Last updated: {new Date(propertyDetails.floodRisk.last_updated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Schools Section */}
            {propertyDetails?.schools && propertyDetails.schools.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <School className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Nearby Schools</h3>
                </div>
                <div className="space-y-3">
                  {propertyDetails.schools.map((school, index) => (
                    <div key={index} className="border-b last:border-0 pb-2">
                      <p className="font-medium text-sm">{school.name}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>Type: {school.type}</p>
                        <p>Distance: {school.distance.toFixed(1)} miles</p>
                        <p>Rating: {school.rating}</p>
                        <p>Pupils: {school.pupils}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crime Statistics Section */}
            {propertyDetails?.crime && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold">Crime Statistics</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    Crime Rate: <span className="font-medium">{propertyDetails.crime.crime_rate}</span>
                  </p>
                  <p className="text-sm">
                    Total Crimes: <span className="font-medium">{propertyDetails.crime.total_crimes}</span>
                  </p>
                  <p className="text-sm">
                    Trend: <span className="font-medium">{propertyDetails.crime.trend}</span>
                  </p>
                  <div>
                    <p className="text-sm font-medium mb-1">Crime Breakdown:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(propertyDetails.crime.crime_breakdown).map(([type, count]) => (
                        <p key={type}>
                          {type}: <span className="font-medium">{count}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Floor Areas Section */}
            {propertyDetails?.floorAreas && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Floor Areas</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    Total Area: <span className="font-medium">{propertyDetails.floorAreas.total_area} sq ft</span>
                  </p>
                  {propertyDetails.floorAreas.epc_rating && (
                    <p className="text-sm">
                      EPC Rating: <span className="font-medium">{propertyDetails.floorAreas.epc_rating}</span>
                    </p>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-1">Floor Plans:</p>
                    {propertyDetails.floorAreas.floor_plans.map((plan, index) => (
                      <div key={index} className="border-b last:border-0 pb-2 mb-2">
                        <p className="text-sm font-medium">{plan.floor}</p>
                        <p className="text-sm">Area: {plan.area} sq ft</p>
                        {plan.rooms.length > 0 && (
                          <div className="text-sm">
                            <p className="font-medium">Rooms:</p>
                            <ul className="list-disc list-inside">
                              {plan.rooms.map((room, roomIndex) => (
                                <li key={roomIndex}>{room}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Property Analysis Component */}
            {analysisCompleted && analysis && (
              <PropertyAnalysis
                propertyId={property.id}
                currentScore={analysis.investment_score}
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

        {/* Proposal Generation Section */}
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