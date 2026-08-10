#!/bin/bash
check_file() {
  if [ -f "$1" ]; then
    echo "$1: YES"
  else
    echo "$1: NO"
  fi
}

check_file "prisma/schema.prisma"
check_file "server.ts"

# Validators
check_file "src/backend/validators/customer.validator.ts"
check_file "src/backend/validators/wishlist.validator.ts"
check_file "src/backend/validators/cart.validator.ts"
check_file "src/backend/validators/checkout.validator.ts"
check_file "src/backend/validators/payment.validator.ts"
check_file "src/backend/validators/refund.validator.ts"
check_file "src/backend/validators/return.validator.ts"
check_file "src/backend/validators/shipment.validator.ts"
check_file "src/backend/validators/notification.validator.ts"

# Storefront Controllers
for f in auth account wishlist order cart checkout payment refund return activity notification; do
  check_file "src/backend/controllers/storefront/$f.controller.ts"
  check_file "src/backend/services/storefront/$f.service.ts"
  check_file "src/backend/routes/storefront/$f.routes.ts"
done

# Admin Controllers
for f in shipment return notification analytics; do
  check_file "src/backend/controllers/$f.controller.ts"
  check_file "src/backend/services/$f.service.ts"
  check_file "src/backend/routes/$f.routes.ts"
done

