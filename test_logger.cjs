const { logger } = require('./src/backend/config/logger');

logger.info("Storefront Request", {
  service: "storefront",
  method: "GET",
  path: "/api/storefront/v1/products",
  statusCode: 200,
  responseTime: 42
});
