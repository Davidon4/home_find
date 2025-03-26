
import { Star } from "lucide-react";

export const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      content: "HomeFind helped me find the perfect buy-to-let property with a fantastic rental yield. Their investment analysis tools are incredible.",
      author: "Sarah Johnson",
      role: "Property Investor",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
    },
    {
      id: 2,
      content: "As a first-time investor, I was nervous about buying property. HomeFind's analytics gave me the confidence to make an informed decision.",
      author: "Mark Thompson",
      role: "First-time Investor",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
    },
    {
      id: 3,
      content: "The property crawler feature found me an off-market deal that other platforms missed. I've now expanded my portfolio to three properties.",
      author: "Alicia Chen",
      role: "Portfolio Investor",
      rating: 5,
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">What Our Investors Say</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Join thousands of satisfied property investors who've found success with HomeFind
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="flex mb-4">
              {Array(testimonial.rating).fill(null).map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
            <div className="flex items-center">
              <img 
                src={testimonial.image} 
                alt={testimonial.author}
                className="w-12 h-12 rounded-full object-cover mr-4" 
              />
              <div>
                <h4 className="font-semibold">{testimonial.author}</h4>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
