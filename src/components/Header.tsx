
import { Building } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <Building className="h-6 w-6 mr-2" />
            <h1 className="text-2xl font-bold text-primary">HomeFind</h1>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Link to="/invest" className="text-sm text-gray-600 hover:text-gray-900">
              Browse Properties
            </Link>
            <Link to="/sell" className="text-sm text-gray-600 hover:text-gray-900">
              Sell Property
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
