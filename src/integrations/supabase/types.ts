export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bids: {
        Row: {
          bid_amount: number
          bid_status: string | null
          bidder_id: string | null
          created_at: string
          id: string
          property_id: string | null
          updated_at: string
        }
        Insert: {
          bid_amount: number
          bid_status?: string | null
          bidder_id?: string | null
          created_at?: string
          id?: string
          property_id?: string | null
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          bid_status?: string | null
          bidder_id?: string | null
          created_at?: string
          id?: string
          property_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_listings: {
        Row: {
          address: string
          baths: number
          beds: number
          city: string
          created_at: string
          id: string
          image_url: string | null
          last_updated: string
          lot_size: number
          market_trend: number | null
          postal_code: string
          price: number
          square_feet: number
          state: string
        }
        Insert: {
          address: string
          baths: number
          beds: number
          city: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_updated?: string
          lot_size: number
          market_trend?: number | null
          postal_code: string
          price: number
          square_feet: number
          state: string
        }
        Update: {
          address?: string
          baths?: number
          beds?: number
          city?: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_updated?: string
          lot_size?: number
          market_trend?: number | null
          postal_code?: string
          price?: number
          square_feet?: number
          state?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          notification_type: string | null
          read_status: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          notification_type?: string | null
          read_status?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          notification_type?: string | null
          read_status?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_brand: string
          card_last4: string
          created_at: string
          id: string
          is_default: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_brand: string
          card_last4: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_brand?: string
          card_last4?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          city: string
          created_at: string
          estimated_rent: number | null
          id: string
          image_urls: string[] | null
          last_scraped_at: string | null
          owner_id: string | null
          property_type: string | null
          source_site: string | null
          source_url: string | null
          square_feet: number | null
          state: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          created_at?: string
          estimated_rent?: number | null
          id?: string
          image_urls?: string[] | null
          last_scraped_at?: string | null
          owner_id?: string | null
          property_type?: string | null
          source_site?: string | null
          source_url?: string | null
          square_feet?: number | null
          state: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          created_at?: string
          estimated_rent?: number | null
          id?: string
          image_urls?: string[] | null
          last_scraped_at?: string | null
          owner_id?: string | null
          property_type?: string | null
          source_site?: string | null
          source_url?: string | null
          square_feet?: number | null
          state?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      property_analyses: {
        Row: {
          analysis_result: Json
          analysis_type: string
          created_at: string | null
          id: string
          property_id: string
          updated_at: string | null
        }
        Insert: {
          analysis_result: Json
          analysis_type: string
          created_at?: string | null
          id?: string
          property_id: string
          updated_at?: string | null
        }
        Update: {
          analysis_result?: Json
          analysis_type?: string
          created_at?: string | null
          id?: string
          property_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      property_chat_history: {
        Row: {
          ai_response: string
          created_at: string | null
          id: string
          property_id: string | null
          user_message: string
        }
        Insert: {
          ai_response: string
          created_at?: string | null
          id?: string
          property_id?: string | null
          user_message: string
        }
        Update: {
          ai_response?: string
          created_at?: string | null
          id?: string
          property_id?: string | null
          user_message?: string
        }
        Relationships: []
      }
      property_listings: {
        Row: {
          address: string
          ai_analysis: Json | null
          bathrooms: number | null
          bedrooms: number | null
          bidding_recommendation: number | null
          created_at: string
          id: string
          image_url: string | null
          investment_highlights: Json | null
          investment_score: number | null
          last_sold_price: number | null
          listing_url: string
          market_analysis: Json | null
          market_trends: Json | null
          price: number
          price_history: Json | null
          rental_estimate: number | null
          roi_estimate: number | null
          source: string
          square_feet: number | null
          updated_at: string
        }
        Insert: {
          address: string
          ai_analysis?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          bidding_recommendation?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          investment_highlights?: Json | null
          investment_score?: number | null
          last_sold_price?: number | null
          listing_url: string
          market_analysis?: Json | null
          market_trends?: Json | null
          price: number
          price_history?: Json | null
          rental_estimate?: number | null
          roi_estimate?: number | null
          source: string
          square_feet?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          ai_analysis?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          bidding_recommendation?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          investment_highlights?: Json | null
          investment_score?: number | null
          last_sold_price?: number | null
          listing_url?: string
          market_analysis?: Json | null
          market_trends?: Json | null
          price?: number
          price_history?: Json | null
          rental_estimate?: number | null
          roi_estimate?: number | null
          source?: string
          square_feet?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rentcast_data: {
        Row: {
          address: string | null
          city: string | null
          historical_data: Json | null
          id: string
          last_updated: string | null
          market_stats: Json | null
          property_id: string | null
          rent_estimate: number | null
          state: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          historical_data?: Json | null
          id?: string
          last_updated?: string | null
          market_stats?: Json | null
          property_id?: string | null
          rent_estimate?: number | null
          state?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          historical_data?: Json | null
          id?: string
          last_updated?: string | null
          market_stats?: Json | null
          property_id?: string | null
          rent_estimate?: number | null
          state?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          id: number
          inserted_at: string
          is_complete: boolean | null
          task: string | null
          user_id: string
        }
        Insert: {
          id?: number
          inserted_at?: string
          is_complete?: boolean | null
          task?: string | null
          user_id: string
        }
        Update: {
          id?: number
          inserted_at?: string
          is_complete?: boolean | null
          task?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          recipient_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          recipient_id: string
          sender_id: string
          status: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          recipient_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_transfer: {
        Args: {
          sender_id: string
          recipient_id: string
          amount: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
