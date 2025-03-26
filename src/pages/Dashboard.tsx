import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, DollarSign, Bell, Settings, LogOut, Clock, ArrowUpRight, ArrowDownRight, Ban, Search, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Property, BidWithProperty, Notification, formatCurrency, formatDate } from "@/types/database";
import { fetchUserBids, fetchUserNotifications, addFundsToProfile } from "@/utils/database";

interface Profile {
  id: string;
  balance: number;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

const marketTrendsData = [
  { month: 'Jan', value: 2500 },
  { month: 'Feb', value: 2600 },
  { month: 'Mar', value: 2800 },
  { month: 'Apr', value: 2750 },
  { month: 'May', value: 2900 },
  { month: 'Jun', value: 3000 },
];

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [recentBids, setRecentBids] = useState<BidWithProperty[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/sign-in');
        return;
      }
      setUser(session.user);
      await fetchUserData(session.user.id);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/sign-in');
      }
    });

    const channel = supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const newData = payload.new as Profile;
          if (newData && newData.id === user?.id) {
            setBalance(newData.balance || 0);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
        },
        () => {
          if (user?.id) {
            fetchUserBids(user.id).then(setRecentBids);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          if (newNotification.user_id === user?.id) {
            setNotifications(prev => [newNotification, ...prev]);
            toast.info(newNotification.message);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [navigate, user?.id]);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      
      if (profile) {
        setBalance(profile.balance || 0);
      }

      const bids = await fetchUserBids(userId);
      setRecentBids(bids);

      const notifications = await fetchUserNotifications(userId);
      setNotifications(notifications);

    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/sign-in');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddFunds = async () => {
    try {
      if (!user?.id) return;
      
      const amount = 1000; // For demo purposes, adding a fixed amount
      await addFundsToProfile(user.id, amount);
      toast.success(`Added ${formatCurrency(amount)} to your balance`);
      
      await fetchUserData(user.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePlaceBid = () => {
    navigate('/invest');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-primary">HomeFind</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.email}</h2>
          <Button onClick={() => navigate('/invest')}>
            <Search className="h-4 w-4 mr-2" />
            Explore Properties
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleAddFunds}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Funds
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentBids.filter(bid => bid.bid_status === 'Pending').length}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handlePlaceBid}
              >
                Place New Bid
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.filter(n => !n.read_status).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {notifications.filter(n => !n.read_status).length > 0 ? 
                  `${notifications.filter(n => !n.read_status).length} unread notifications` : 
                  'No new notifications'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Status</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last login: {lastLogin ? formatDate(lastLogin) : 'Today'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Bids</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentBids.length > 0 ? (
                recentBids.map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Property #{bid.property_id}</p>
                      <p className="text-xs text-gray-500">{formatDate(bid.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(bid.bid_amount)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        bid.bid_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        bid.bid_status === 'Accepted' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {bid.bid_status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No bids placed yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Find your perfect investment property and place your first bid!</p>
                  <Button onClick={() => navigate('/invest')}>Start Bidding</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} 
                       className={`flex items-center justify-between p-2 rounded-lg ${
                         notification.read_status ? 'bg-gray-50' : 'bg-blue-50'
                       }`}>
                    <div>
                      <p className="text-sm font-medium">{notification.message}</p>
                      <p className="text-xs text-gray-500">{formatDate(notification.created_at)}</p>
                    </div>
                    {!notification.read_status && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications yet</h3>
                  <p className="text-sm text-gray-500">We'll notify you of important updates here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
