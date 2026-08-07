const fs = require('fs');
const file = 'src/pages/GA4Example.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `import { \n  trackViewItem, \n  trackAddToCart, \n  trackBeginCheckout, \n  trackPurchase,\n  GA4Item\n} from '@/src/lib/ga4';`,
  `import { useGA4 } from '@/src/hooks/useGA4';\nimport { GA4Item } from '@/src/lib/ga4-ecommerce';`
);

code = code.replace(
  `export function GA4Example() {\n  const handleViewItem`,
  `export function GA4Example() {\n  const { trackViewItem, trackAddToCart, trackBeginCheckout, trackPurchase } = useGA4();\n  const handleViewItem`
);

fs.writeFileSync(file, code);
