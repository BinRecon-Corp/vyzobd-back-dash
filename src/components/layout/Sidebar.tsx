import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Tag,
  Boxes,
  ShieldCheck,
  UserCog,
  Key,
  Ticket,
  Zap,
  Megaphone,
  Image,
  Layers,
  FileText,
  PenTool,
  Search,
  LayoutTemplate,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { hasPermission } = useAuth();
  const { branding } = useBranding();
  const [logoError, setLogoError] = React.useState(false);

  const logoSource = branding.adminPanelLogo || branding.logoUrl;
  const portalName = branding.adminPanelName || branding.siteName || "Admin Portal";

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/', module: 'Dashboard' },
    { icon: FolderTree, label: 'Categories', href: '/categories', module: 'Categories' },
    { icon: Tag, label: 'Brands', href: '/brands', module: 'Brands' },
    { icon: Package, label: 'Products', href: '/products', module: 'Products' },
    { icon: Boxes, label: 'Inventory', href: '/inventory', module: 'Inventory' },
    { icon: ShoppingCart, label: 'Orders', href: '/orders', module: 'Orders' },
    { icon: Users, label: 'Customers', href: '/customers', module: 'Customers' },
    { icon: Ticket, label: 'Coupons', href: '/admin/coupons', module: 'Coupons' },
    { icon: Zap, label: 'Promotions', href: '/admin/promotions', module: 'Promotions' },
    { icon: Megaphone, label: 'Marketing', href: '/admin/marketing', module: 'Marketing' },
    { icon: Image, label: 'Banners', href: '/admin/banners', module: 'Banners' },
    { icon: Layers, label: 'Popups', href: '/admin/popups', module: 'Popups' },
    { icon: FileText, label: 'CMS Pages', href: '/admin/cms', module: 'CMS' },
    { icon: PenTool, label: 'Blog', href: '/admin/blog', module: 'Blog' },
    { icon: Search, label: 'SEO Settings', href: '/admin/seo', module: 'SEO' },
    { icon: LayoutTemplate, label: 'Landing Pages', href: '/admin/landing-pages', module: 'LandingPages' },
    { icon: Image, label: 'Media Library', href: '/admin/media', module: 'Media' },
    { icon: HelpCircle, label: 'FAQs', href: '/admin/faqs', module: 'FAQ' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics', module: 'Analytics' },
    { icon: ShoppingCart, label: 'Payments', href: '/admin/payments', module: 'Payments' },
    { icon: ShoppingCart, label: 'Refunds', href: '/admin/refunds', module: 'Refunds' },
    { icon: ShoppingCart, label: 'Returns', href: '/admin/returns', module: 'Returns' },
    { icon: Package, label: 'Shipments', href: '/admin/shipments', module: 'Shipments' },
    { icon: ShieldCheck, label: 'Audit Logs', href: '/admin/audit-logs', module: 'AuditLogs' },
    { icon: Megaphone, label: 'Notifications', href: '/admin/notifications', module: 'Notifications' },
    { icon: UserCog, label: 'Users', href: '/admin/users', module: 'Users' },
    { icon: Key, label: 'Roles', href: '/admin/roles', module: 'Roles' },
    { icon: ShieldCheck, label: 'Sessions', href: '/admin/sessions', module: 'Sessions' },
    { icon: Settings, label: 'Settings', href: '/settings', module: 'Settings' },
  ];

  const visibleNavItems = navItems.filter(item => 
    item.module === 'Dashboard' || hasPermission(item.module, 'read')
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
          "border-r border-slate-200 dark:border-slate-800 shadow-xl",
          "transition-all duration-300 ease-in-out",
          isOpen ? "w-64 translate-x-0" : "w-16 -translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {isOpen ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              {logoSource && !logoError ? (
                <img
                  src={logoSource}
                  alt={portalName}
                  onError={() => setLogoError(true)}
                  className="h-8 max-w-[140px] object-contain shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {portalName.charAt(0)}
                </div>
              )}
              <span className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                {portalName}
              </span>
            </div>
          ) : (
            <div className="mx-auto">
              {logoSource && !logoError ? (
                <img
                  src={logoSource}
                  alt={portalName}
                  onError={() => setLogoError(true)}
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {portalName.charAt(0)}
                </div>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ml-auto md:flex hidden"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ml-auto md:hidden"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          <ul className="space-y-1 px-2">
            {visibleNavItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
                    "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800",
                    isActive && "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold",
                    !isOpen && "justify-center px-0"
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {isOpen && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
