import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SessionTimeout } from "@/components/SessionTimeout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateBag from "./pages/CreateBag";
import ScanQR from "./pages/ScanQR";
import BagDetail from "./pages/BagDetail";
import AdminDashboard from "./pages/AdminDashboard";
import Cases from "@/pages/Cases";
import CreateCase from "@/pages/CreateCase";
import CaseDetail from "@/pages/CaseDetail";
import DisposalRequests from "@/pages/DisposalRequests";
import Audits from "@/pages/Audits";
import AuditLog from "@/pages/AuditLog";
import Analytics from "@/pages/Analytics";
import SecurityDashboard from "@/pages/SecurityDashboard";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Help from "@/pages/Help";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "next-themes";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {session && <SessionTimeout />}
            <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/dashboard"
              element={session ? <Dashboard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/create"
              element={session ? <CreateBag /> : <Navigate to="/" replace />}
            />
            <Route
              path="/bag/:bagId"
              element={session ? <BagDetail /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin"
              element={session ? <AdminDashboard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/cases"
              element={session ? <Cases /> : <Navigate to="/" replace />}
            />
            <Route
              path="/cases/create"
              element={session ? <CreateCase /> : <Navigate to="/" replace />}
            />
            <Route
              path="/cases/:caseId"
              element={session ? <CaseDetail /> : <Navigate to="/" replace />}
            />
            <Route
              path="/disposal-requests"
              element={session ? <DisposalRequests /> : <Navigate to="/" replace />}
            />
            <Route
              path="/audits"
              element={session ? <Audits /> : <Navigate to="/" replace />}
            />
            <Route
              path="/audit-log"
              element={session ? <AuditLog /> : <Navigate to="/" replace />}
            />
            <Route
              path="/analytics"
              element={session ? <Analytics /> : <Navigate to="/" replace />}
            />
            <Route
              path="/security"
              element={session ? <SecurityDashboard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/profile"
              element={session ? <Profile /> : <Navigate to="/" replace />}
            />
            <Route
              path="/settings"
              element={session ? <Settings /> : <Navigate to="/" replace />}
            />
            <Route
              path="/help"
              element={session ? <Help /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <OfflineIndicator />
        </BrowserRouter>
      </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
