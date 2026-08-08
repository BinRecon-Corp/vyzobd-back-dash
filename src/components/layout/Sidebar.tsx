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
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '../ui/button';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FolderTree, label: 'Categories', href: '/categories' },
  { icon: Tag, label: 'Brands', href: '/brands' },
  { icon: Package, label: 'Products', href: '/products' },
  { icon: Boxes, label: 'Inventory', href: '/inventory' },
  { icon: ShoppingCart, label: 'Orders', href: '/orders' },
  { icon: Users, label: 'Customers', href: '/customers' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: BarChart3, label: 'GA4 Tracking', href: '/analytics/ga4-example' },
  { icon: ShieldCheck, label: 'Audit Logs', href: '/settings/audit-logs' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onToggle}
        />
      )}
      
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-background border-r transition-all duration-300 ease-in-out flex flex-col",
        isOpen ? "w-64 translate-x-0" : "w-16 -translate-x-full md:translate-x-0"
      )}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {isOpen && <span className="font-bold text-lg tracking-tight">Admin<span className="text-primary">Pro</span></span>}
        {!isOpen && <span className="font-bold text-lg tracking-tight mx-auto text-primary">A</span>}
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              !isOpen && "justify-center px-0"
            )}
            title={!isOpen ? item.label : undefined}
            onClick={() => {
              if (window.innerWidth < 768) {
                onToggle();
              }
            }}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {isOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onToggle}
          className="w-full flex justify-center"
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>
    </aside>
    </>
  );
}
