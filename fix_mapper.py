import sys

with open('src/backend/dtos/storefront/mappers.ts', 'r') as f:
    content = f.read()

target = """    const calculatedStock = v.inventories && v.inventories.length > 0
      ? v.inventories.reduce((sum: number, inv: any) => sum + Math.max(0, (inv.quantityAvailable ?? inv.quantity ?? 0) - (inv.quantityReserved ?? 0)), 0)
      : (v.stock ?? 0);"""

replacement = """    const calculatedStock = v.inventories && v.inventories.length > 0
      ? v.inventories.reduce((sum: number, inv: any) => sum + Math.max(0, (inv.quantityAvailable ?? inv.quantity ?? 0) - (inv.quantityReserved ?? 0)), 0)
      : (isSingleVariant && product.inventory
          ? Math.max(0, (product.inventory.quantityAvailable ?? product.inventory.quantity ?? 0) - (product.inventory.quantityReserved ?? 0))
          : (v.stock ?? 0));"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/backend/dtos/storefront/mappers.ts', 'w') as f:
        f.write(content)
    print("Mapper replaced successfully")
else:
    print("Target not found")
