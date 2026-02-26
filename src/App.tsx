import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import HomePage from "./pages/HomePage";
import CalculatorsHub from "./pages/CalculatorsHub";
import WasteCalculator from "./pages/WasteCalculator";
import RefinanceCalculator from "./pages/RefinanceCalculator";
import MixCalculator from "./pages/MixCalculator";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import LegalPage from "./pages/LegalPage";
import AuthPage from "./pages/AuthPage";
import IntakePage from "./pages/IntakePage";
import IntakeSuccessPage from "./pages/IntakeSuccessPage";
import MixSelectionPage from "./pages/MixSelectionPage";
import MyCasesPage from "./pages/MyCasesPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCasesList from "./pages/admin/AdminCasesList";
import AdminCaseDetail from "./pages/admin/AdminCaseDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Client area */}
          <Route path="/my-cases" element={<MyCasesPage />} />

          {/* Intake flow */}
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/intake/success" element={<IntakeSuccessPage />} />
          <Route path="/mix-selection/:caseId" element={<MixSelectionPage />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="cases" element={<AdminCasesList />} />
            <Route path="cases/:id" element={<AdminCaseDetail />} />
          </Route>

          {/* Public routes */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/calculators" element={<Layout><CalculatorsHub /></Layout>} />
          <Route path="/calculators/waste" element={<Layout><WasteCalculator /></Layout>} />
          <Route path="/calculators/refinance" element={<Layout><RefinanceCalculator /></Layout>} />
          <Route path="/calculators/mix" element={<Layout><MixCalculator /></Layout>} />
          <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
          <Route path="/about" element={<Layout><AboutPage /></Layout>} />
          <Route path="/how-it-works" element={<Layout><HowItWorksPage /></Layout>} />
          <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
          <Route path="/legal/:page" element={<Layout><LegalPage /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
