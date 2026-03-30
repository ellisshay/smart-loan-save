import { lazy, Suspense } from "react";
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

// Lazy-loaded pages
const CalculatorsHub = lazy(() => import("./pages/CalculatorsHub"));
const WasteCalculator = lazy(() => import("./pages/WasteCalculator"));
const NewMortgageCalculator = lazy(() => import("./pages/NewMortgageCalculator"));
const SavingsCalculator = lazy(() => import("./pages/SavingsCalculator"));
const RefinanceCalculator = lazy(() => import("./pages/RefinanceCalculator"));
const MixCalculator = lazy(() => import("./pages/MixCalculator"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const ForAdvisorsPage = lazy(() => import("./pages/ForAdvisorsPage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const IntakePage = lazy(() => import("./pages/IntakePage"));
const IntakeSuccessPage = lazy(() => import("./pages/IntakeSuccessPage"));
const MixSelectionPage = lazy(() => import("./pages/MixSelectionPage"));
const MyCasesPage = lazy(() => import("./pages/MyCasesPage"));
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const DashboardStatus = lazy(() => import("./pages/dashboard/DashboardStatus"));
const DashboardPersonal = lazy(() => import("./pages/dashboard/DashboardPersonal"));
const DashboardProperty = lazy(() => import("./pages/dashboard/DashboardProperty"));
const DashboardIncome = lazy(() => import("./pages/dashboard/DashboardIncome"));
const DashboardLiabilities = lazy(() => import("./pages/dashboard/DashboardLiabilities"));
const DashboardMortgage = lazy(() => import("./pages/dashboard/DashboardMortgage"));
const DashboardDeclarations = lazy(() => import("./pages/dashboard/DashboardDeclarations"));
const DashboardDocuments = lazy(() => import("./pages/dashboard/DashboardDocuments"));
const DashboardPayment = lazy(() => import("./pages/dashboard/DashboardPayment"));
const DashboardOffers = lazy(() => import("./pages/dashboard/DashboardOffers"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCasesList = lazy(() => import("./pages/admin/AdminCasesList"));
const AdminCaseDetail = lazy(() => import("./pages/admin/AdminCaseDetail"));
const AdvisorDashboard = lazy(() => import("./pages/advisor/AdvisorDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
          <Route path="/blog/:slug" element={<Layout><ArticlePage /></Layout>} />
          <Route path="/for-advisors" element={<Layout><ForAdvisorsPage /></Layout>} />
          <Route path="/legal/:page" element={<Layout><LegalPage /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
