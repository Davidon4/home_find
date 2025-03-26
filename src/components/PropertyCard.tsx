import { PropertyListing } from "@/types/property";
import { getBidRecommendation, formatCurrency, getRandomPlaceholder } from "@/utils/propertyUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { DollarSign, LineChart, TrendingUp, Globe } from "lucide-react";
import { PropertyAnalysis } from "@/components/PropertyAnalysis";
import { RentalEstimate } from "@/components/RentalEstimate";



interface PropertyCardProps {
  property: PropertyListing;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  const bidRec = getBidRecommendation(property);
  const addressParts = property.address.split(',');
  const city = addressParts[1]?.trim() || '';
  const stateZip = addressParts[2]?.trim().split(' ') || ['', ''];
  const state = stateZip[0] || '';
  const postalCode = stateZip[1] || '';
  
  return (
    <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={property.image_url || getRandomPlaceholder()}
          alt={property.address}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = getRandomPlaceholder();
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <div className="text-2xl font-semibold">{formatCurrency(property.price)}</div>
          <div className="text-sm">
            {property.bedrooms ?? '?'} bed • {property.bathrooms ?? '?'} bath • {property.square_feet?.toLocaleString() ?? '?'} sqft
          </div>
        </div>
        {property.investment_score && (
          <div className="absolute top-4 right-4 bg-primary/90 text-white px-3 py-1 rounded-full text-sm font-medium">
            Score: {property.investment_score}/100
          </div>
        )}
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-1">{property.address}</CardTitle>
        {property.property_type && (
          <CardDescription>{property.property_type}</CardDescription>
        )}
      </CardHeader>

      <CardContent>
        {property.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{property.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm text-gray-500">ROI Estimate</div>
              <div className="font-semibold">{property.roi_estimate?.toFixed(1) ?? 'N/A'}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Monthly Rent</div>
              <div className="font-semibold">${property.rental_estimate?.toLocaleString() ?? 'N/A'}</div>
            </div>
          </div>
        </div>

        <RentalEstimate
          address={addressParts[0]?.trim() || ''}
          city={city}
          state={state}
          postalCode={postalCode}
        />

        {bidRec && (
          <div className="mb-6 p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Bid Recommendation</span>
              <span className={`text-sm font-semibold ${bidRec.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {bidRec.recommendation}
              </span>
            </div>
            <div className="text-lg font-semibold">{formatCurrency(bidRec.value)}</div>
            <div className="text-sm text-gray-500">
              {Math.abs(bidRec.difference).toFixed(1)}% {bidRec.difference >= 0 ? 'above' : 'below'} listing price
            </div>
          </div>
        )}

        {property.market_trends && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <LineChart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Market Trends</span>
            </div>
            <div className="text-sm text-gray-600">
              Area appreciation: {property.market_trends?.appreciation_rate}% yearly
            </div>
          </div>
        )}

<PropertyAnalysis 
  propertyId={property.id}
  currentScore={property.investment_score}
  price={property.price}
  bedrooms={property.bedrooms}
  bathrooms={property.bathrooms}
  square_feet={property.square_feet}
  address={property.address}
/>

        {property.property_details && (
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {property.property_details.market_demand && (
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                  <span className="text-xs text-muted-foreground">Market Demand</span>
                  <span className="font-medium">{property.property_details.market_demand}</span>
                </div>
              )}
              {property.property_details.area_growth && (
                <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                  <span className="text-xs text-muted-foreground">Area Growth</span>
                  <span className="font-medium">{property.property_details.area_growth}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {property.property_details.crime_rate && (
                <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                  <span className="text-xs text-muted-foreground">Crime Rate</span>
                  <span className="font-medium">{property.property_details.crime_rate}</span>
                </div>
              )}
              {property.property_details.nearby_schools && (
                <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded">
                  <span className="text-xs text-muted-foreground">Nearby Schools</span>
                  <span className="font-medium">{property.property_details.nearby_schools}</span>
                </div>
              )}
            </div>
            {property.property_details.energy_rating && (
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded">
                <span className="text-xs text-muted-foreground">Energy Rating</span>
                <span className="font-medium">{property.property_details.energy_rating}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-3">
        <Button className="w-full" variant="default">View Investment Details</Button>
        <Button className="w-full" variant="outline">Schedule Viewing</Button>
        
        {property.agent && (
          <div className="w-full text-center mt-2 text-sm text-gray-500">
            <div>Agent: {property.agent.name}</div>
            <div>{property.agent.phone}</div>
          </div>
        )}
        
        {property.source === "zoopla" && (
          <div className="w-full text-center mt-2">
            <a 
              href={property.listing_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
            >
              <Globe className="h-3 w-3" />
              View on Zoopla
            </a>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
