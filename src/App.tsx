import DashboardPrivacy from "./pages/dashboard/DashboardPrivacy";
import AdminPrivacy from "./pages/admin/AdminPrivacy";
import ConsentGate from "@/components/privacy/ConsentGate";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { NoIndex } from "@/components/seo/Seo";
import { isPrivatePath } from "@/seo/config";
import { redirects } from "@/seo/pages";
import type { ReactNode } from "react";
import Layout from "@/components/Layout";
import NudgeBanner from "@/components/results/NudgeBanner";
import AdminLayout from "@/components/AdminLayout";
import DashboardLayout from "@/components/DashboardLayout";
import AdvisorLayout from "@/components/AdvisorLayout";
import HomePage from "./pages/HomePage";

// Lazy-loaded pages
const CalculatorsHub = lazy(() => import("./pages/CalculatorsHub"));
const WasteCalculator = lazy(() => import("./pages/WasteCalculator"));
const NewMortgageCalculator = lazy(() => import("./pages/NewMortgageCalculator"));
const SavingsCalculator = lazy(() => import("./pages/SavingsCalculator"));
const MortgageCheckPage = lazy(() => import("./pages/MortgageCheckPage"));
const RefinanceCalculator = lazy(() => import("./pages/RefinanceCalculator"));
const MixCalculator = lazy(() => import("./pages/MixCalculator"));
const AffordabilityCalculator = lazy(() => import("./pages/AffordabilityCalculator"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const KnowledgeHub = lazy(() => import("./pages/KnowledgeHub"));
const KnowledgeArticlePage = lazy(() => import("./pages/KnowledgeArticle"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const IntakePage = lazy(() => import("./pages/IntakePage"));
const IntakeSuccessPage = lazy(() => import("./pages/IntakeSuccessPage"));
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
const DashboardTender = lazy(() => import("./pages/dashboard/DashboardTender"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCasesList = lazy(() => import("./pages/admin/AdminCasesList"));
const AdminCaseDetail = lazy(() => import("./pages/admin/AdminCaseDetail"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdvisorDashboard = lazy(() => import("./pages/advisor/AdvisorDashboard"));
const AdvisorOfferPage = lazy(() => import("./pages/advisor/AdvisorOfferPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ServiceLandingPage = lazy(() => import("./pages/ServiceLandingPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

/** Adds noindex,nofollow to every private route (client area, admin, auth, intake, payment). */
const RobotsGuard = () => {
  const { pathname } = useLocation();
  return isPrivatePath(pathname) ? <NoIndex /> : null;
};

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {children}
    </TooltipProvider>
  </QueryClientProvider>
);

export const AppRoutes = () => (
  <>
    <RobotsGuard />
    <NudgeBanner />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Dashboard, protected via DashboardLayout */}
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
          <Route path="tender" element={<DashboardTender />} />
          <Route path="privacy" element={<DashboardPrivacy />} />
        </Route>

        {/* Advisor routes */}
        <Route path="/advisor" element={<AdvisorLayout />}>
          <Route index element={<AdvisorDashboard />} />
          <Route path="offer/:leadId" element={<AdvisorOfferPage />} />
        </Route>

        {/* Client area */}
        <Route path="/my-cases" element={<Layout><MyCasesPage /></Layout>} />

        {/* Intake flow */}
        <Route path="/intake" element={<Layout><ConsentGate><IntakePage /></ConsentGate></Layout>} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/intake/success" element={<Layout><IntakeSuccessPage /></Layout>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="cases" element={<AdminCasesList />} />
          <Route path="cases/:id" element={<AdminCaseDetail />} />
          <Route path="privacy" element={<AdminPrivacy />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Old URLs -> canonical URLs */}
        {Object.entries(redirects).map(([from, to]) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}

        {/* Public routes */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/first-mortgage" element={<Layout><ServiceLandingPage /></Layout>} />
        <Route path="/mortgage" element={<Layout><ServiceLandingPage /></Layout>} />
        <Route path="/mortgage-refinance" element={<Layout><ServiceLandingPage /></Layout>} />
        <Route path="/mortgage-advisor" element={<Layout><ServiceLandingPage /></Layout>} />
        <Route path="/mortgage-tender" element={<Layout><ServiceLandingPage /></Layout>} />
        <Route path="/calculators" element={<Layout><CalculatorsHub /></Layout>} />
        <Route path="/calculators/waste" element={<Layout><WasteCalculator /></Layout>} />
        <Route path="/calculators/mix" element={<Layout><MixCalculator /></Layout>} />
        <Route path="/calculators/savings" element={<Layout><SavingsCalculator /></Layout>} />
        <Route path="/calculators/affordability" element={<Layout><AffordabilityCalculator /></Layout>} />
        <Route path="/mortgage-calculator" element={<Layout><NewMortgageCalculator /></Layout>} />
        <Route path="/mortgage-check" element={<Layout><MortgageCheckPage /></Layout>} />
        <Route path="/refinance-calculator" element={<Layout><RefinanceCalculator /></Layout>} />
        <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/how-it-works" element={<Layout><HowItWorksPage /></Layout>} />
        <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
        <Route path="/faq" element={<Layout><FaqPage /></Layout>} />
        <Route path="/knowledge" element={<Layout><KnowledgeHub /></Layout>} />
        <Route path="/knowledge/:slug" element={<Layout><KnowledgeArticlePage /></Layout>} />
        <Route path="/blog/:slug" element={<Layout><ArticlePage /></Layout>} />
        <Route path="/for-advisors" element={<Navigate to="/" replace />} />
        <Route path="/privacy" element={<Layout><LegalPage page="privacy" /></Layout>} />
        <Route path="/terms" element={<Layout><LegalPage page="terms" /></Layout>} />
        <Route path="/legal/:page" element={<Layout><LegalPage /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </Suspense>
  </>
);

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AppProviders>
);

export default App;
