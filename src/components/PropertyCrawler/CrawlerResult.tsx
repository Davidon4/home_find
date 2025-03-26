
import { Check, Home, TrendingUp, AlertTriangle } from "lucide-react";
import { CrawlerParams, CrawlerResult } from "./types";

interface CrawlerResultProps {
  result: CrawlerResult | null;
  params: CrawlerParams;
}

export const CrawlerResultDisplay = ({ result, params }: CrawlerResultProps) => {
  if (!result) return null;

  return (
    <div className="mt-6">
      {result.success ? (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
            <Check className="h-4 w-4" />
            Crawl completed successfully
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">
              {result.propertiesFound} high-value properties found
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Properties have been added to the database and will appear in the property listings.</p>
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="h-4 w-4" />
              <span>All properties meet or exceed the quality threshold of {params.analysisThreshold}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
            <AlertTriangle className="h-4 w-4" />
            Crawl failed
          </div>
          <p className="text-sm">{result.error}</p>
        </div>
      )}
    </div>
  );
};
