
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, DollarSign, TrendingUp } from "lucide-react";

interface RentalEstimateProps {
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export const RentalEstimate = ({ address, city, state, postalCode }: RentalEstimateProps) => {
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getRentEstimate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Requesting rent estimate for:', { address, city, state, postalCode });
      
      const { data, error } = await supabase.functions.invoke('rentcast-api', {
        body: {
          address: address,
          city: city,
          state: state,
          zip: postalCode
        }
      });

      if (error) throw error;

      console.log('Received response:', data);

      if (data.rent_estimate) {
        setEstimate(data.rent_estimate);
        toast.success("Rental estimate retrieved successfully!");
      } else {
        throw new Error('No rent estimate in response');
      }
    } catch (error: any) {
      console.error('Error getting rent estimate:', error);
      const errorMessage = error.message || "Failed to get rental estimate";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Rental Estimate
        </CardTitle>
      </CardHeader>
      <CardContent>
        {estimate ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {estimate.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0
                })}
              </span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <Button 
              variant="outline" 
              onClick={getRentEstimate}
              disabled={loading}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              onClick={getRentEstimate} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Calculating..." : "Get Rental Estimate"}
            </Button>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
