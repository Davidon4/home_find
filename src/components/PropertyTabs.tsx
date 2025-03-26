
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Home, DollarSign, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const PropertyTabs = () => {
  const [activeTab, setActiveTab] = useState("buy");

  return (
    <Tabs defaultValue="buy" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-3 mb-6 w-full">
        <TabsTrigger value="buy" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span>Buy a property</span>
        </TabsTrigger>
        <TabsTrigger value="sell" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <span>Sell a property</span>
        </TabsTrigger>
        <TabsTrigger value="analyze" className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          <span>Investment analysis</span>
        </TabsTrigger>
      </TabsList>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <TabsContent value="buy" className="p-6 animate-fade-in">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-2">Find your next investment property</h3>
            <p className="text-gray-600">
              Browse our curated selection of high-potential UK investment properties with detailed ROI analysis and market comparisons.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Why buy with us:</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Exclusive listings with verified ROI data</li>
                  <li>Detailed neighborhood analysis</li>
                  <li>Property management solutions available</li>
                  <li>Expert negotiation support</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Our buyer guarantees:</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>100% transparency on property history</li>
                  <li>Verified rental income estimates</li>
                  <li>Full property inspection reports</li>
                  <li>Legal fee contribution on completion</li>
                </ul>
              </div>
            </div>
            <Link to="/invest">
              <Button className="mt-4">Browse properties</Button>
            </Link>
          </div>
        </TabsContent>
        
        <TabsContent value="sell" className="p-6 animate-fade-in">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-2">List your property for sale</h3>
            <p className="text-gray-600">
              Connect with qualified investors across the UK market. We'll help you showcase your property's investment potential with detailed analytics.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Why sell with us:</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Target audience of serious investors</li>
                  <li>Professional photography included</li>
                  <li>Investment analysis to attract buyers</li>
                  <li>Managed viewings service</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Our seller packages:</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Standard listing with ROI analysis</li>
                  <li>Premium listing with virtual tours</li>
                  <li>Auction option for quick sales</li>
                  <li>Full-service package with legal support</li>
                </ul>
              </div>
            </div>
            <Link to="/sell">
              <Button className="mt-4">Start selling</Button>
            </Link>
          </div>
        </TabsContent>
        
        <TabsContent value="analyze" className="p-6 animate-fade-in">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-2">Get detailed investment analysis</h3>
            <p className="text-gray-600">
              Access detailed market analysis, ROI projections, and rental yield estimates for UK property investments to make informed decisions.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Our analysis includes:</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Current market valuations</li>
                  <li>Projected capital appreciation</li>
                  <li>Rental yield calculations</li>
                  <li>Area growth trends</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Analysis methods:</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Comparable sales analysis</li>
                  <li>Cash flow projections</li>
                  <li>Risk assessment scoring</li>
                  <li>Tax efficiency calculations</li>
                </ul>
              </div>
            </div>
            <Link to="/invest">
              <Button className="mt-4">View analytics</Button>
            </Link>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
};
