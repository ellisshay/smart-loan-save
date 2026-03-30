import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import DashboardLayout from "@/components/DashboardLayout";
import AdvisorLayout from "@/components/AdvisorLayout";
import HomePage from "./pages/HomePage";
import CalculatorsHub from "./pages/CalculatorsHub";
import WasteCalculator from "./pages/WasteCalculator";
import NewMortgageCalculator from "./pages/NewMortgageCalculator";
import SavingsCalculator from "./pages/SavingsCalculator";
import RefinanceCalculator from "./pages/RefinanceCalculator";
import MixCalculator from "./pages/MixCalculator";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import BlogPage from "./pages/BlogPage";
import LegalPage from "./pages/LegalPage";
import ForAdvisorsPage from "./pages/ForAdvisorsPage";
import AuthPage from "./pages/AuthPage";
import IntakePage from "./pages/IntakePage";
import IntakeSuccessPage from "./pages/IntakeSuccessPage";
import MixSelectionPage from "./pages/MixSelectionPage";
import MyCasesPage from "./pages/MyCasesPage";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardStatus from "./pages/dashboard/DashboardStatus";
import DashboardPersonal from "./pages/dashboard/DashboardPersonal";
import DashboardProperty from "./pages/dashboard/DashboardProperty";
import DashboardIncome from "./pages/dashboard/DashboardIncome";
import DashboardLiabilities from "./pages/dashboard/DashboardLiabilities";
import DashboardMortgage from "./pages/dashboard/DashboardMortgage";
import DashboardDeclarations from "./pages/dashboard/DashboardDeclarations";
import DashboardDocuments from "./pages/dashboard/DashboardDocuments";
import DashboardPayment from "./pages/dashboard/DashboardPayment";
import DashboardOffers from "./pages/dashboard/DashboardOffers";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCasesList from "./pages/admin/AdminCasesList";
import AdminCaseDetail from "./pages/admin/AdminCaseDetail";
import AdvisorDashboard from "./pages/advisor/AdvisorDashboard";
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
          
          {/* Dashboard — protected via DashboardLayout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="status" element={<DashboardStatus />} />
            <Route path="personal" element={<DashboardPersonal />} />
            <Route path="property" element={<DashboardProperty />} />
            <Route path="income" element={<DashboardIncome />} />
            <Route path="liabilities" element={<DashboardLiabilities />} />
            <Route path="mortgage" element={<DashboardMortgage />} />
            <Route path="declarations" element={<DashboardDeclarations />} />
            <Route path="documents" element={<DashboardDocuments />} />
            <Route path="payment" element={<DashboardPayment />} />
            <Route path="offers" element={<DashboardOffers />} />
          </Route>

          {/* Advisor routes */}
          <Route path="/advisor" element={<AdvisorLayout />}>
            <Route index element={<AdvisorDashboard />} />
          </Route>

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
          <Route path="/calculators/new-mortgage" element={<Layout><NewMortgageCalculator /></Layout>} />
          <Route path="/calculators/savings" element={<Layout><SavingsCalculator /></Layout>} />
          <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
          <Route path="/about" element={<Layout><AboutPage /></Layout>} />
          <Route path="/how-it-works" element={<Layout><HowItWorksPage /></Layout>} />
          <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
          <Route path="/blog" element={<Layout><BlogPage /></Layout>} />
          <Route path="/legal/:page" element={<Layout><LegalPage /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
