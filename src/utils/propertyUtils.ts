import { PropertyListing } from "@/types/property";

export const placeholderImages = [
  "https://images.unsplash.com/photo-1433832597046-4f10e10ac764",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b",
  "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb",
];

export const getRandomPlaceholder = () => {
  return placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
};

export const getBidRecommendation = (property: PropertyListing) => {
  if (!property.bidding_recommendation || 
      property.bidding_recommendation <= 0 || 
      !property.price || 
      property.price <= 0) {
    return null;
  }
  
  const diff = ((property.bidding_recommendation - property.price) / property.price) * 100;
  return {
    value: property.bidding_recommendation,
    difference: diff,
    recommendation: diff > 0 ? "Bid higher" : "Bid lower",
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};
