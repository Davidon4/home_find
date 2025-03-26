
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

interface PropertyAnalysisProps {
  propertyId: string;
  currentScore?: number | null;
}

export const PropertyAnalysis = ({ propertyId, currentScore }: PropertyAnalysisProps) => {
  const [loading, setLoading] = useState(false);

  const analyzeProperty = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-property', {
        body: { propertyId }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Property analysis completed!");
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
        <Button 
          onClick={analyzeProperty} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Analyzing..." : "Analyze Investment Potential"}
        </Button>
      </CardContent>
    </Card>
  );
};
