import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useLastSeen } from "@/hooks/useLastSeen";
import { useNewUserWebhook } from "@/hooks/useNewUserWebhook";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Builder from "./pages/Builder";
import Dashboard from "./pages/Dashboard";
import Play from "./pages/Play";
import NotFound from "./pages/NotFound";
import Upgrade from "./pages/Upgrade";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ResetPassword from "./pages/ResetPassword";
import TermsOfService from "./pages/TermsOfService";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminUserDetail from "./pages/admin/UserDetail";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminPlans from "./pages/admin/Plans";
import AdminPlanFeatures from "./pages/admin/PlanFeatures";
import AdminPlanPricingFeatures from "./pages/admin/PlanPricingFeatures";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import SystemSettings from "./pages/admin/SystemSettings";
import Profile from "./pages/settings/Profile";
import Billing from "./pages/settings/Billing";
import Account from "./pages/settings/Account";

import Analytics from "./pages/Analytics";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Help from "./pages/Help";
import BlogPosts from "./pages/admin/BlogPosts";
import BlogPostEditor from "./pages/admin/BlogPostEditor";
import BlogCategories from "./pages/admin/BlogCategories";
import BlogComments from "./pages/admin/BlogComments";
import BlogMedia from "./pages/admin/BlogMedia";
import Promotions from "./pages/admin/Promotions";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const AppContent = () => {
  useLastSeen();
  useNewUserWebhook();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/builder/:appId?" element={<Builder />} />
          <Route path="/analytics/:appId" element={<Analytics />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/play/:shareCode" element={<Play />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/settings/profile" element={<Profile />} />
          <Route path="/settings/billing" element={<Billing />} />
          <Route path="/settings/account" element={<Account />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<SystemSettings />} />
          <Route path="/admin/plans" element={<AdminPlans />} />
          <Route path="/admin/plans/:planId/features" element={<AdminPlanFeatures />} />
          <Route path="/admin/plans/:planId/pricing-features" element={<AdminPlanPricingFeatures />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/blog/posts" element={<BlogPosts />} />
          <Route path="/admin/blog/posts/new" element={<BlogPostEditor />} />
          <Route path="/admin/blog/posts/edit/:id" element={<BlogPostEditor />} />
          <Route path="/admin/blog/categories" element={<BlogCategories />} />
          <Route path="/admin/blog/comments" element={<BlogComments />} />
          <Route path="/admin/blog/media" element={<BlogMedia />} />
          <Route path="/admin/promotions" element={<Promotions />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/help" element={<Help />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
