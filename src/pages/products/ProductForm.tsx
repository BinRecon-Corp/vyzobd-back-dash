import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { getCategories } from '../../services/category.service';
import { getBrands } from '../../services/brand.service';

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const { data: categories = [] } = useQuery<any[]>({ queryKey: ['categories'], queryFn: () => getCategories() });
  const { data: brands = [] } = useQuery<any[]>({ queryKey: ['brands'], queryFn: getBrands });

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    shortDescription: initialData?.shortDescription || '',
    price: initialData?.price || '',
    compareAtPrice: initialData?.compareAtPrice || '',
    costPrice: initialData?.costPrice || '',
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    gtin: initialData?.gtin || '',
    mpn: initialData?.mpn || '',
    condition: initialData?.condition || 'new',
    stock: initialData?.inventory?.quantity || 0,
    lowStockThreshold: initialData?.inventory?.lowStockThreshold || 10,
    trackInventory: initialData?.trackInventory === false ? false : true,
    status: initialData?.status || 'Draft',
    categoryId: initialData?.categoryId || '',
    brandId: initialData?.brandId || '',
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || '',
    image: initialData?.images?.find((img: any) => img.isPrimary)?.url || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug (Optional)</label>
                <Input name="slug" value={formData.slug} onChange={handleChange} placeholder="auto-generated-if-empty" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Description</label>
                <textarea 
                  name="shortDescription" 
                  value={formData.shortDescription} 
                  onChange={handleChange} 
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing & Inventory</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price</label>
                  <Input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Compare at Price</label>
                  <Input type="number" step="0.01" name="compareAtPrice" value={formData.compareAtPrice} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cost Price</label>
                  <Input type="number" step="0.01" name="costPrice" value={formData.costPrice} onChange={handleChange} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU</label>
                  <Input name="sku" value={formData.sku} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Barcode</label>
                  <Input name="barcode" value={formData.barcode} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">GTIN</label>
                  <Input name="gtin" value={formData.gtin} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">MPN</label>
                  <Input name="mpn" value={formData.mpn} onChange={handleChange} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Condition</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="new">New</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="used">Used</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="trackInventory" 
                    checked={formData.trackInventory} 
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Track Inventory</span>
                </label>

                {formData.trackInventory && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Stock Quantity</label>
                      <Input type="number" name="stock" value={formData.stock} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Low Stock Threshold</label>
                      <Input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Search Engine Optimization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Meta Title</label>
                <Input name="metaTitle" value={formData.metaTitle} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Meta Description</label>
                <textarea 
                  name="metaDescription" 
                  value={formData.metaDescription} 
                  onChange={handleChange} 
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select 
                  name="categoryId" 
                  value={formData.categoryId} 
                  onChange={handleChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select Category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <select 
                  name="brandId" 
                  value={formData.brandId} 
                  onChange={handleChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select Brand</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Media</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Image URL</label>
                <Input name="image" value={formData.image} onChange={handleChange} placeholder="https://..." />
                {formData.image && (
                  <div className="mt-2 relative aspect-square w-full max-w-[200px] overflow-hidden rounded-md border">
                    <img src={formData.image} alt="Preview" className="object-cover w-full h-full" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Product'}</Button>
      </div>
    </form>
  );
}
