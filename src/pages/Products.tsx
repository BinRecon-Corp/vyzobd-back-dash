import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Plus, Search, MoreHorizontal } from 'lucide-react';

const products = [
  { id: '1', name: 'MacBook Pro 14"', sku: 'APP-MBP-14', price: 1999.00, stock: 45, status: 'Active', category: 'Electronics' },
  { id: '2', name: 'iPhone 15 Pro', sku: 'APP-IP15-P', price: 999.00, stock: 12, status: 'Low Stock', category: 'Electronics' },
  { id: '3', name: 'AirPods Max', sku: 'APP-APM', price: 549.00, stock: 0, status: 'Out of Stock', category: 'Audio' },
  { id: '4', name: 'Magic Keyboard', sku: 'APP-MK', price: 149.00, stock: 120, status: 'Active', category: 'Accessories' },
  { id: '5', name: 'iPad Air', sku: 'APP-IPA', price: 599.00, stock: 85, status: 'Active', category: 'Electronics' },
];

export function Products() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" aria-label="Search products" placeholder="Search products..." className="pl-8" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Filter</Button>
              <Button variant="outline" size="sm">Export</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={
                      product.status === 'Active' ? 'success' : 
                      product.status === 'Low Stock' ? 'warning' : 'destructive'
                    }>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label={`Actions for ${product.name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
