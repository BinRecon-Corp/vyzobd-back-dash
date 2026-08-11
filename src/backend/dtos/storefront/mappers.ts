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
    url: img.imageUrl || img.url,
    imageUrl: img.imageUrl || img.url,
    publicId: img.publicId || null,
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
    
    let image = null;
    if (v.images && v.images.length > 0) {
      image = v.images[0].imageUrl || v.images[0].url;
    }

    return {
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      price: v.price ? Number(v.price) : null,
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      stock: v.stock || 0,
      inStock: v.stock > 0 || v.inventories?.some((i: any) => i.quantity > 0) || false,
      options,
      image,
    };
  }) || [];

  const primaryImageObj = images.find((i: any) => i.isPrimary) || images[0] || null;
  const primaryImageUrl = primaryImageObj?.imageUrl || primaryImageObj?.url || product.ogImage || null;
  const gallery = images.filter((i: any) => !i.isPrimary);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price ? Number(product.price) : null,
    seoTitle: product.metaTitle || product.name,
    seoDescription: product.metaDescription || product.shortDescription || null,
    ogImage: primaryImageUrl,
    gtin: product.gtin,
    mpn: product.mpn,
    condition: product.condition,
    category: product.category ? mapCategoryToStorefrontDTO(product.category) : undefined,
    brand: product.brand ? mapBrandToStorefrontDTO(product.brand) : null,
    images,
    variants,
    tags: product.tags?.map((pt: any) => pt.tag?.name).filter(Boolean) || [],
    thumbnail: primaryImageUrl,
    gallery,
    primaryImage: primaryImageObj || primaryImageUrl,
  };
}

export function mapOrderToStorefrontDTO(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    coupon: order.coupon ? {
      code: order.coupon.code,
      discountType: order.coupon.discountType,
      discountValue: order.coupon.discountValue ? Number(order.coupon.discountValue) : null,
    } : null,
    items: order.items?.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price ? Number(item.price) : null,
      productName: item.product?.name,
      productSlug: item.product?.slug,
      productImage: item.product?.images?.[0]?.url || null,
      variantSku: item.productVariant?.sku || null,
    })) || [],
    timeline: order.timeline?.map((event: any) => ({
      id: event.id,
      status: event.status,
      action: event.action,
      createdAt: event.createdAt,
    })) || [],
  };
}

export function mapShipmentToStorefrontDTO(shipment: any) {
  return {
    id: shipment.id,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    shippedAt: shipment.shippedAt,
    estimatedDelivery: shipment.estimatedDelivery,
    courierName: shipment.courier?.name,
    trackingUrl: shipment.courier?.trackingUrlPrefix ? `${shipment.courier.trackingUrlPrefix}${shipment.trackingNumber}` : null,
    createdAt: shipment.createdAt,
    items: shipment.items?.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      productName: item.orderItem?.product?.name,
    })) || [],
    trackingEvents: shipment.trackingEvents?.map((event: any) => ({
      id: event.id,
      status: event.status,
      location: event.location,
      description: event.description,
      timestamp: event.timestamp,
    })) || []
  };
}

export function mapReturnRequestToStorefrontDTO(returnReq: any) {
  return {
    id: returnReq.id,
    orderId: returnReq.orderId,
    reason: returnReq.reason,
    status: returnReq.status,
    createdAt: returnReq.createdAt,
    items: returnReq.items?.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      reason: item.reason,
      condition: item.condition,
      productName: item.orderItem?.product?.name,
      productImage: item.orderItem?.product?.images?.[0]?.url || null,
    })) || []
  };
}

export function mapRefundToStorefrontDTO(refund: any) {
  return {
    id: refund.id,
    orderId: refund.orderId,
    amount: refund.amount ? Number(refund.amount) : null,
    currency: refund.currency,
    status: refund.status,
    reason: refund.reason,
    createdAt: refund.createdAt,
    provider: refund.payment?.provider,
  };
}
