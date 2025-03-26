
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";
import GetStarted from "./pages/GetStarted";
import Index from "./pages/Index";
import Invest from "./pages/Invest";
import Sell from "./pages/Sell";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/invest" element={<Invest />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
