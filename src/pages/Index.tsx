import { useState, useEffect } from "react";
import { Search, Home, DollarSign, Key, Building, Star, Check, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { searchProperties } from "@/utils/propertyApi";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { getRandomPlaceholder } from "@/utils/propertyUtils";
import { PropertyTabs } from "@/components/PropertyTabs";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { fetchAllProperties, MappedProperty } from "@/utils/rightmove-api";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  CarouselApi
} from "@/components/ui/carousel";

const heroImages = [
  "/uk-property.jpg",
  "/uk-property01.jpg",
  "/uk-property02.jpg",
  "/uk-property03.jpg"
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProperties, setFeaturedProperties] = useState<MappedProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [useApi, setUseApi] = useState(false);
  const navigate = useNavigate();

  // Mock data for featured properties
  const mockProperties: MappedProperty[] = [
    {
      id: '1',
      address: '123 London Road, London',
      price: 750000,
      bedrooms: 3,
      bathrooms: 2,
      square_feet: 1500,
      image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
      propertyType: 'House',
      description: 'Beautiful 3-bedroom house in London',
      features: ['Garden', 'Parking', 'Modern Kitchen'],
      // images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914'],
      agent: {
        name: 'London Estates',
        phone: '020 1234 5678'
      },
      location: {
        latitude: 51.5074,
        longitude: -0.1278
      },
      dateAdded: new Date().toISOString(),
      listedSince: new Date().toISOString(),
      roi_estimate: 0.07
    },
    {
      id: '2',
      address: '456 Manchester Avenue, Manchester',
      price: 550000,
      bedrooms: 4,
      bathrooms: 2,
      square_feet: 1800,
      image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
      propertyType: 'Semi-Detached',
      description: 'Spacious family home in Manchester',
      features: ['Large Garden', 'Double Garage', 'Conservatory'],
      // images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
      agent: {
        name: 'Manchester Properties',
        phone: '0161 234 5678'
      },
      location: {
        latitude: 53.4808,
        longitude: -2.2426
      },
      dateAdded: new Date().toISOString(),
      listedSince: new Date().toISOString(),
      roi_estimate: 0.085
    },
    {
      id: '3',
      address: '789 Birmingham Street, Birmingham',
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      square_feet: 1200,
      image_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
      propertyType: 'Terraced',
      description: 'Modern terraced house in Birmingham',
      features: ['Recently Renovated', 'City Centre', 'Smart Home'],
      // images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be'],
      agent: {
        name: 'Birmingham Realty',
        phone: '0121 234 5678'
      },
      location: {
        latitude: 52.4862,
        longitude: -1.8904
      },
      dateAdded: new Date().toISOString(),
      listedSince: new Date().toISOString(),
      roi_estimate: 0.075
    }
  ];

  useEffect(() => {
    const loadFeaturedProperties = async () => {
      try {
        setLoading(true);
        
        if (useApi) {
          console.log("Attempting to fetch from Zoopla API...");
          const properties = await fetchAllProperties();
          
          if (properties && properties.length > 0) {
            const topProperties = properties
              .sort((a, b) => b.price - a.price)
              .slice(0, 3);
            setFeaturedProperties(topProperties);
            return;
          }
          
          console.log("No properties returned from API, falling back to mock data");
        }
        
        setFeaturedProperties(mockProperties);
        
      } catch (error) {
        console.error('Error loading featured properties:', error);
        toast.error("Failed to load properties from API, using mock data");
        setFeaturedProperties(mockProperties);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProperties();
  }, [useApi]);

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      // Optional: Add any effects when slide changes
    });
  }, [api]);

  // Auto-play effect
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [api]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/invest?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.src = getRandomPlaceholder();
  };

  // Add error handling for images
  const handleBackgroundError = (index: number) => {
    const fallbackImage = "/uk-property.jpg";
    const element = document.querySelector(`[data-carousel-item="${index}"] div`);
    if (element) {
      (element as HTMLElement).style.backgroundImage = `url(${fallbackImage})`;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <div className="relative pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <Carousel 
            className="h-full" 
            opts={{ loop: true, duration: 20 }} 
            setApi={setApi}
          >
            <CarouselContent className="h-full">
              {heroImages.map((image, index) => (
                <CarouselItem key={index} className="h-full" data-carousel-item={index}>
                  <div className="w-full h-full relative">
                    <img 
                      src={image}
                      alt={`Hero image ${index + 1}`}
                      className="w-full h-full object-cover"
                    onError={() => handleBackgroundError(index)}
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute bottom-4 right-4 flex gap-2">
              <CarouselPrevious className="relative -left-0 bg-white/20 hover:bg-white/40 text-white border-white/40" />
              <CarouselNext className="relative -right-0 bg-white/20 hover:bg-white/40 text-white border-white/40" />
            </div>
          </Carousel>
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
              <div 
                key={property.id} 
                className="group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition duration-300 cursor-pointer"
                onClick={() => navigate(`/invest?property=${property.id}`)}
              >
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
                  {property.roi_estimate && (
                    <div className="absolute top-4 right-4 bg-primary/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ROI: {(property.roi_estimate * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-white">
                  <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                    {property.address}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {property.propertyType || 'Residential'}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span>Estimated monthly rental: £{(property.price * 0.004).toLocaleString()}</span>
                  </div>
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
