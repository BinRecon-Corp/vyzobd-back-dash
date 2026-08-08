import React from 'react';
import { PenTool } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';

export function BlogManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PenTool className="h-6 w-6 text-primary" /> Blog Management
        </h1>
        <p className="text-sm text-muted-foreground">Manage blog posts, categories, and tags.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Posts</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Create and manage content for your blog.</p>
        </CardContent>
      </Card>
    </div>
  );
}
