
import { useState, useEffect } from "react";
import { Search, Home, DollarSign, Key, Building, Star, Check, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { searchProperties, type UKProperty } from "@/utils/propertyApi";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { getRandomPlaceholder } from "@/utils/propertyUtils";
import { PropertyTabs } from "@/components/PropertyTabs";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProperties, setFeaturedProperties] = useState<UKProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFeaturedProperties = async () => {
      try {
        setLoading(true);
        const { data } = await searchProperties({
          area: "London",
          page_size: "3",
          ordering: "desc"
        });
        setFeaturedProperties(data);
      } catch (error) {
        console.error('Error loading featured properties:', error);
        toast.error("Failed to load featured properties");
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProperties();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/invest?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.src = getRandomPlaceholder();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <div className="relative pt-16">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/1a5a7ab5-ceed-42ad-9987-dbee4e73d818.png')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-40">
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Find your perfect UK investment property.
            </h1>
            <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg p-2 shadow-lg">
              <Input
                type="text"
                placeholder="Enter a postcode, city, or street name"
                className="flex-1 border-0 focus:ring-0 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" size="lg" className="ml-2">
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 mb-24">
        <PropertyTabs />
      </div>

      {/* Featured Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured UK Properties</h2>
          <p className="text-gray-600">Discover our selection of premium UK investment opportunities</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {Array(3).fill(null).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {featuredProperties.map((property) => (
              <div key={property.id} className="group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition duration-300">
                <div className="relative">
                  <img
                    src={property.image_url || getRandomPlaceholder()}
                    alt={property.address}
                    className="w-full h-60 object-cover object-center"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-2xl font-bold">£{property.price.toLocaleString()}</p>
                    <p className="text-sm">
                      {property.bedrooms} bed • {property.bathrooms} bath 
                      {property.square_feet && ` • ${property.square_feet} sqft`}
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-white">
                  <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                    {property.address}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {property.property_type || 'Residential'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose HomeFind</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our platform offers unique investment analytics and tools to help you make informed property decisions</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Investment Analysis</h3>
              <p className="text-gray-600">Get detailed ROI projections and rental yield estimates based on market data</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Guidance</h3>
              <p className="text-gray-600">Connect with property experts who can guide you through the investment process</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Property Search</h3>
              <p className="text-gray-600">Find hidden investment opportunities with our AI-powered property crawler</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <div className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to start your property investment journey?</h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">Join thousands of investors who have found success with HomeFind's advanced property platform</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/get-started">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" asChild>
              <Link to="/invest">Browse Properties</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
