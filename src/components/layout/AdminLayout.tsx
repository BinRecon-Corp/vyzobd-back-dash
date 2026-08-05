import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/src/lib/utils';

export function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
