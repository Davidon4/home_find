
import { CardFooter } from "@/components/ui/card";

export const CrawlerFooter = () => {
  return (
    <CardFooter className="flex flex-col space-y-4 items-start text-sm text-gray-500">
      <div>
        <strong>How it works:</strong> This tool automatically scans Zoopla property listings in your chosen area, analyzes each property for investment potential, and saves high-value properties to the database.
      </div>
      <div>
        <strong>Note:</strong> The crawler respects website terms and conditions. Crawl responsibly and avoid excessive requests.
      </div>
    </CardFooter>
  );
};
