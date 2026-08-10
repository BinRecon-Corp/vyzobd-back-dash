import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/src/lib/utils';
import { ChevronRight } from 'lucide-react';

export function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setSidebarOpen(!isSidebarOpen)} />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        isSidebarOpen ? "md:ml-64" : "md:ml-16"
      )}>
        <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {pathnames.length > 0 && (
            <nav className="flex items-center text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                // Basic title case formatting
                const title = value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                return (
                  <React.Fragment key={to}>
                    <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
                    {isLast ? (
                      <span className="text-foreground font-medium" aria-current="page">{title}</span>
                    ) : (
                      <Link to={to} className="hover:text-foreground transition-colors">
                        {title}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
