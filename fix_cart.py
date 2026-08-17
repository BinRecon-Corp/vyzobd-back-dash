import sys

with open('src/backend/services/storefront/cart.service.ts', 'r') as f:
    content = f.read()

target = """    // Stock validation
    if (product.trackInventory) {
      let availableStock = 0;

      if (variant) {
        const totalStock = (variant.inventories || []).reduce(
          (sum: number, inv: any) => sum + (inv.quantityAvailable - inv.quantityReserved),
          0
        );
        availableStock = Math.max(0, totalStock);
      } else if (product.inventory) {"""

replacement = """    // Stock validation
    if (product.trackInventory) {
      let availableStock = 0;

      if (variant) {
        let totalStock = (variant.inventories || []).reduce(
          (sum: number, inv: any) => sum + (inv.quantityAvailable - inv.quantityReserved),
          0
        );
        if (totalStock === 0 && (!variant.inventories || variant.inventories.length === 0) && product.inventory) {
          totalStock = product.inventory.quantityAvailable - product.inventory.quantityReserved;
        }
        availableStock = Math.max(0, totalStock);
      } else if (product.inventory) {"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/backend/services/storefront/cart.service.ts', 'w') as f:
        f.write(content)
    print("Cart replaced successfully")
else:
    print("Cart Target not found")
