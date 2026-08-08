const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf-8');

// Add imports
code = code.replace(/Megaphone,/, "Megaphone,\n  FileText,\n  PenTool,\n  Search,\n  LayoutTemplate,\n  HelpCircle,");

// Add menu items
const insertString = `
    { icon: FileText, label: 'CMS Pages', href: '/admin/cms', module: 'CMS' },
    { icon: PenTool, label: 'Blog', href: '/admin/blog', module: 'Blog' },
    { icon: Search, label: 'SEO Settings', href: '/admin/seo', module: 'SEO' },
    { icon: LayoutTemplate, label: 'Landing Pages', href: '/admin/landing-pages', module: 'LandingPages' },
    { icon: Image, label: 'Media Library', href: '/admin/media', module: 'Media' },
    { icon: HelpCircle, label: 'FAQs', href: '/admin/faqs', module: 'FAQ' },`;

code = code.replace(/{ icon: Layers, label: 'Popups', href: '\/admin\/popups', module: 'Banners' },/, 
  "{ icon: Layers, label: 'Popups', href: '/admin/popups', module: 'Banners' }," + insertString);

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
