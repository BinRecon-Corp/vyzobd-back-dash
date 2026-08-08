import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';

export function LandingPagesList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6 text-primary" /> Landing Page Builder
        </h1>
        <p className="text-sm text-muted-foreground">Create dynamic marketing landing pages with rich content blocks.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Landing Pages</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Landing page builder module.</p>
        </CardContent>
      </Card>
    </div>
  );
}
