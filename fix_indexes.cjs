const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const additions = {
    'AttributeValue': '  @@index([attributeId])\n}',
    'ProductImage': '  @@index([productVariantId])\n}',
    'OrderNote': '  @@index([orderId])\n}',
    'PageVersion': '  @@index([pageId])\n}',
    'ShipmentItem': '  @@index([productImageId])\n}',
    'ReturnItem': '  @@index([productImageId])\n}',
    'Notification': '  @@index([orderId])\n  @@index([customerId, status])\n}',
    'CustomerActivity': '  @@index([orderId])\n}',
    'AnalyticsEvent': '  @@index([orderId])\n}',
    'Product': '  @@index([isActive, deletedAt, categoryId])\n  @@index([isActive, deletedAt, brandId])\n  @@index([status, deletedAt])\n}',
    'Order': '  @@index([customerId, createdAt])\n  @@index([status, createdAt])\n}',
    'Payment': '  @@index([status, createdAt])\n}',
    'Shipment': '  @@index([status, createdAt])\n}',
    'ProductTag': '  @@index([tagId])\n}',
    'VariantAttributeValue': '  @@index([attributeValueId])\n}'
};

for (const [model, indexStr] of Object.entries(additions)) {
    const regex = new RegExp(`model\\s+${model}\\s+\\{[\\s\\S]*?\\n\\}`, 'g');
    schema = schema.replace(regex, (match) => {
        // Only append if it's not already there
        const withoutBrace = match.slice(0, -1);
        // check if indexStr is already included
        if (withoutBrace.includes(indexStr.split('\n')[0].trim())) {
            return match;
        }
        return withoutBrace + indexStr;
    });
}

fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');

