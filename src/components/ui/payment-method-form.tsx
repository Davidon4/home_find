
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

interface PaymentMethodFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentMethodForm({ userId, onSuccess, onCancel }: PaymentMethodFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    cardName: "",
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces every 4 digits and limit to 19 chars (16 digits + 3 spaces)
    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "") // Remove spaces
        .replace(/\D/g, "") // Remove non-digits
        .replace(/(\d{4})(?=\d)/g, "$1 ") // Add space after every 4 digits
        .substring(0, 19); // Limit to 16 digits + 3 spaces
      
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    
    // Format expiry date as MM/YY
    if (name === "cardExpiry") {
      const expiry = value
        .replace(/\D/g, "") // Remove non-digits
        .substring(0, 4); // Limit to 4 digits
      
      const formatted = expiry.length > 2 
        ? `${expiry.substring(0, 2)}/${expiry.substring(2)}` 
        : expiry;
      
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    
    // Limit CVC to 3-4 digits
    if (name === "cardCvc") {
      const formatted = value
        .replace(/\D/g, "") // Remove non-digits
        .substring(0, 4); // Limit to 4 digits
      
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Basic validation
    if (formData.cardNumber.replace(/\s/g, "").length < 16) {
      toast.error("Please enter a valid card number");
      setLoading(false);
      return;
    }
    
    if (formData.cardExpiry.length < 5) {
      toast.error("Please enter a valid expiry date (MM/YY)");
      setLoading(false);
      return;
    }
    
    if (formData.cardCvc.length < 3) {
      toast.error("Please enter a valid CVC");
      setLoading(false);
      return;
    }
    
    try {
      // In a real app, you would use a payment processor like Stripe
      // This is a simplified example to demonstrate the UI flow
      const last4 = formData.cardNumber.replace(/\s/g, "").slice(-4);
      const brand = getCardBrand(formData.cardNumber);
      
      const { error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: userId,
          card_last4: last4,
          card_brand: brand,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast.success("Payment method added successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to add payment method");
    } finally {
      setLoading(false);
    }
  };
  
  // Function to determine card brand based on first digits
  const getCardBrand = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, "");
    
    if (/^4/.test(number)) return "Visa";
    if (/^5[1-5]/.test(number)) return "Mastercard";
    if (/^3[47]/.test(number)) return "American Express";
    if (/^6(?:011|5)/.test(number)) return "Discover";
    return "Unknown";
  };
  
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardName">Name on Card</Label>
            <Input
              id="cardName"
              name="cardName"
              placeholder="John Doe"
              value={formData.cardName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              name="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cardExpiry">Expiry Date</Label>
              <Input
                id="cardExpiry"
                name="cardExpiry"
                placeholder="MM/YY"
                value={formData.cardExpiry}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cardCvc">CVC</Label>
              <Input
                id="cardCvc"
                name="cardCvc"
                placeholder="123"
                value={formData.cardCvc}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Payment Method"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
