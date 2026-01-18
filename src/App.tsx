import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ListaCerdas from "./pages/ListaCerdas";
import FichaCerda from "./pages/FichaCerda";
import NuevaCerda from "./pages/NuevaCerda";
import Incidencias from "./pages/Incidencias";
import Reportes from "./pages/Reportes";
import GestionUsuarios from "./pages/GestionUsuarios";
import GestionVerracos from "./pages/GestionVerracos";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/cerdas" element={<ProtectedRoute><ListaCerdas /></ProtectedRoute>} />
      <Route path="/cerda/:id" element={<ProtectedRoute><FichaCerda /></ProtectedRoute>} />
      <Route path="/nueva-cerda" element={<ProtectedRoute><AdminRoute><NuevaCerda /></AdminRoute></ProtectedRoute>} />
      <Route path="/incidencias" element={<ProtectedRoute><Incidencias /></ProtectedRoute>} />
      <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><AdminRoute><GestionUsuarios /></AdminRoute></ProtectedRoute>} />
      <Route path="/verracos" element={<ProtectedRoute><AdminRoute><GestionVerracos /></AdminRoute></ProtectedRoute>} />
      <Route path="/configuracion" element={<ProtectedRoute><AdminRoute><Configuracion /></AdminRoute></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
