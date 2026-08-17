import sys

with open('src/backend/dtos/storefront/mappers.ts', 'r') as f:
    content = f.read()

target = """    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
    shippingAddress: order.shippingAddress,"""

replacement = """    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
    subtotal: order.subtotal ? Number(order.subtotal) : null,
    taxAmount: order.taxAmount ? Number(order.taxAmount) : null,
    shippingFee: order.shippingFee ? Number(order.shippingFee) : null,
    discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
    shippingAddress: order.shippingAddress,"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/backend/dtos/storefront/mappers.ts', 'w') as f:
        f.write(content)
    print("mappers updated successfully")
else:
    print("target not found")
