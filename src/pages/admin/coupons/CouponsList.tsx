import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService, Coupon } from '../../../services/coupon.service';
import { 
  Ticket, 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  Edit3, 
  Power, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Percent,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { notify } from '../../../lib/notify';

export function CouponsList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    discountValue: 10,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 100,
    usagePerCustomer: 1,
    isActive: true,
  });

  const { data: couponsResponse, isLoading } = useQuery({
    queryKey: ['coupons', search, statusFilter],
    queryFn: () => couponService.getAll({ search, status: statusFilter !== 'all' ? statusFilter : undefined }),
  });

  const coupons: Coupon[] = couponsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: Partial<Coupon>) => couponService.create(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsModalOpen(false);
      resetForm();
      notify.success('Coupon Created', `Coupon code "${res?.code || formData.code}" created successfully.`);
    },
    onError: (err) => notify.apiError(err, 'Failed to create coupon.')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coupon> }) => couponService.update(id, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsModalOpen(false);
      setEditingCoupon(null);
      resetForm();
      notify.success('Coupon Updated', `Coupon code "${res?.code || 'Coupon'}" updated.`);
    },
    onError: (err) => notify.apiError(err, 'Failed to update coupon.')
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => couponService.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      notify.success('Status Updated', 'Coupon activation state changed.');
    },
    onError: (err) => notify.apiError(err, 'Failed to toggle coupon status.')
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => couponService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      notify.success('Coupon Duplicated', 'A cloned coupon draft was created.');
    },
    onError: (err) => notify.apiError(err, 'Failed to duplicate coupon.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      notify.success('Coupon Deleted', `Coupon "${couponToDelete?.code || 'Coupon'}" was removed.`);
      setCouponToDelete(null);
    },
    onError: (err) => notify.apiError(err, 'Failed to delete coupon.')
  });

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 100,
      usagePerCustomer: 1,
      isActive: true,
    });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      usagePerCustomer: coupon.usagePerCustomer || 1,
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Stats summary
  const totalRevenue = coupons.reduce((sum, c) => sum + (c.stats?.revenueGenerated || 0), 0);
  const totalUses = coupons.reduce((sum, c) => sum + (c.stats?.totalUses || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" /> Coupon Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, manage, and analyze promotional discount coupons & rules
          </p>
        </div>
        <Button onClick={() => { setEditingCoupon(null); resetForm(); setIsModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Coupons</CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.filter(c => c.isActive).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {coupons.length} total coupons</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Coupon Uses</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUses}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all completed orders</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Attributed to valid coupon codes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {['all', 'active', 'expired', 'inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === status 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Code & Type</th>
                <th className="px-4 py-3">Discount Value</th>
                <th className="px-4 py-3">Min Order / Cap</th>
                <th className="px-4 py-3">Validity</th>
                <th className="px-4 py-3">Usage & Stats</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="font-mono font-bold text-primary tracking-wide">{coupon.code}</div>
                      <div className="text-xs text-muted-foreground capitalize">{coupon.discountType.replace('_', ' ')}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {coupon.discountType === 'percentage' && `${coupon.discountValue}%`}
                      {coupon.discountType === 'fixed' && `৳${coupon.discountValue}`}
                      {coupon.discountType === 'free_shipping' && 'Free Shipping'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div>Min: ${coupon.minOrderAmount || 0}</div>
                      {coupon.maxDiscountAmount ? <div>Cap: ${coupon.maxDiscountAmount}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div>{new Date(coupon.validFrom).toLocaleDateString()}</div>
                      <div>to {new Date(coupon.validUntil).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-foreground">{coupon.stats?.totalUses || 0} / {coupon.usageLimit || '∞'} uses</div>
                      <div className="text-emerald-600 font-medium">৳{(coupon.stats?.revenueGenerated || 0).toFixed(2)} rev</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        coupon.isActive 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {coupon.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          title="Toggle Status"
                          onClick={() => toggleMutation.mutate(coupon.id)}
                        >
                          <Power className={`h-4 w-4 ${coupon.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          title="Duplicate Coupon"
                          onClick={() => duplicateMutation.mutate(coupon.id)}
                        >
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          title="Edit Coupon"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit3 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          title="Delete Coupon"
                          onClick={() => setCouponToDelete(coupon)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border rounded-lg max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER2026"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-md font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Discount Value</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={formData.discountType === 'free_shipping'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Valid From</label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Min Order Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Max Discount Cap ($)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for unlimited"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Usage Limit (Total)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Limit Per Customer</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usagePerCustomer}
                    onChange={(e) => setFormData({ ...formData, usagePerCustomer: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="font-medium">Activate immediately</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!couponToDelete}
        onOpenChange={(open) => !open && setCouponToDelete(null)}
        title="Delete Coupon"
        description={
          <>
            Are you sure you want to permanently delete coupon <strong>{couponToDelete?.code}</strong>? Any active carts using this code will no longer receive the discount.
          </>
        }
        confirmText="Delete Coupon"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => couponToDelete && deleteMutation.mutate(couponToDelete.id)}
      />
    </div>
  );
}
