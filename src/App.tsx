import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { InstallPrompt } from "@/components/InstallPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicBlend from "./pages/PublicBlend";
import BatchRedirect from "./pages/BatchRedirect";
import BlendRedirect from "./pages/BlendRedirect";
import PrintLabels from "./pages/PrintLabels";
import PlanningTool from "./pages/PlanningTool";
import Suppliers from "./pages/Suppliers";
import SupplierDetail from "./pages/SupplierDetail";
import Webhooks from "./pages/Webhooks";
import Install from "./pages/Install";
import "@/styles/print.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <InstallPrompt />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/batches" replace />} />
            <Route path="/batches" element={<Index />} />
            <Route path="/production" element={<Index />} />
            <Route path="/blending" element={<Index />} />
            <Route path="/cellar" element={<Index />} />
            <Route path="/tasting" element={<Index />} />
            <Route path="/tools/:toolView?" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/blend/:id" element={<PublicBlend />} />
            <Route path="/r/b/:id" element={<BatchRedirect />} />
            <Route path="/r/l/:id" element={<BlendRedirect />} />
            <Route path="/print/labels" element={<PrintLabels />} />
            <Route path="/planning" element={<PlanningTool />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/suppliers/:id" element={<SupplierDetail />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/install" element={<Install />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
