import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';

export function SeoManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" /> Global SEO & Sitemap
        </h1>
        <p className="text-sm text-muted-foreground">Configure global meta tags, robots.txt, and sitemap generation.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Global SEO Settings</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage defaults for the whole site.</p>
        </CardContent>
      </Card>
    </div>
  );
}
