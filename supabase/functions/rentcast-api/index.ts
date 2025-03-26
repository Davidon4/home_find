
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RentcastResponse {
  rent_estimate: number;
  historical_data?: any;
  market_stats?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { address, city, state, zip } = await req.json()
    console.log('Received request for:', { address, city, state, zip })

    // Verify API key is available
    const apiKey = Deno.env.get('RENTCAST_API_KEY')
    if (!apiKey) {
      throw new Error('RENTCAST_API_KEY is not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check cache first
    console.log('Checking cache for existing data...')
    const { data: existingData } = await supabaseClient
      .from('rentcast_data')
      .select('*')
      .eq('address', address)
      .eq('city', city)
      .eq('state', state)
      .eq('zip', zip)
      .maybeSingle()

    // Return cached data if it's less than 7 days old
    if (existingData && 
        new Date(existingData.last_updated) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      console.log('Returning cached data')
      return new Response(
        JSON.stringify(existingData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch new data from Rentcast
    console.log('Fetching new data from Rentcast API...')
    const rentcastUrl = 'https://api.rentcast.io/v1/properties/rent-estimate'
    const rentcastResponse = await fetch(rentcastUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        address,
        city,
        state,
        zip,
      }),
    })

    if (!rentcastResponse.ok) {
      const errorText = await rentcastResponse.text()
      console.error('Rentcast API error:', errorText)
      throw new Error(`Rentcast API error: ${rentcastResponse.status} - ${errorText}`)
    }

    const rentcastData: RentcastResponse = await rentcastResponse.json()
    console.log('Received response from Rentcast:', rentcastData)

    // Store in database
    const { data: newData, error: insertError } = await supabaseClient
      .from('rentcast_data')
      .upsert({
        address,
        city,
        state,
        zip,
        rent_estimate: rentcastData.rent_estimate,
        historical_data: rentcastData.historical_data || null,
        market_stats: rentcastData.market_stats || null,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw insertError
    }

    console.log('Successfully stored data in database')
    return new Response(
      JSON.stringify(newData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in rentcast-api function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
