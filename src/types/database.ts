
export interface Property {
  id: string;
  owner_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: 'Apartment' | 'House' | 'Condo' | 'Townhouse';
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  estimated_rent: number | null;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  bidder_id: string;
  property_id: string;
  bid_amount: number;
  bid_status: 'Pending' | 'Accepted' | 'Rejected';
  created_at: string;
  updated_at: string;
}

export interface BidWithProperty extends Bid {
  property: Property;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read_status: boolean;
  notification_type: 'Bid' | 'Transaction' | 'System';
  created_at: string;
}

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format dates
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
