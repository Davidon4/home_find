
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { CrawlerParams } from './types';

interface CrawlerFormProps {
  params: CrawlerParams;
  isLoading: boolean;
  onParamChange: (name: keyof CrawlerParams, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const CrawlerForm = ({ params, isLoading, onParamChange, onSubmit }: CrawlerFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium">City</label>
          <Input
            id="city"
            value={params.city}
            onChange={(e) => onParamChange('city', e.target.value)}
            placeholder="e.g. London"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="max-pages" className="text-sm font-medium">Max Pages to Crawl</label>
          <Select
            value={params.maxPages.toString()}
            onValueChange={(value) => onParamChange('maxPages', parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger id="max-pages">
              <SelectValue placeholder="Pages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 page (~25 listings)</SelectItem>
              <SelectItem value="2">2 pages (~50 listings)</SelectItem>
              <SelectItem value="3">3 pages (~75 listings)</SelectItem>
              <SelectItem value="5">5 pages (~125 listings)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="min-beds" className="text-sm font-medium">Min Bedrooms</label>
          <Select
            value={params.minBeds.toString()}
            onValueChange={(value) => onParamChange('minBeds', parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger id="min-beds">
              <SelectValue placeholder="Beds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1+ bedrooms</SelectItem>
              <SelectItem value="2">2+ bedrooms</SelectItem>
              <SelectItem value="3">3+ bedrooms</SelectItem>
              <SelectItem value="4">4+ bedrooms</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="max-price" className="text-sm font-medium">Max Price (£)</label>
          <Select
            value={params.maxPrice.toString()}
            onValueChange={(value) => onParamChange('maxPrice', parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger id="max-price">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="250000">£250,000</SelectItem>
              <SelectItem value="500000">£500,000</SelectItem>
              <SelectItem value="750000">£750,000</SelectItem>
              <SelectItem value="1000000">£1,000,000</SelectItem>
              <SelectItem value="2000000">£2,000,000</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="threshold" className="text-sm font-medium">Quality Threshold</label>
          <Select
            value={params.analysisThreshold.toString()}
            onValueChange={(value) => onParamChange('analysisThreshold', parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger id="threshold">
              <SelectValue placeholder="Threshold" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">Above average (60+)</SelectItem>
              <SelectItem value="65">Good (65+)</SelectItem>
              <SelectItem value="70">Very good (70+)</SelectItem>
              <SelectItem value="75">Excellent (75+)</SelectItem>
              <SelectItem value="80">Outstanding (80+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Crawling Properties...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Find High-Value Properties
          </>
        )}
      </Button>
    </form>
  );
};
