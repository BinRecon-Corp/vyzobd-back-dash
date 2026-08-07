/**
 * Google Analytics 4 (GA4) Ecommerce Tracking via Google Tag Manager (GTM)
 * 
 * This file provides reusable TypeScript functions to push standard 
 * GA4 Ecommerce events to the GTM dataLayer.
 */

declare global {
  interface Window {
    dataLayer: any[];
  }
}

// Ensure dataLayer exists
export const initDataLayer = () => {
  window.dataLayer = window.dataLayer || [];
};

/**
 * Push an event to the GTM dataLayer.
 * It clears the previous ecommerce object to prevent data leaking between events.
 */
export const pushToDataLayer = (event: string, data: any = {}) => {
  initDataLayer();
  
  // Clear the ecommerce object before pushing a new one
  window.dataLayer.push({
    ecommerce: null 
  });
  
  // Push the actual event
  window.dataLayer.push({
    event,
    ...data,
  });
};

// GA4 Item Interface
export interface GA4Item {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price?: number;
  quantity?: number;
}

// Standard GA4 Ecommerce Parameters
export interface GA4EcommerceParams {
  currency?: string;
  value?: number;
  coupon?: string;
  items: GA4Item[];
}

// GA4 Purchase specific parameters
export interface GA4PurchaseParams extends GA4EcommerceParams {
  transaction_id: string;
  affiliation?: string;
  shipping?: number;
  tax?: number;
}

/**
 * Track when a user views a list of items
 */
export const trackViewItemList = (params: { item_list_id?: string; item_list_name?: string; items: GA4Item[] }) => {
  pushToDataLayer('view_item_list', {
    ecommerce: params
  });
};

/**
 * Track when a user views a specific item's details
 */
export const trackViewItem = (params: GA4EcommerceParams) => {
  pushToDataLayer('view_item', {
    ecommerce: params
  });
};

/**
 * Track when a user adds an item to their cart
 */
export const trackAddToCart = (params: GA4EcommerceParams) => {
  pushToDataLayer('add_to_cart', {
    ecommerce: params
  });
};

/**
 * Track when a user removes an item from their cart
 */
export const trackRemoveFromCart = (params: GA4EcommerceParams) => {
  pushToDataLayer('remove_from_cart', {
    ecommerce: params
  });
};

/**
 * Track when a user begins the checkout process
 */
export const trackBeginCheckout = (params: GA4EcommerceParams) => {
  pushToDataLayer('begin_checkout', {
    ecommerce: params
  });
};

/**
 * Track when a user completes a purchase
 */
export const trackPurchase = (params: GA4PurchaseParams) => {
  pushToDataLayer('purchase', {
    ecommerce: params
  });
};
