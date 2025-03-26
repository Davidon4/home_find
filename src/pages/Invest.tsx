
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { PropertyGrid } from "@/components/PropertyGrid";
import { PropertyListing } from "@/types/property";
import { UnifiedPropertySearch } from "@/components/UnifiedPropertySearch";

const Invest = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Checking session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session status:', session ? 'Authenticated' : 'Not authenticated');
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const channel = supabase
      .channel('property_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'property_listings'
        },
        (payload) => {
          console.log('Received property update:', payload);
          setProperties(prevProperties => 
            prevProperties.map(prop => 
              prop.id === payload.new.id ? { ...prop, ...payload.new } : prop
            )
          );
        }
      )
      .subscribe();

    // Load the latest properties when the component mounts
    loadLatestProperties();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [navigate]);
  
  // Function to load the latest properties from the database
  const loadLatestProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log('Loaded latest properties:', data);
        setProperties(data);
        setSearchPerformed(true);
      }
    } catch (err) {
      console.error("Error loading latest properties:", err);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handlePropertiesFound = (foundProperties: PropertyListing[]) => {
    console.log('Setting properties from search:', foundProperties);
    setProperties(foundProperties);
    setSearchPerformed(true);
  };

  const handleClearResults = () => {
    setProperties([]);
    setSearchPerformed(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Smart Investment Properties</h1>
          <p className="text-lg text-gray-600">AI-powered analysis and bidding recommendations for high-potential investments</p>
        </div>

        <div className="mb-8">
          <UnifiedPropertySearch 
            onPropertiesFound={handlePropertiesFound}
            onSearchStart={() => setLoading(true)}
            onSearchComplete={() => setLoading(false)}
          />
        </div>

        {searchPerformed && (
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearResults}
              className="flex items-center gap-1"
            >
              <XCircle className="h-4 w-4" />
              Clear Results
            </Button>
          </div>
        )}

        <PropertyGrid 
          properties={properties} 
          loading={loading} 
          searchPerformed={searchPerformed}
          onCrawlerClick={() => {}} // This is no longer needed but we'll keep the interface the same
        />
      </div>
    </div>
  );
};

export default Invest;
