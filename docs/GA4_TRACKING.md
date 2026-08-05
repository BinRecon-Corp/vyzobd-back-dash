# GA4 Ecommerce Tracking Guide

This document outlines the Google Analytics 4 (GA4) Ecommerce tracking implementation for the application. It utilizes Google Tag Manager (GTM) and the standard GA4 Data Layer structure.

## 1. GTM Setup
1. Create a Google Tag Manager account and container.
2. Add the GTM snippet to the `<head>` and `<body>` of your `index.html`.
3. In GTM, create a new Tag:
   - **Tag Type**: Google Analytics: GA4 Configuration
   - **Measurement ID**: `G-XXXXXXXXXX` (Your GA4 ID)
   - **Trigger**: All Pages
4. Create an Ecommerce Event Tag:
   - **Tag Type**: Google Analytics: GA4 Event
   - **Event Name**: `{{Event}}` (Use a Data Layer Variable named `Event`)
   - **More Settings > Ecommerce**: Check "Send Ecommerce data" and set Data source to "Data Layer".
   - **Trigger**: Create a Custom Event trigger matching `view_item|view_item_list|select_item|add_to_cart|remove_from_cart|view_cart|begin_checkout|add_shipping_info|add_payment_info|purchase|refund` (Use Regex matching).

## 2. Data Layer Structure
The implementation strictly follows the official GA4 documentation. Example for a `purchase` event:

```javascript
window.dataLayer.push({
  event: "purchase",
  ecommerce: {
    transaction_id: "T12345",
    value: 25.42,
    tax: 4.90,
    shipping: 5.99,
    currency: "USD",
    coupon: "SUMMER_SALE",
    items: [
      {
        item_id: "SKU_12345",
        item_name: "Stan and Friends Tee",
        affiliation: "Google Merchandise Store",
        coupon: "SUMMER_FUN",
        discount: 2.22,
        index: 0,
        item_brand: "Google",
        item_category: "Apparel",
        item_category2: "Adult",
        item_category3: "Shirts",
        item_category4: "Crew",
        item_category5: "Short sleeve",
        item_list_id: "related_products",
        item_list_name: "Related Products",
        item_variant: "green",
        location_id: "ChIJIQBpAG2ahYAR_6128GcTUEo",
        price: 9.99,
        quantity: 1
      }
    ]
  }
});
```

## 3. Environment Variables
Add the following to your `.env` file for backend Measurement Protocol support:
```env
# Frontend GTM
VITE_GTM_ID="GTM-XXXXXXX"

# Backend GA4 Measurement Protocol
GA_MEASUREMENT_ID="G-XXXXXXXXXX"
GA_API_SECRET="YOUR_GA4_API_SECRET"
```

## 4. Testing Guide
1. **Google Tag Assistant**: Install the Google Tag Assistant Chrome Extension.
2. **GTM Preview Mode**: Open GTM, click "Preview", and enter your app URL. 
3. **Trigger Events**: Navigate through the app, view products, add to cart, and complete a test purchase.
4. **Verify Tags**: In the Tag Assistant window, ensure the GA4 Event tag fires on the correct custom events and that the `ecommerce` object is correctly populated in the Data Layer tab.
5. **GA4 DebugView**: Go to your GA4 Property > Admin > DebugView to see the events arrive in real-time. Verify that Ecommerce parameters (value, currency, items) are parsed correctly.
