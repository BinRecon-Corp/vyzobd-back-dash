import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';

export function MediaLibrary() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-primary" /> Media Library
        </h1>
        <p className="text-sm text-muted-foreground">Manage and organize all images and assets uploaded to the platform.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Upload, edit, and organize files.</p>
        </CardContent>
      </Card>
    </div>
  );
}
