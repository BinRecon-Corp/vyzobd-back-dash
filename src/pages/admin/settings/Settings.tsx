import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "../../../services/setting.service";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { Save } from "lucide-react";
import { cn } from "../../../lib/utils";

const TABS = ["General", "Branding", "SEO", "Analytics", "SMTP", "Security", "Shipping", "Tax", "Notifications"];

export function Settings() {
  const [activeTab, setActiveTab] = useState("General");
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", activeTab.toLowerCase()] })
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your store configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-64 p-2 h-fit shrink-0">
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-2 text-left text-sm font-medium rounded-md transition-colors",
                  activeTab === tab 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        </Card>

        <Card className="flex-1 p-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold">{activeTab} Settings</h3>
              
              {activeTab === "Branding" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Site Name</label>
                    <Input name="siteName" value={formData.siteName || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Primary Color</label>
                    <Input type="color" name="primaryColor" value={formData.primaryColor || "#000000"} onChange={handleChange} className="h-10 w-20" />
                  </div>
                </div>
              )}

              {activeTab === "SEO" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Meta Title</label>
                    <Input name="metaTitle" value={formData.metaTitle || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Meta Description</label>
                    <Input name="metaDescription" value={formData.metaDescription || ""} onChange={handleChange} />
                  </div>
                </div>
              )}

              {activeTab === "Analytics" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">GA4 ID</label>
                    <Input name="ga4Id" value={formData.ga4Id || ""} onChange={handleChange} placeholder="G-XXXXXXXXXX" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">GTM ID</label>
                    <Input name="gtmId" value={formData.gtmId || ""} onChange={handleChange} placeholder="GTM-XXXXXXX" />
                  </div>
                </div>
              )}

              {activeTab === "SMTP" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Host</label>
                    <Input name="host" value={formData.host || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Port</label>
                    <Input name="port" type="number" value={formData.port || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Username</label>
                    <Input name="username" value={formData.username || ""} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Password</label>
                    <Input name="password" type="password" value={formData.password || ""} onChange={handleChange} />
                  </div>
                </div>
              )}

              {/* Add defaults for other tabs just to have something render */}
              {["General", "Security", "Shipping", "Tax", "Notifications"].includes(activeTab) && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Standard settings fields go here.</p>
                </div>
              )}

              <Button type="submit" disabled={mutation.isPending}>
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
