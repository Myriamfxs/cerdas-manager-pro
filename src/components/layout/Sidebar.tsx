import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PiggyBank, 
  Plus, 
  AlertTriangle, 
  FileText, 
  Settings,
  Users,
  Beef,
  LogOut,
  Menu,
  X,
  CalendarSearch
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/cerdas', icon: PiggyBank, label: 'Lista Cerdas' },
  { path: '/nueva-cerda', icon: Plus, label: 'Nueva Cerda', adminOnly: true },
  { path: '/incidencias', icon: AlertTriangle, label: 'Incidencias' },
  { path: '/consulta-eventos', icon: CalendarSearch, label: 'Consulta Eventos' },
  { path: '/reportes', icon: FileText, label: 'Reportes' },
  { path: '/verracos', icon: Beef, label: 'Verracos', adminOnly: true },
  { path: '/usuarios', icon: Users, label: 'Usuarios', adminOnly: true },
  { path: '/configuracion', icon: Settings, label: 'Configuración', adminOnly: true },
];

export function Sidebar() {
  const location = useLocation();
  const { profile, role, signOut, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-lg text-sidebar-foreground"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-sidebar flex flex-col z-40 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-sidebar-foreground">
                Cerdas Pro
              </h1>
              <p className="text-xs text-sidebar-foreground/60">Gestión Porcina</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "nav-item",
                  isActive && "nav-item-active"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3 px-4">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-semibold text-sidebar-foreground">
                {profile?.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.nombre || 'Usuario'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {role || 'Sin rol'}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
