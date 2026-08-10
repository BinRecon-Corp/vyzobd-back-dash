import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "../../../services/setting.service";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { Save, Eye, Globe, Image, Shield, Truck, Receipt, Mail, BarChart, Check, Palette, RefreshCw } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useBranding } from "../../../context/BrandingContext";

const TABS = [
  { id: "Branding", label: "Branding", icon: Palette },
  { id: "SEO", label: "SEO & Meta", icon: Globe },
  { id: "SMTP", label: "SMTP Email", icon: Mail },
  { id: "Analytics", label: "Analytics", icon: BarChart },
  { id: "Security", label: "Security", icon: Shield },
  { id: "Shipping", label: "Shipping", icon: Truck },
  { id: "Tax", label: "Tax Rules", icon: Receipt },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState("Branding");
  const queryClient = useQueryClient();
  const { branding, updateBrandingState, setPageTitle } = useBranding();
  const [formData, setFormData] = useState<any>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setPageTitle("Settings - " + activeTab);
  }, [activeTab, setPageTitle]);

  const { isLoading } = useQuery({
    queryKey: ["settings", activeTab.toLowerCase()],
    queryFn: async () => {
      const data = await getSettings(activeTab.toLowerCase());
      setFormData(data || {});
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: () => updateSettings(activeTab.toLowerCase(), formData),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ["settings", activeTab.toLowerCase()] });
      if (activeTab === "Branding") {
        updateBrandingState(formData);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev: any) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">Manage global storefront branding, SEO, security, and integration parameters.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Tabs */}
        <Card className="w-full md:w-64 p-2 h-fit shrink-0">
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium rounded-md transition-colors",
                    activeTab === tab.id 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Main Settings Form Container */}
        <div className="flex-1 space-y-6">
          <Card className="p-6">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">{activeTab} Settings</h3>
                    <p className="text-xs text-muted-foreground">Configure your platform {activeTab.toLowerCase()} parameters.</p>
                  </div>
                  {saveSuccess && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 text-xs font-semibold rounded-full animate-fade-in">
                      <Check className="h-3.5 w-3.5" /> Saved successfully
                    </div>
                  )}
                </div>

                {/* BRANDING TAB */}
                {activeTab === "Branding" && (
                  <div className="space-y-6">
                    {/* Live Preview Card */}
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Eye className="h-4 w-4 text-primary" /> Live Branding Preview
                      </div>
                      
                      {/* Browser Tab Preview */}
                      <div className="bg-white dark:bg-slate-950 rounded-lg border p-3 shadow-sm space-y-2">
                        <span className="text-xs text-muted-foreground font-medium block">Browser Tab Display:</span>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md max-w-sm border">
                          <div className="h-4 w-4 shrink-0 flex items-center justify-center overflow-hidden rounded">
                            {formData.faviconUrl ? (
                              <img src={formData.faviconUrl} alt="Favicon" className="h-4 w-4 object-contain" />
                            ) : (
                              <div className="h-3.5 w-3.5 bg-primary rounded-full text-[8px] text-primary-foreground font-bold flex items-center justify-center">
                                {(formData.siteTitle || formData.adminPanelName || "A").charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-foreground truncate">
                            {formData.siteTitle || formData.adminPanelName || "Enterprise Admin Portal"}
                          </span>
                        </div>
                      </div>

                      {/* Portal Brand Header Preview */}
                      <div className="bg-white dark:bg-slate-950 rounded-lg border p-3 shadow-sm space-y-2">
                        <span className="text-xs text-muted-foreground font-medium block">Admin Sidebar Header Display:</span>
                        <div className="flex items-center gap-3 p-2 bg-slate-900 text-white rounded-md max-w-xs">
                          {formData.adminPanelLogo || formData.logoUrl ? (
                            <img src={formData.adminPanelLogo || formData.logoUrl} alt="Logo" className="h-6 max-w-[100px] object-contain" />
                          ) : (
                            <div className="h-6 w-6 bg-primary rounded flex items-center justify-center font-bold text-xs">
                              {(formData.adminPanelName || "A").charAt(0)}
                            </div>
                          )}
                          <span className="font-bold text-sm truncate">
                            {formData.adminPanelName || "Admin Portal"}
                          </span>
                        </div>
                      </div>

                      {/* Primary Color & Footer Preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-950 rounded-lg border p-3 shadow-sm space-y-1">
                          <span className="text-xs text-muted-foreground font-medium block">Primary Brand Accent:</span>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-12 rounded border shadow-inner" style={{ backgroundColor: formData.primaryColor || "#0f172a" }} />
                            <span className="text-xs font-mono">{formData.primaryColor || "#0f172a"}</span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-950 rounded-lg border p-3 shadow-sm space-y-1">
                          <span className="text-xs text-muted-foreground font-medium block">Footer Notice:</span>
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic truncate">
                            {formData.footerText || "© 2026 Enterprise Store"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Site Name</label>
                        <Input name="siteName" value={formData.siteName || ""} onChange={handleChange} placeholder="Enterprise Store" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Site Title (Browser Tab)</label>
                        <Input name="siteTitle" value={formData.siteTitle || ""} onChange={handleChange} placeholder="Enterprise E-Commerce Portal" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Admin Portal Name</label>
                        <Input name="adminPanelName" value={formData.adminPanelName || ""} onChange={handleChange} placeholder="Admin Portal" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Site Tagline</label>
                        <Input name="siteTagline" value={formData.siteTagline || ""} onChange={handleChange} placeholder="Enterprise Management Suite" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Logo URL (Main)</label>
                        <Input name="logoUrl" value={formData.logoUrl || ""} onChange={handleChange} placeholder="https://example.com/logo.png" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Favicon URL</label>
                        <Input name="faviconUrl" value={formData.faviconUrl || ""} onChange={handleChange} placeholder="https://example.com/favicon.ico" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Admin Panel Logo URL</label>
                        <Input name="adminPanelLogo" value={formData.adminPanelLogo || ""} onChange={handleChange} placeholder="https://example.com/admin-logo.png" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Invoice Logo URL</label>
                        <Input name="invoiceLogo" value={formData.invoiceLogo || ""} onChange={handleChange} placeholder="https://example.com/invoice-logo.png" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Primary Brand Color</label>
                        <div className="flex gap-2 items-center">
                          <Input type="color" name="primaryColor" value={formData.primaryColor || "#0f172a"} onChange={handleChange} className="h-10 w-16 p-1 cursor-pointer" />
                          <Input name="primaryColor" value={formData.primaryColor || "#0f172a"} onChange={handleChange} className="flex-1 font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Default Currency</label>
                        <Input name="defaultCurrency" value={formData.defaultCurrency || "USD"} onChange={handleChange} placeholder="USD" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Footer Copyright Text</label>
                      <Input name="footerText" value={formData.footerText || ""} onChange={handleChange} placeholder="© 2026 Enterprise Store. All rights reserved." />
                    </div>
                  </div>
                )}

                {/* SEO TAB */}
                {activeTab === "SEO" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Global Meta Title</label>
                      <Input name="metaTitle" value={formData.metaTitle || ""} onChange={handleChange} placeholder="Enterprise E-Commerce Store" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Global Meta Description</label>
                      <textarea
                        name="metaDescription"
                        rows={3}
                        value={formData.metaDescription || ""}
                        onChange={handleChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="The premier online destination for quality products."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Meta Keywords</label>
                      <Input name="metaKeywords" value={formData.metaKeywords || ""} onChange={handleChange} placeholder="ecommerce, store, online shopping" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">OpenGraph Title</label>
                        <Input name="ogTitle" value={formData.ogTitle || ""} onChange={handleChange} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">OpenGraph Image URL</label>
                        <Input name="ogImage" value={formData.ogImage || ""} onChange={handleChange} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Robots.txt Content</label>
                      <textarea
                        name="robotsTxt"
                        rows={4}
                        value={formData.robotsTxt || ""}
                        onChange={handleChange}
                        className="w-full font-mono text-xs rounded-md border border-input bg-background px-3 py-2 shadow-sm"
                        placeholder="User-agent: *&#10;Disallow: /admin/"
                      />
                    </div>
                  </div>
                )}

                {/* SMTP TAB */}
                {activeTab === "SMTP" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">SMTP Host</label>
                        <Input name="host" value={formData.host || ""} onChange={handleChange} placeholder="smtp.gmail.com" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Port</label>
                        <Input name="port" type="number" value={formData.port || ""} onChange={handleChange} placeholder="587" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Username</label>
                        <Input name="username" value={formData.username || ""} onChange={handleChange} placeholder="smtp-user@example.com" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Password</label>
                        <Input name="password" type="password" value={formData.password || ""} onChange={handleChange} placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">From Email</label>
                        <Input name="fromEmail" value={formData.fromEmail || ""} onChange={handleChange} placeholder="noreply@example.com" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">From Name</label>
                        <Input name="fromName" value={formData.fromName || ""} onChange={handleChange} placeholder="Store Notifications" />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input
                          type="checkbox"
                          name="secure"
                          checked={formData.secure ?? true}
                          onChange={handleChange}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        Use SSL/TLS Security
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input
                          type="checkbox"
                          name="enabled"
                          checked={formData.enabled ?? false}
                          onChange={handleChange}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        Enable SMTP Email Delivery
                      </label>
                    </div>
                  </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === "Analytics" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Google Analytics 4 ID</label>
                        <Input name="googleAnalyticsId" value={formData.googleAnalyticsId || ""} onChange={handleChange} placeholder="G-XXXXXXXXXX" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Google Tag Manager ID</label>
                        <Input name="googleTagManagerId" value={formData.googleTagManagerId || ""} onChange={handleChange} placeholder="GTM-XXXXXXX" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Facebook Pixel ID</label>
                        <Input name="facebookPixelId" value={formData.facebookPixelId || ""} onChange={handleChange} placeholder="1234567890" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Hotjar Site ID</label>
                        <Input name="hotjarId" value={formData.hotjarId || ""} onChange={handleChange} placeholder="987654" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input
                          type="checkbox"
                          name="enableAnalytics"
                          checked={formData.enableAnalytics ?? false}
                          onChange={handleChange}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        Enable Analytics Tracking Scripts
                      </label>
                    </div>
                  </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === "Security" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Minimum Password Length</label>
                        <Input name="passwordMinLength" type="number" value={formData.passwordMinLength || 8} onChange={handleChange} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Session Timeout (Minutes)</label>
                        <Input name="sessionTimeoutMinutes" type="number" value={formData.sessionTimeoutMinutes || 60} onChange={handleChange} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Max Failed Login Attempts</label>
                        <Input name="maxLoginAttempts" type="number" value={formData.maxLoginAttempts || 5} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input
                          type="checkbox"
                          name="enable2FA"
                          checked={formData.enable2FA ?? false}
                          onChange={handleChange}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        Require Two-Factor Authentication (2FA) for Admins
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input
                          type="checkbox"
                          name="enableMaintenanceMode"
                          checked={formData.enableMaintenanceMode ?? false}
                          onChange={handleChange}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        Enable Storefront Maintenance Mode
                      </label>
                    </div>

                    {formData.enableMaintenanceMode && (
                      <div>
                        <label className="text-sm font-medium mb-1 block">Maintenance Notice Message</label>
                        <textarea
                          name="maintenanceMessage"
                          rows={3}
                          value={formData.maintenanceMessage || ""}
                          onChange={handleChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                          placeholder="Our storefront is currently undergoing scheduled maintenance. Please check back shortly."
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* SHIPPING TAB */}
                {activeTab === "Shipping" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Default Shipping Cost ($)</label>
                        <Input name="defaultShippingCost" type="number" step="0.01" value={formData.defaultShippingCost ?? 0} onChange={handleChange} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Free Shipping Minimum Threshold ($)</label>
                        <Input name="freeShippingThreshold" type="number" step="0.01" value={formData.freeShippingThreshold || ""} onChange={handleChange} placeholder="99.00" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input
                          type="checkbox"
                          name="enableFreeShipping"
                          checked={formData.enableFreeShipping ?? false}
                          onChange={handleChange}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        Enable Free Shipping Rule Above Threshold
                      </label>
                    </div>
                  </div>
                )}

                {/* TAX TAB */}
                {activeTab === "Tax" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Default Tax Rate (%)</label>
                        <Input name="defaultTaxRate" type="number" step="0.01" value={formData.defaultTaxRate ?? 0} onChange={handleChange} placeholder="5.00" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input
                          type="checkbox"
                          name="pricesIncludeTax"
                          checked={formData.pricesIncludeTax ?? false}
                          onChange={handleChange}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                        Catalog Prices Already Include Sales Tax
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Action Button */}
                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Save {activeTab} Settings
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
