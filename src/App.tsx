import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { InstallPrompt } from "@/components/InstallPrompt";
import { paths } from "@/routes/paths";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicBlend from "./pages/PublicBlend";
import BatchRedirect from "./pages/BatchRedirect";
import BlendRedirect from "./pages/BlendRedirect";
import PrintLabels from "./pages/PrintLabels";
import SupplierDetail from "./pages/SupplierDetail";
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
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <InstallPrompt />
        <BrowserRouter>
          <Routes>
            <Route path={paths.root()} element={<Navigate to={paths.batches()} replace />} />
            <Route path={paths.batches()} element={<Index />} />
            <Route path={paths.production()} element={<Index />} />
            <Route path={paths.blending()} element={<Index />} />
            <Route path={paths.cellar()} element={<Index />} />
            <Route path={paths.tasting()} element={<Index />} />
            <Route path={paths.analytics()} element={<Index />} />
            <Route path={paths.suppliers()} element={<Index />} />
            <Route path="/tools/:toolView?" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/blend/:id" element={<PublicBlend />} />
            <Route path="/r/b/:id" element={<BatchRedirect />} />
            <Route path="/r/l/:id" element={<BlendRedirect />} />
            <Route path="/print/labels" element={<PrintLabels />} />
            <Route path="/suppliers/:id" element={<SupplierDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
