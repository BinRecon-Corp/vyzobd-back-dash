const fs = require('fs');
const file = 'src/pages/Analytics.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'getGa4Metrics\n} from \'../services/analytics.service\';',
  'getGa4Metrics,\n  getBrandMetrics\n} from \'../services/analytics.service\';'
);

code = code.replace(
  'const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useQuery({\n    queryKey: [\'analytics-categories\'],\n    queryFn: getCategoryMetrics\n  });',
  'const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useQuery({\n    queryKey: [\'analytics-categories\'],\n    queryFn: getCategoryMetrics\n  });\n\n  const { data: brands, isLoading: brandsLoading, isError: brandsError } = useQuery({\n    queryKey: [\'analytics-brands\'],\n    queryFn: getBrandMetrics\n  });'
);

code = code.replace(
  'const isLoading = overviewLoading || revenueLoading || ordersLoading || productsLoading || categoriesLoading || ga4Loading;',
  'const isLoading = overviewLoading || revenueLoading || ordersLoading || productsLoading || categoriesLoading || ga4Loading || brandsLoading;'
);

code = code.replace(
  'const categorySales = categories || [];',
  'const categorySales = categories || [];\n  const brandSales = brands || [];'
);

code = code.replace(
  '<Card className="col-span-1">\n          <CardHeader>\n            <CardTitle>Category Sales</CardTitle>',
  '<Card className="col-span-1">\n          <CardHeader>\n            <CardTitle>Category Sales</CardTitle>'
);

// We need to add the Brand Sales card
const brandCard = `
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Brand Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandSales}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                  <YAxis fontSize={12} tickFormatter={(value) => \`$\${value}\`} />
                  <RechartsTooltip formatter={(value: number) => [\`$\${value.toFixed(2)}\`, 'Sales']} />
                  <Bar dataKey="sales" fill="#ec4899" name="Sales" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
`;

code = code.replace(
  '</Card>\n      </div>\n    </div>',
  '</Card>\n' + brandCard + '    </div>'
);

fs.writeFileSync(file, code);
