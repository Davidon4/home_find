
export interface CrawlerParams {
  city: string;
  maxPages: number;
  minBeds: number;
  maxPrice: number;
  analysisThreshold: number;
}

export interface CrawlerResult {
  success: boolean;
  propertiesFound?: number;
  properties?: any[];
  error?: string;
}

export interface UnifiedSearchParams {
  searchTerm: string;
  location: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  maxBeds: string;
  maxPages: number;
  analysisThreshold: number;
  searchMode: 'database' | 'api' | 'crawler';
}
