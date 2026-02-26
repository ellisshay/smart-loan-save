import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import HomePage from "./pages/HomePage";
import CalculatorsHub from "./pages/CalculatorsHub";
import WasteCalculator from "./pages/WasteCalculator";
import RefinanceCalculator from "./pages/RefinanceCalculator";
import MixCalculator from "./pages/MixCalculator";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/calculators" element={<CalculatorsHub />} />
            <Route path="/calculators/waste" element={<WasteCalculator />} />
            <Route path="/calculators/refinance" element={<RefinanceCalculator />} />
            <Route path="/calculators/mix" element={<MixCalculator />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/legal/:page" element={<LegalPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
