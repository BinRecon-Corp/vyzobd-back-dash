#!/bin/bash

# Pages
cat << 'PAGE' > src/pages/admin/cms/CmsPagesList.tsx
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
PAGE

# Blog
cat << 'PAGE' > src/pages/admin/blog/BlogManagement.tsx
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
PAGE

# SEO
cat << 'PAGE' > src/pages/admin/seo/SeoManagement.tsx
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
PAGE

# Landing Pages
cat << 'PAGE' > src/pages/admin/landing-pages/LandingPagesList.tsx
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
PAGE

# Media
cat << 'PAGE' > src/pages/admin/media/MediaLibrary.tsx
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
PAGE

# FAQ
cat << 'PAGE' > src/pages/admin/faqs/FaqManagement.tsx
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
PAGE

chmod +x generate_pages.sh
