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
  Key
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
    { icon: BarChart3, label: 'Analytics', href: '/analytics', module: 'Analytics' },
    { icon: ShieldCheck, label: 'Audit Logs', href: '/admin/audit-logs', module: 'Security' },
    { icon: UserCog, label: 'Users', href: '/admin/users', module: 'Users' },
    { icon: Key, label: 'Roles', href: '/admin/roles', module: 'Roles' },
    { icon: ShieldCheck, label: 'Sessions', href: '/admin/sessions', module: 'Security' },
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
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
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
