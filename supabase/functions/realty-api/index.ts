
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.4'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get request body
    const { searchQuery } = await req.json()
    
    if (!searchQuery || typeof searchQuery !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Searching properties with query: ${searchQuery}`)
    
    // Get API key from environment variable
    const apiKey = Deno.env.get('RAPIDAPI_KEY')
    if (!apiKey) {
      console.error('RAPIDAPI_KEY environment variable is not set')
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Prepare the API request to RapidAPI's USA Real Estate API
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'realty-in-us.p.rapidapi.com'
      }
    }

    // Construct the search URL with the query
    const apiUrl = `https://realty-in-us.p.rapidapi.com/properties/v2/list-for-sale?city=${encodeURIComponent(searchQuery)}&state_code=ALL&offset=0&limit=10&sort=relevance`
    
    console.log(`Fetching from API: ${apiUrl}`)
    const response = await fetch(apiUrl, options)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API responded with status ${response.status}: ${errorText}`)
      return new Response(
        JSON.stringify({ error: `Failed to fetch property data: ${response.statusText}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    console.log(`Received ${data?.properties?.length || 0} properties from API`)
    
    // Transform the data to match our expected format
    const properties = data?.properties?.map(property => ({
      property_id: property.property_id || '',
      address: {
        line: property.address?.line || '',
        city: property.address?.city || '',
        state: property.address?.state_code || '',
        postal_code: property.address?.postal_code || ''
      },
      price: property.price || 0,
      beds: property.beds || 0,
      baths: property.baths || 0,
      building_size: {
        size: property.building_size?.size || 0,
        units: property.building_size?.units || 'sqft'
      },
      lot_size: {
        size: property.lot_size?.size || 0,
        units: property.lot_size?.units || 'sqft'
      },
      photos: property.photos?.map(photo => photo.href) || []
    })) || []

    // Save search results to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Log search query for analytics
      await supabase
        .from('search_logs')
        .insert({
          query: searchQuery,
          results_count: properties.length,
          source: 'realty-api'
        })
        .catch(err => console.error('Error logging search:', err))
    }

    // Return the transformed data
    return new Response(
      JSON.stringify({ properties }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
