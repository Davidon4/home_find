
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CreditCard, User, Trash2, Plus } from "lucide-react";
import { PaymentMethodForm } from "@/components/ui/payment-method-form";

interface PaymentMethod {
  id: string;
  card_last4: string;
  card_brand: string;
  is_default: boolean;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
}

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No session found");
      }

      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
      setFormData({
        full_name: profileData.full_name || "",
        email: profileData.email || "",
      });

      // Load payment methods
      const { data: paymentData, error: paymentError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", session.user.id)
        .order("is_default", { ascending: false });

      if (paymentError) throw paymentError;
      setPaymentMethods(paymentData || []);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile?.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      loadUserData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentForm(true);
  };

  const handlePaymentFormCancel = () => {
    setShowAddPaymentForm(false);
  };

  const handlePaymentFormSuccess = () => {
    setShowAddPaymentForm(false);
    loadUserData();
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", paymentMethodId);

      if (error) throw error;
      toast.success("Payment method removed");
      loadUserData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      // First, set all payment methods to non-default
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", profile?.id);

      // Then set the selected one as default
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", paymentMethodId);

      if (error) throw error;
      toast.success("Default payment method updated");
      loadUserData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {method.card_brand} •••• {method.card_last4}
                        </p>
                        {method.is_default && (
                          <span className="text-sm text-primary">Default</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefaultPaymentMethod(method.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePaymentMethod(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {paymentMethods.length === 0 && !showAddPaymentForm && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No payment methods added yet
                  </p>
                )}

                {showAddPaymentForm ? (
                  <PaymentMethodForm 
                    userId={profile?.id || ""} 
                    onSuccess={handlePaymentFormSuccess}
                    onCancel={handlePaymentFormCancel}
                  />
                ) : (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleAddPaymentMethod}
                  >
                    <Plus className="h-4 w-4" />
                    Add New Payment Method
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
