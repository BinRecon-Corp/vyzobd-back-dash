import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { PermissionService, UserPermissionContext } from "../services/permission.service";
import { requireAuth, requirePermission, requireAnyPermission, requireAllPermissions, requireSuperAdmin, AuthRequest } from "../middlewares/auth";
import { errorHandler } from "../middlewares/errorHandler";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

// Mock users and roles for testing
const superAdminUser: UserPermissionContext = {
  id: "user-super-admin-1",
  email: "superadmin@example.com",
  roleId: "role-super-admin-1",
  roleName: "SuperAdmin",
  permissions: [
    { module: "Products", action: "all" },
    { module: "Orders", action: "all" },
    { module: "Payments", action: "all" },
    { module: "Settings", action: "all" },
    { module: "Users", action: "all" },
    { module: "Roles", action: "all" },
    { module: "Dashboard", action: "all" },
  ],
};

const productsOnlyUser: UserPermissionContext = {
  id: "user-products-only-2",
  email: "products.manager@example.com",
  roleId: "role-products-2",
  roleName: "ProductsManager",
  permissions: [
    { module: "Products", action: "read" },
    { module: "Products", action: "write" },
  ],
};

const ordersOnlyUser: UserPermissionContext = {
  id: "user-orders-only-3",
  email: "orders.manager@example.com",
  roleId: "role-orders-3",
  roleName: "OrdersManager",
  permissions: [
    { module: "Orders", action: "read" },
    { module: "Orders", action: "write" },
  ],
};

const multiModuleUser: UserPermissionContext = {
  id: "user-multi-4",
  email: "commerce.admin@example.com",
  roleId: "role-commerce-4",
  roleName: "CommerceAdmin",
  permissions: [
    { module: "Products", action: "read" },
    { module: "Products", action: "write" },
    { module: "Orders", action: "read" },
    { module: "Orders", action: "write" },
    { module: "Payments", action: "read" },
  ],
};

const usersManagerUser: UserPermissionContext = {
  id: "user-manager-5",
  email: "user.manager@example.com",
  roleId: "role-user-manager-5",
  roleName: "UserManager",
  permissions: [
    { module: "Users", action: "read" },
    { module: "Users", action: "write" },
    { module: "Roles", action: "read" },
    { module: "Roles", action: "write" },
  ],
};

