import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api } from "../lib/api";

export interface BrandingData {
  siteName?: string;
  siteTitle?: string;
  siteTagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  adminPanelName?: string;
  adminPanelLogo?: string;
  invoiceLogo?: string;
  primaryColor?: string;
  footerText?: string;
  defaultLanguage?: string;
  defaultCurrency?: string;
  defaultTimezone?: string;
}

interface BrandingContextType {
  branding: BrandingData;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
  updateBrandingState: (newData: Partial<BrandingData>) => void;
  setPageTitle: (pageTitle?: string) => void;
}

const DEFAULT_BRANDING: BrandingData = {
  siteName: "Enterprise Admin",
  siteTitle: "Enterprise Commerce Admin Portal",
  siteTagline: "Enterprise E-Commerce Management Platform",
  logoUrl: "",
  faviconUrl: "",
  adminPanelName: "Admin Portal",
  adminPanelLogo: "",
  invoiceLogo: "",
  primaryColor: "#0f172a",
  footerText: "© 2026 Enterprise Commerce System. All rights reserved.",
  defaultLanguage: "en",
  defaultCurrency: "USD",
  defaultTimezone: "UTC"
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Default SVG Favicon fallback data URL
const FALLBACK_FAVICON_SVG = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%230f172a"/><text x="50" y="65" font-size="50" font-weight="bold" fill="%23ffffff" text-anchor="middle" font-family="sans-serif">A</text></svg>`;

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dynamic Favicon Manager
  const applyFavicon = useCallback((url?: string) => {
    const faviconHref = url && url.trim() !== "" ? url.trim() : FALLBACK_FAVICON_SVG;

    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = faviconHref;
  }, []);

  // Dynamic Title Manager
  const applyTitle = useCallback((pageTitle?: string, currentBranding?: BrandingData) => {
    const activeBranding = currentBranding || branding;
    const baseTitle = activeBranding.siteTitle || activeBranding.adminPanelName || activeBranding.siteName || "Enterprise Admin Portal";

    if (pageTitle && pageTitle.trim()) {
      document.title = `${pageTitle.trim()} | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [branding]);

  // Function for individual pages/views to set page-specific title
  const setPageTitle = useCallback((pageTitle?: string) => {
    applyTitle(pageTitle, branding);
  }, [applyTitle, branding]);

  // Fetch Branding Data
  const fetchBranding = useCallback(async () => {
    try {
      const { data } = await api.get("/storefront/v1/settings/public");
      const fetchedBranding = data?.data?.branding;
      if (fetchedBranding) {
        const merged: BrandingData = {
          ...DEFAULT_BRANDING,
          ...fetchedBranding,
        };
        setBranding(merged);
        applyFavicon(merged.faviconUrl);
        applyTitle(undefined, merged);
      } else {
        applyFavicon(DEFAULT_BRANDING.faviconUrl);
        applyTitle(undefined, DEFAULT_BRANDING);
      }
    } catch (err) {
      console.warn("Failed to fetch public branding settings, using defaults", err);
      applyFavicon(DEFAULT_BRANDING.faviconUrl);
      applyTitle(undefined, DEFAULT_BRANDING);
    } finally {
      setIsLoading(false);
    }
  }, [applyFavicon, applyTitle]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const updateBrandingState = useCallback((newData: Partial<BrandingData>) => {
    setBranding((prev) => {
      const updated = { ...prev, ...newData };
      applyFavicon(updated.faviconUrl);
      applyTitle(undefined, updated);
      return updated;
    });
  }, [applyFavicon, applyTitle]);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refreshBranding: fetchBranding, updateBrandingState, setPageTitle }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
};
