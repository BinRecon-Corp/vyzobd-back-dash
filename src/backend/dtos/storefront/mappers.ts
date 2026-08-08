import { StorefrontProduct, StorefrontCategory, StorefrontBrand, StorefrontProductImage, StorefrontVariant } from "./types";

export function mapCategoryToStorefrontDTO(category: any): StorefrontCategory & { children?: any[] } {
  const result: any = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    icon: category.icon,
    parentId: category.parentId,
    seoTitle: category.seoTitle || category.name,
    seoDescription: category.seoDescription || category.description || null,
    ogImage: category.image || null,
  };
  if (category.children) {
    result.children = category.children.map(mapCategoryToStorefrontDTO);
  }
  return result;
}

export function mapBrandToStorefrontDTO(brand: any): StorefrontBrand & { website?: string | null } {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl,
    description: brand.description,
    seoTitle: brand.seoTitle || brand.name,
    seoDescription: brand.seoDescription || brand.description || null,
    ogImage: brand.logoUrl || null,
    website: brand.website || null,
  };
}

export function mapProductToStorefrontDTO(product: any): StorefrontProduct {
  const images = product.images?.map((img: any): StorefrontProductImage => ({
    id: img.id,
    url: img.url,
    altText: img.altText,
    isPrimary: img.isPrimary,
    sortOrder: img.sortOrder,
  })) || [];

  const variants = product.variants?.map((v: any): StorefrontVariant => {
    const options: Record<string, string> = {};
    if (v.attributes) {
      for (const attrVal of v.attributes) {
        if (attrVal.attributeValue && attrVal.attributeValue.attribute) {
          options[attrVal.attributeValue.attribute.name] = attrVal.attributeValue.value;
        }
      }
    }
    
    // Find variant image, assuming it might be linked via product images, 
    // or just leave it null if not explicitly stored on variant.
    // The schema has images ProductImage[] on ProductVariant, so:
    let image = null;
    if (v.images && v.images.length > 0) {
      image = v.images[0].url;
    }

    return {
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      price: v.price ? Number(v.price) : null,
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      stock: v.stock || 0, // Fallback if inventory is tracked differently
      inStock: v.stock > 0 || v.inventories?.some((i: any) => i.quantity > 0) || false,
      options,
      image,
    };
  }) || [];

  const primaryImage = product.ogImage || (images.find((i: any) => i.isPrimary)?.url) || images[0]?.url || null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price ? Number(product.price) : null,
    seoTitle: product.metaTitle || product.name,
    seoDescription: product.metaDescription || product.shortDescription || null,
    ogImage: primaryImage,
    gtin: product.gtin,
    mpn: product.mpn,
    condition: product.condition,
    category: product.category ? mapCategoryToStorefrontDTO(product.category) : undefined,
    brand: product.brand ? mapBrandToStorefrontDTO(product.brand) : null,
    images,
    variants,
    tags: product.tags?.map((pt: any) => pt.tag?.name).filter(Boolean) || [],
  };
}
