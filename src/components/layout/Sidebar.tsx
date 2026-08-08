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

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { hasPermission } = useAuth();

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
    { icon: ShieldCheck, label: 'Audit Logs', href: '/admin/audit-logs', module: 'AuditLogs' },
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50",
          "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          isOpen ? "w-64" : "w-16 -translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border/50 shrink-0">
          {isOpen && (
            <span className="font-bold text-lg text-sidebar-foreground truncate">
              Admin Portal
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0 ml-auto lg:flex hidden"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0 ml-auto lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
          <ul className="space-y-1 px-2">
            {visibleNavItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                    isActive && "bg-sidebar-accent text-sidebar-foreground font-medium",
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