// Build a test Express app with mocked auth context injection for route tests
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Test middleware that maps Authorization Bearer tokens to user context
  const mockAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("You are not logged in! Please log in to get access.", 401, "UNAUTHORIZED"));
    }

    const token = authHeader.split(" ")[1];
    if (token === "invalid-token" || token === "expired-token") {
      return next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
    }

    // Map test tokens to users
    if (token === "token-superadmin") {
      req.user = superAdminUser as any;
    } else if (token === "token-products-only") {
      req.user = productsOnlyUser as any;
    } else if (token === "token-orders-only") {
      req.user = ordersOnlyUser as any;
    } else if (token === "token-multi") {
      req.user = multiModuleUser as any;
    } else if (token === "token-users-manager") {
      req.user = usersManagerUser as any;
    } else {
      return next(new AppError("User belonging to this token no longer exists", 401, "UNAUTHORIZED"));
    }
    next();
  };

  // Protected routes for test suite
  app.get("/api/v1/dashboard/overview", mockAuthMiddleware, requirePermission("Dashboard", "read"), (req, res) => {
    res.status(200).json({ status: "success", module: "Dashboard" });
  });

  app.get("/api/v1/products", mockAuthMiddleware, requirePermission("Products", "read"), (req, res) => {
    res.status(200).json({ status: "success", module: "Products", action: "read" });
  });

  app.post("/api/v1/products", mockAuthMiddleware, requirePermission("products.create"), (req, res) => {
    res.status(201).json({ status: "success", module: "Products", action: "create" });
  });

  app.get("/api/v1/orders", mockAuthMiddleware, requirePermission("Orders", "read"), (req, res) => {
    res.status(200).json({ status: "success", module: "Orders", action: "read" });
  });

  app.get("/api/v1/payments", mockAuthMiddleware, requirePermission("Payments", "read"), (req, res) => {
    res.status(200).json({ status: "success", module: "Payments", action: "read" });
  });

  app.get("/api/v1/settings/general", mockAuthMiddleware, requirePermission("Settings", "read"), (req, res) => {
    res.status(200).json({ status: "success", module: "Settings" });
  });

  app.get("/api/v1/users", mockAuthMiddleware, requirePermission("Users", "read"), (req, res) => {
    res.status(200).json({ status: "success", module: "Users" });
  });

  app.get("/api/v1/roles", mockAuthMiddleware, requirePermission("Roles", "read"), (req, res) => {
    res.status(200).json({ status: "success", module: "Roles" });
  });

  app.post("/api/v1/admin/superadmin-only-action", mockAuthMiddleware, requireSuperAdmin, (req, res) => {
    res.status(200).json({ status: "success", message: "SuperAdmin action executed" });
  });

  // Any permission route: Shipments read or Orders read
  app.get("/api/v1/shipments", mockAuthMiddleware, requireAnyPermission(["Shipments.read", "Orders.read"]), (req, res) => {
    res.status(200).json({ status: "success", module: "Shipments/Orders" });
  });

  // Simulated Privilege Escalation Route: Reset SuperAdmin Password
  app.post("/api/v1/users/:id/reset-password", mockAuthMiddleware, requirePermission("Users", "write"), (req: AuthRequest, res, next) => {
    const { id } = req.params;
    if (id === superAdminUser.id && !PermissionService.isSuperAdmin(req.user)) {
      return next(new AppError("Only SuperAdmin can reset the password of a SuperAdmin account", 403, "SUPERADMIN_PROTECTED"));
    }
    res.status(200).json({ status: "success", message: "Password reset successful" });
  });

  // Simulated Privilege Escalation Route: Assign Role
  app.patch("/api/v1/users/:id/role", mockAuthMiddleware, requirePermission("Users", "write"), (req: AuthRequest, res, next) => {
    const { id } = req.params;
    const { roleId } = req.body;
    if (id === req.user?.id) {
      return next(new AppError("You cannot modify your own role", 403, "CANNOT_MODIFY_OWN_ROLE"));
    }
    if (roleId === superAdminUser.roleId && !PermissionService.isSuperAdmin(req.user)) {
      return next(new AppError("Only SuperAdmin can assign the SuperAdmin role", 403, "SUPERADMIN_PROTECTED"));
    }
    res.status(200).json({ status: "success", message: "Role assigned" });
  });

  // Simulated Role Permission Update Route
  app.patch("/api/v1/roles/:id/permissions", mockAuthMiddleware, requirePermission("Roles", "write"), (req: AuthRequest, res, next) => {
    const { id } = req.params;
    if (id === superAdminUser.roleId) {
      return next(new AppError("SuperAdmin permissions are protected and cannot be modified", 403, "SUPERADMIN_PROTECTED"));
    }
    res.status(200).json({ status: "success", message: "Role permissions updated" });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

// Test runner
async function runRbacTests() {
  console.log("=================================================");
  console.log("      RUNNING RBAC SECURITY TEST SUITE           ");
  console.log("=================================================\n");

  const app = createTestApp();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // --- UNIT TESTS: PermissionService ---
  console.log("--- 1. PermissionService Unit Tests ---");
  
  // SuperAdmin resolution
  assert(
    PermissionService.isSuperAdmin(superAdminUser) === true,
    "SuperAdmin user is identified as SuperAdmin"
  );
  assert(
    PermissionService.isSuperAdmin(productsOnlyUser) === false,
    "ProductsOnly user is NOT identified as SuperAdmin"
  );
  assert(
    PermissionService.hasPermission(superAdminUser, "products.read") === true,
    "SuperAdmin has access to products.read"
  );
  assert(
    PermissionService.hasPermission(superAdminUser, "settings.write") === true,
    "SuperAdmin has access to settings.write (bypass)"
  );
  assert(
    PermissionService.hasPermission(superAdminUser, "dashboard.read") === true,
    "SuperAdmin has access to dashboard.read (bypass)"
  );

  // Products Only User resolution
  assert(
    PermissionService.hasPermission(productsOnlyUser, "products.read") === true,
    "ProductsOnly user has permission for products.read"
  );
  assert(
    PermissionService.hasPermission(productsOnlyUser, "products.create") === true,
    "ProductsOnly user has permission for products.create (aliased to write)"
  );
  assert(
    PermissionService.hasPermission(productsOnlyUser, "orders.read") === false,
    "ProductsOnly user is DENIED permission for orders.read"
  );
  assert(
    PermissionService.hasPermission(productsOnlyUser, "settings.read") === false,
    "ProductsOnly user is DENIED permission for settings.read"
  );
  assert(
    PermissionService.hasPermission(productsOnlyUser, "dashboard.read") === false,
    "ProductsOnly user is DENIED permission for dashboard.read"
  );

  // Orders Only User resolution
  assert(
    PermissionService.hasPermission(ordersOnlyUser, "orders.read") === true,
    "OrdersOnly user has permission for orders.read"
  );
  assert(
    PermissionService.hasPermission(ordersOnlyUser, "products.read") === false,
    "OrdersOnly user is DENIED permission for products.read"
  );
  assert(
    PermissionService.hasPermission(ordersOnlyUser, "payments.read") === false,
    "OrdersOnly user is DENIED permission for payments.read"
  );

  // Multi-Module User (Products + Orders + Payments)
  assert(
    PermissionService.hasPermission(multiModuleUser, "products.read") === true,
    "MultiModule user has permission for products.read"
  );
  assert(
    PermissionService.hasPermission(multiModuleUser, "orders.read") === true,
    "MultiModule user has permission for orders.read"
  );
  assert(
    PermissionService.hasPermission(multiModuleUser, "payments.read") === true,
    "MultiModule user has permission for payments.read"
  );
  assert(
    PermissionService.hasPermission(multiModuleUser, "settings.read") === false,
    "MultiModule user is DENIED permission for settings.read"
  );
  assert(
    PermissionService.hasPermission(multiModuleUser, "users.read") === false,
    "MultiModule user is DENIED permission for users.read"
  );
  assert(
    PermissionService.hasPermission(multiModuleUser, "roles.read") === false,
    "MultiModule user is DENIED permission for roles.read"
  );

  // hasAnyPermission & hasAllPermissions
  assert(
    PermissionService.hasAnyPermission(ordersOnlyUser, ["Products.read", "Orders.read"]) === true,
    "hasAnyPermission returns true when at least one permission matches"
  );
  assert(
    PermissionService.hasAnyPermission(ordersOnlyUser, ["Products.read", "Payments.read"]) === false,
    "hasAnyPermission returns false when no permissions match"
  );
  assert(
    PermissionService.hasAllPermissions(multiModuleUser, ["Products.read", "Orders.read", "Payments.read"]) === true,
    "hasAllPermissions returns true when all permissions match"
  );
  assert(
    PermissionService.hasAllPermissions(multiModuleUser, ["Products.read", "Settings.read"]) === false,
    "hasAllPermissions returns false when one permission is missing"
  );

  // validateUserCanAssignPermissions
  const allowedPermIds = ["perm-users-read", "perm-users-write"];
  const userPermMap: Record<string, { module: string; action: string }> = {
    "perm-users-read": { module: "Users", action: "read" },
    "perm-users-write": { module: "Users", action: "write" },
    "perm-settings-write": { module: "Settings", action: "write" },
  };

  const nonSuperAdminAllowed = await PermissionService.validateUserCanAssignPermissions(
    usersManagerUser,
    ["perm-users-read", "perm-users-write"],
    userPermMap
  );
  assert(
    nonSuperAdminAllowed === true,
    "UserManager can assign permissions they possess"
  );

  const nonSuperAdminDenied = await PermissionService.validateUserCanAssignPermissions(
    usersManagerUser,
    ["perm-users-read", "perm-settings-write"],
    userPermMap
  );
  assert(
    nonSuperAdminDenied === false,
    "UserManager CANNOT assign permissions they do not possess (privilege escalation blocked)"
  );

  const superAdminAnyAssignment = await PermissionService.validateUserCanAssignPermissions(
    superAdminUser,
    ["perm-users-read", "perm-settings-write"],
    userPermMap
  );
  assert(
    superAdminAnyAssignment === true,
    "SuperAdmin can assign any permissions"
  );

  console.log("\n--- 2. Integration / API Route RBAC Tests ---");

  // 2.1 Unauthenticated requests return 401
  const unauthRes = await request(app).get("/api/v1/products");
  assert(
    unauthRes.status === 401 && unauthRes.body.error?.code === "UNAUTHORIZED",
    "Unauthenticated request to /api/v1/products returns 401 Unauthorized"
  );

  const invalidTokenRes = await request(app)
    .get("/api/v1/products")
    .set("Authorization", "Bearer invalid-token");
  assert(
    invalidTokenRes.status === 401 && invalidTokenRes.body.error?.code === "UNAUTHORIZED",
    "Invalid token returns 401 Unauthorized"
  );

  // 2.2 SuperAdmin can access all modules
  const superAdminProducts = await request(app)
    .get("/api/v1/products")
    .set("Authorization", "Bearer token-superadmin");
  assert(superAdminProducts.status === 200, "SuperAdmin can access GET /api/v1/products (200)");

  const superAdminOrders = await request(app)
    .get("/api/v1/orders")
    .set("Authorization", "Bearer token-superadmin");
  assert(superAdminOrders.status === 200, "SuperAdmin can access GET /api/v1/orders (200)");

  const superAdminDashboard = await request(app)
    .get("/api/v1/dashboard/overview")
    .set("Authorization", "Bearer token-superadmin");
  assert(superAdminDashboard.status === 200, "SuperAdmin can access GET /api/v1/dashboard/overview (200)");

  const superAdminSettings = await request(app)
    .get("/api/v1/settings/general")
    .set("Authorization", "Bearer token-superadmin");
  assert(superAdminSettings.status === 200, "SuperAdmin can access GET /api/v1/settings/general (200)");

  const superAdminUsers = await request(app)
    .get("/api/v1/users")
    .set("Authorization", "Bearer token-superadmin");
  assert(superAdminUsers.status === 200, "SuperAdmin can access GET /api/v1/users (200)");

  const superAdminAction = await request(app)
    .post("/api/v1/admin/superadmin-only-action")
    .set("Authorization", "Bearer token-superadmin");
  assert(superAdminAction.status === 200, "SuperAdmin can execute requireSuperAdmin route (200)");

  // 2.3 Admin (Products only)
  const prodUserProdGet = await request(app)
    .get("/api/v1/products")
    .set("Authorization", "Bearer token-products-only");
  assert(prodUserProdGet.status === 200, "ProductsOnly user can access GET /api/v1/products (200)");

  const prodUserProdPost = await request(app)
    .post("/api/v1/products")
    .set("Authorization", "Bearer token-products-only");
  assert(prodUserProdPost.status === 201, "ProductsOnly user can access POST /api/v1/products (201)");

  const prodUserOrdersGet = await request(app)
    .get("/api/v1/orders")
    .set("Authorization", "Bearer token-products-only");
  assert(
    prodUserOrdersGet.status === 403 && prodUserOrdersGet.body.error?.code === "FORBIDDEN",
    "ProductsOnly user is blocked from GET /api/v1/orders with 403 Forbidden"
  );

  const prodUserDashboardGet = await request(app)
    .get("/api/v1/dashboard/overview")
    .set("Authorization", "Bearer token-products-only");
  assert(
    prodUserDashboardGet.status === 403 && prodUserDashboardGet.body.error?.code === "FORBIDDEN",
    "ProductsOnly user is blocked from GET /api/v1/dashboard/overview with 403 Forbidden"
  );

  const prodUserSettingsGet = await request(app)
    .get("/api/v1/settings/general")
    .set("Authorization", "Bearer token-products-only");
  assert(
    prodUserSettingsGet.status === 403 && prodUserSettingsGet.body.error?.code === "FORBIDDEN",
    "ProductsOnly user is blocked from GET /api/v1/settings/general with 403 Forbidden"
  );

  const prodUserSuperAction = await request(app)
    .post("/api/v1/admin/superadmin-only-action")
    .set("Authorization", "Bearer token-products-only");
  assert(
    prodUserSuperAction.status === 403 && prodUserSuperAction.body.error?.code === "FORBIDDEN",
    "ProductsOnly user is blocked from requireSuperAdmin route with 403 Forbidden"
  );

  // 2.4 Admin (Orders only)
  const ordUserOrdersGet = await request(app)
    .get("/api/v1/orders")
    .set("Authorization", "Bearer token-orders-only");
  assert(ordUserOrdersGet.status === 200, "OrdersOnly user can access GET /api/v1/orders (200)");

  const ordUserProductsGet = await request(app)
    .get("/api/v1/products")
    .set("Authorization", "Bearer token-orders-only");
  assert(
    ordUserProductsGet.status === 403 && ordUserProductsGet.body.error?.code === "FORBIDDEN",
    "OrdersOnly user is blocked from GET /api/v1/products with 403 Forbidden"
  );

  const ordUserPaymentsGet = await request(app)
    .get("/api/v1/payments")
    .set("Authorization", "Bearer token-orders-only");
  assert(
    ordUserPaymentsGet.status === 403 && ordUserPaymentsGet.body.error?.code === "FORBIDDEN",
    "OrdersOnly user is blocked from GET /api/v1/payments with 403 Forbidden"
  );

  // 2.5 Admin (Products + Orders + Payments)
  const multiProd = await request(app)
    .get("/api/v1/products")
    .set("Authorization", "Bearer token-multi");
  assert(multiProd.status === 200, "MultiModule user can access GET /api/v1/products (200)");

  const multiOrders = await request(app)
    .get("/api/v1/orders")
    .set("Authorization", "Bearer token-multi");
  assert(multiOrders.status === 200, "MultiModule user can access GET /api/v1/orders (200)");

  const multiPayments = await request(app)
    .get("/api/v1/payments")
    .set("Authorization", "Bearer token-multi");
  assert(multiPayments.status === 200, "MultiModule user can access GET /api/v1/payments (200)");

  const multiSettings = await request(app)
    .get("/api/v1/settings/general")
    .set("Authorization", "Bearer token-multi");
  assert(
    multiSettings.status === 403 && multiSettings.body.error?.code === "FORBIDDEN",
    "MultiModule user is blocked from GET /api/v1/settings/general with 403 Forbidden"
  );

  const multiUsers = await request(app)
    .get("/api/v1/users")
    .set("Authorization", "Bearer token-multi");
  assert(
    multiUsers.status === 403 && multiUsers.body.error?.code === "FORBIDDEN",
    "MultiModule user is blocked from GET /api/v1/users with 403 Forbidden"
  );

  const multiRoles = await request(app)
    .get("/api/v1/roles")
    .set("Authorization", "Bearer token-multi");
  assert(
    multiRoles.status === 403 && multiRoles.body.error?.code === "FORBIDDEN",
    "MultiModule user is blocked from GET /api/v1/roles with 403 Forbidden"
  );

  // 2.6 Any Permission endpoint (Shipments/Orders)
  const ordUserShipments = await request(app)
    .get("/api/v1/shipments")
    .set("Authorization", "Bearer token-orders-only");
  assert(
    ordUserShipments.status === 200,
    "OrdersOnly user can access GET /api/v1/shipments (requires Shipments.read OR Orders.read)"
  );

  const prodUserShipments = await request(app)
    .get("/api/v1/shipments")
    .set("Authorization", "Bearer token-products-only");
  assert(
    prodUserShipments.status === 403 && prodUserShipments.body.error?.code === "FORBIDDEN",
    "ProductsOnly user is blocked from GET /api/v1/shipments with 403 Forbidden"
  );

  console.log("\n--- 3. Privilege Escalation & Controller Guard Security Tests ---");

  // 3.1 Non-SuperAdmin (even with Users.write) cannot reset SuperAdmin password
  const resetAttempt = await request(app)
    .post(`/api/v1/users/${superAdminUser.id}/reset-password`)
    .set("Authorization", "Bearer token-users-manager")
    .send({ newPassword: "NewPassword123!" });
  assert(
    resetAttempt.status === 403 && resetAttempt.body.error?.code === "SUPERADMIN_PROTECTED",
    "Non-SuperAdmin is blocked from resetting SuperAdmin password (403 SUPERADMIN_PROTECTED)"
  );

  // 3.2 SuperAdmin CAN reset SuperAdmin password
  const superAdminReset = await request(app)
    .post(`/api/v1/users/${superAdminUser.id}/reset-password`)
    .set("Authorization", "Bearer token-superadmin")
    .send({ newPassword: "NewPassword123!" });
  assert(
    superAdminReset.status === 200,
    "SuperAdmin CAN reset SuperAdmin password (200)"
  );

  // 3.3 User cannot modify own role
  const ownRoleAttempt = await request(app)
    .patch(`/api/v1/users/${usersManagerUser.id}/role`)
    .set("Authorization", "Bearer token-users-manager")
    .send({ roleId: "role-super-admin-1" });
  assert(
    ownRoleAttempt.status === 403 && ownRoleAttempt.body.error?.code === "CANNOT_MODIFY_OWN_ROLE",
    "User is blocked from modifying own role (403 CANNOT_MODIFY_OWN_ROLE)"
  );

  // 3.4 Non-SuperAdmin cannot assign SuperAdmin role to another user
  const assignSuperAdminRoleAttempt = await request(app)
    .patch(`/api/v1/users/${ordersOnlyUser.id}/role`)
    .set("Authorization", "Bearer token-users-manager")
    .send({ roleId: superAdminUser.roleId });
  assert(
    assignSuperAdminRoleAttempt.status === 403 && assignSuperAdminRoleAttempt.body.error?.code === "SUPERADMIN_PROTECTED",
    "Non-SuperAdmin cannot assign SuperAdmin role (403 SUPERADMIN_PROTECTED)"
  );

  // 3.5 SuperAdmin role permissions cannot be modified
  const modifySuperAdminPermsAttempt = await request(app)
    .patch(`/api/v1/roles/${superAdminUser.roleId}/permissions`)
    .set("Authorization", "Bearer token-superadmin")
    .send({ permissionIds: ["perm-1"] });
  assert(
    modifySuperAdminPermsAttempt.status === 403 && modifySuperAdminPermsAttempt.body.error?.code === "SUPERADMIN_PROTECTED",
    "SuperAdmin role permissions are immutable (403 SUPERADMIN_PROTECTED)"
  );

  console.log("\n=================================================");
  console.log(`TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests when invoked via CLI
runRbacTests().catch((err) => {
  console.error("Test suite threw uncaught exception:", err);
  process.exit(1);
});
