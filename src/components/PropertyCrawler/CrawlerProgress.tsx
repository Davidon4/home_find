
import { Progress } from "@/components/ui/progress";

interface CrawlerProgressProps {
  isLoading: boolean;
  progress: number;
}

export const CrawlerProgress = ({ isLoading, progress }: CrawlerProgressProps) => {
  if (!isLoading) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-500">
        <span>Crawling properties...</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};
