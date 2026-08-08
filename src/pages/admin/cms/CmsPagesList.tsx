import React from 'react';
import { FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';

export function CmsPagesList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> CMS Page Management
        </h1>
        <p className="text-sm text-muted-foreground">Manage standard pages like Home, About, Contact, Policies.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Pages List</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">CMS pages module is integrated via API. Add, Edit, Delete pages here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
