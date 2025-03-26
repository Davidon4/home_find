
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Camera, DollarSign, Building, Ruler, BedDouble, Bath } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function PropertyListing() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    price: "",
    beds: "",
    baths: "",
    sqft: "",
    description: "",
    propertyType: "residential",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address || !formData.price) {
      toast.error("Please fill in the required fields");
      return;
    }

    setLoading(true);

    try {
      // Here you would typically save the property listing to your database
      const { error } = await supabase.from('properties').insert({
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.zipCode,
        price: parseFloat(formData.price),
        beds: parseInt(formData.beds) || 0,
        baths: parseInt(formData.baths) || 0,
        square_feet: parseInt(formData.sqft) || 0,
        description: formData.description,
        property_type: formData.propertyType,
        status: 'active',
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;
      
      toast.success("Property listed successfully!");
      setFormData({
        address: "",
        city: "",
        state: "",
        zipCode: "",
        price: "",
        beds: "",
        baths: "",
        sqft: "",
        description: "",
        propertyType: "residential",
      });
    } catch (error: any) {
      console.error('Listing error:', error);
      toast.error(error.message || "Failed to list your property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-6 w-6" />
          List Your Property
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Property Address*</Label>
            <Input
              id="address"
              name="address"
              placeholder="123 Main St"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Postal Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                placeholder="Postal Code"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Asking Price*</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="Property Price"
                value={formData.price}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beds">Bedrooms</Label>
              <div className="relative">
                <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="beds"
                  name="beds"
                  type="number"
                  placeholder="Bedrooms"
                  value={formData.beds}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baths">Bathrooms</Label>
              <div className="relative">
                <Bath className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="baths"
                  name="baths"
                  type="number"
                  placeholder="Bathrooms"
                  value={formData.baths}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sqft">Square Feet</Label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="sqft"
                  name="sqft"
                  type="number"
                  placeholder="Square Feet"
                  value={formData.sqft}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe your property"
              value={formData.description}
              onChange={handleChange}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[100px]"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            size="lg" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Listing Property...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                List Property
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
