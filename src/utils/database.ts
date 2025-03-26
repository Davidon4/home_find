
import { supabase } from "@/integrations/supabase/client";
import type { Property, Bid, BidWithProperty, Notification } from "@/types/database";

export const fetchUserProperties = async (userId: string) => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', userId);
  
  if (error) throw error;
  return data as Property[];
};

export const fetchUserBids = async (userId: string): Promise<BidWithProperty[]> => {
  const { data, error } = await supabase
    .from('bids')
    .select(`
      *,
      property:properties(*)
    `)
    .eq('bidder_id', userId);
  
  if (error) throw error;
  
  // Ensure bid_status is of the correct type
  return data.map(bid => ({
    ...bid,
    bid_status: bid.bid_status as 'Pending' | 'Accepted' | 'Rejected'
  })) as BidWithProperty[];
};

export const fetchUserNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Notification[];
};

export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read_status: true })
    .eq('id', notificationId);
  
  if (error) throw error;
};

export const addFundsToProfile = async (userId: string, amount: number) => {
  const { data, error } = await supabase.rpc('process_transfer', {
    sender_id: '00000000-0000-0000-0000-000000000000', // System account ID
    recipient_id: userId,
    amount: amount
  });
  
  if (error) throw error;
  return data;
};

export const createBid = async (bid: Omit<Bid, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('bids')
    .insert(bid)
    .select()
    .single();
  
  if (error) throw error;
  return data as Bid;
};

export const createProperty = async (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single();
  
  if (error) throw error;
  return data as Property;
};
