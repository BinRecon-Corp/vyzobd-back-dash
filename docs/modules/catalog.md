# Catalog & Product Management Module

## Overview
Manages multi-tier product catalog hierarchy including products, variants, SKUs, categories, brands, tags, attributes, and variant attribute values.

## Key Entities & Schema Relationships
- **Product**: Parent catalog entry holding title, slug, description, category, brand, tags, and status.
- **ProductVariant**: Specific purchasable SKU holding barcode, price, compareAtPrice, weight, and dimensions.
- **Attribute & AttributeValue**: Dynamic variant attributes (e.g. Color: Red, Size: XL).
