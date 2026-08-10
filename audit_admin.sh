#!/bin/bash
check_file() {
  if [ -f "$1" ]; then
    echo "$1: YES"
  else
    echo "$1: NO"
  fi
}

modules=(
  "auth"
  "user"
  "role"
  "permission"
  "customer"
  "category"
  "brand"
  "product"
  "variant"
  "inventory"
  "coupon"
  "order"
  "payment"
  "refund"
  "shipment"
  "return"
  "page"
  "landing-page"
  "blog"
  "faq"
  "seo"
  "media"
  "analytics"
  "setting"
  "notification"
  "audit"
)

for m in "${modules[@]}"; do
  echo "--- $m ---"
  check_file "src/backend/controllers/$m.controller.ts"
  check_file "src/backend/services/$m.service.ts"
  check_file "src/backend/routes/$m.routes.ts"
  check_file "src/backend/validators/$m.validator.ts"
done
