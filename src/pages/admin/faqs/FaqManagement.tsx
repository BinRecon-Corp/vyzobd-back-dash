import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';

export function FaqManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" /> FAQ Management
        </h1>
        <p className="text-sm text-muted-foreground">Organize frequently asked questions.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>FAQs</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Manage Q&A entries.</p>
        </CardContent>
      </Card>
    </div>
  );
}
