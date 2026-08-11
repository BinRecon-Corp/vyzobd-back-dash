# ROLE-BASED ACCESS CONTROL (RBAC) REFERENCE

This document serves as the authoritative reference for the Role-Based Access Control (RBAC) engine implemented across the full-stack architecture — covering core roles, granular permission matrices, supported modules, actions, backend authorization middleware, and frontend UI visibility rules.

---

## 1. SYSTEM ARCHITECTURE & RBAC MODEL

The platform enforces a fine-grained RBAC model where **Users** are assigned a **Role**, and each **Role** contains a collection of **Permissions**. Each permission explicitly defines an **Action** (`read`, `write`, `delete`) scoped to a specific **Module** (e.g., `Products`, `Orders`, `Users`).

```
┌─────────────┐       1:N       ┌─────────────┐       N:M       ┌─────────────────┐
│    User     ├─────────────────►    Role     ├─────────────────►   Permission    │
│  (Active)   │                 │ (e.g. Admin)│                 │(module + action)│
└─────────────┘                 └─────────────┘                 └─────────────────┘
```

---

## 2. SYSTEM ROLES

The system seeds and supports 6 primary operational roles:

| Role Name | Scope & Description | Default Permission Allocation |
|-----------|─────────────────────|--------------------------------|
| **`SuperAdmin`** | Super Administrator with unrestricted access across all system capabilities. Bypasses middleware checks. | All modules & actions (`read`, `write`, `delete`). |
| **`Admin`** | System Administrator with full operational access for store management. | Standard administrative privileges across all 23 modules. |
| **`InventoryManager`** | Dedicated supply chain and catalog management role. | `read`, `write`, `delete` for `Products`, `Categories`, `Brands`, `Inventory`, `Media`. |
| **`MarketingManager`** | Content, campaign, analytics, and promotional manager. | `read`, `write`, `delete` for `Analytics`, `Coupons`, `Promotions`, `Marketing`, `Banners`, `Popups`, `Media`, `Blog`, `CMS`; `read` for catalog (`Products`, `Categories`, `Brands`). |
| **`SupportAgent`** | Customer support and fulfillment representative. | `read` across all modules; `write` and `delete` for `Orders` and `Customers`. |
| **`Viewer`** | Read-only executive or auditor role. | `read` access across all operational modules. |

---

## 3. MODULES & ACTIONS MATRIX

### 3.1 Supported Actions

| Action | Keyword | Description |
|--------|---------|-------------|
| **Read** | `read` | Allows listing, viewing details, exporting data, and inspecting metrics. |
| **Write** | `write` | Allows creating new records, modifying existing entities, and updating statuses. |
| **Delete** | `delete` | Allows soft/hard deletion of records, revoking sessions, or purging resources. |
| **Wildcard** | `all` | Granted to system processes or special administrative overrides. |

---

### 3.2 System Modules (23 Total)

```
Catalog:        [ Products | Categories | Brands | Attributes | Inventory | Media ]
Sales & CRM:    [ Orders | Customers | Payments | Refunds | Shipments | Returns ]
Marketing:      [ Coupons | Promotions | Marketing | Banners | Popups | Analytics ]
Content:        [ Blog | CMS | SEO | FAQs ]
Administration: [ Users | Roles | Permissions | Settings | Security | Sessions | AuditLogs ]
```

| Module Name | Backend Key | Description |
|-------------|-------------|-------------|
| **Products** | `Products` | Catalog item management, pricing, variants, and SEO meta. |
| **Categories** | `Categories` | Hierarchy categories, subcategories, and category banners. |
| **Brands** | `Brands` | Manufacturer brands, logos, and websites. |
| **Attributes** | `Attributes` | Variant attribute definitions (e.g., Color, Size, Storage). |
| **Inventory** | `Inventory` | Warehouse stock adjustments, reserve allocations, and safety levels. |
| **Orders** | `Orders` | Order management, item line updates, staff assignment, and status transitions. |
| **Customers** | `Customers` | Customer profile management, address book, and internal service notes. |
| **Payments** | `Payments` | Payment transaction records, gateway verification, and ledger. |
| **Coupons** | `Coupons` | Promotional discount codes, usage limits, and validity constraints. |
| **Promotions** | `Promotions` | Automatic discount rules, tier discounts, and flash sales. |
| **Marketing** | `Marketing` | Marketing campaigns, email dispatch, and subscriber lists. |
| **Banners** | `Banners` | Homepage slider graphics, mobile promotional banners, and campaign headers. |
| **Popups** | `Popups` | Exit-intent popups, newsletter signup modals, and top notification bars. |
| **Analytics** | `Analytics` | Sales performance, conversion tracking, customer LTV, and revenue reporting. |
| **Media** | `Media` | Cloudinary asset library, image uploading, and folder organization. |
| **Blog** | `Blog` | Content marketing articles, blog posts, authors, and tag taxonomies. |
| **CMS** | `CMS` | Static page creation, custom landing page builder, and legal policies. |
| **Users** | `Users` | Internal admin user management, password resets, and account locking. |
| **Roles** | `Roles` | Role creation, permission assignments, and access matrix configuration. |
| **Permissions** | `Permissions` | Reference listing of system permissions. |
| **Settings** | `Settings` | General store configurations, tax rates, shipping methods, and SMTP settings. |
| **Security** | `Security` | Two-factor authentication configuration, IP whitelist, and password policy. |
| **Sessions** | `Sessions` | Active admin user JWT refresh token sessions and session revocation. |
| **AuditLogs** | `AuditLogs` | Administrative activity logging and security audit trails. |

---

## 4. BACKEND AUTHORIZATION ENFORCEMENT

All admin API endpoints enforce authentication and permission requirements using Express middleware.

### 4.1 Middleware Chain Overview
```
Client Request ──► [ requireAuth ] ──► [ requirePermission(module, action) ] ──► Controller Handler
```

### 4.2 Code Implementation Reference (`src/backend/middlewares/auth.ts`)

```typescript
// Permission Enforcement Middleware
export const requirePermission = (module: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {        return next(new AppError("User not authenticated", 401, "UNAUTHORIZED"));
      }

      // 1. SuperAdmin bypasses all permission checks
      if (req.user.roleName === "SuperAdmin") {
        return next();
      }

      // 2. Check if user's granted permissions match module and action
      const hasPermission = req.user.permissions.some(
        (p) =>
          p.module.toLowerCase() === module.toLowerCase() &&
          (p.action.toLowerCase() === action.toLowerCase() || p.action === "all")
      );

      if (!hasPermission) {
        // Log security access violation to ActivityLog table
        await prisma.activityLog.create({
          data: {
            userId: req.user.id,
            action: "ACCESS_DENIED",
            entityType: "Security",
            entityId: module,
            ipAddress: req.ip || null,
            details: JSON.stringify({ module, action, reason: "Required privileges missing" })
          }
        });

        return next(
          new AppError(`You do not have permission (${action} on ${module}) to perform this action`, 403, "FORBIDDEN")
        );
      }

      next();
    } catch (error) {      next(error);
    }
  };
};
```

---

## 5. FRONTEND VISIBILITY & ACCESS CONTROL RULES

The React frontend evaluates permissions dynamically using the `useAuth()` hook provided by `AuthContext`.

### 5.1 Permission Checking Helper (`useAuth().hasPermission`)

```typescript
const hasPermission = (module: string, action: string): boolean => {
  if (!user) return false;
  if (user.role.name === "SuperAdmin") return true;
  if (!user.role.permissions) return false;

  return user.role.permissions.some(
    (p) => p.module === module && p.action === action
  );
};
```

---

### 5.2 Navigation Sidebar Visibility Rules (`Sidebar.tsx`)

1. **Standalone Menu Items (e.g., Dashboard, Profile):**
   - Visible if `item.module === 'Dashboard'` OR `hasPermission(item.module, 'read')` returns `true`.

2. **Group Menu Items (e.g., Catalog, Sales, Settings):**
   - Each sub-item in a group is filtered by `hasPermission(sub.module, 'read')`.
   - If `visibleItems.length === 0`, the **entire group header and collapsible container are hidden from the user's sidebar**.

```typescript
// Sidebar Group Visibility Filtering
const visibleItems = group.items.filter(sub => hasPermission(sub.module, 'read'));
if (visibleItems.length === 0) return null; // Hide parent navigation group
```

---

### 5.3 Page-Level Route Protection (`RoutePermissionGuard`)

Used in `App.tsx` router configuration to protect entire admin page views. Unprivileged users are redirected to `/` (Dashboard).

```tsx
<Route
  path="/admin/users"
  element={
    <RoutePermissionGuard module="Users" action="read">
      <UsersPage />
    </RoutePermissionGuard>
  }
/>
```

---

### 5.4 Element & Action UI Guards (`PermissionGuard`)

Used inside components to conditionally show/hide action buttons, modal triggers, export options, or mass deletion controls.

```tsx
// Example: Restricting "Add New User" button to users with Users:write
<PermissionGuard module="Users" action="write">
  <Button onClick={() => setShowCreateModal(true)}>
    <Plus className="h-4 w-4 mr-2" /> Add User
  </Button>
</PermissionGuard>

// Example: Restricting "Delete Role" button to Users with Roles:delete (excluding SuperAdmin target)
{hasPermission("Roles", "delete") && role.name !== "SuperAdmin" && (
  <Button variant="destructive" onClick={() => handleDelete(role.id)}>
    Delete Role
  </Button>
)}
```

---

## 6. FRONTEND VISIBILITY MATRIX BY ROLE

| UI Section / Navigation Item | Module Required | SuperAdmin | Admin | InventoryManager | MarketingManager | SupportAgent | Viewer |
|------------------------------|─────────────────|:----------:|:-----:|:----------------:|:----------------:|:------------:|:------:|
| **Dashboard** | `Dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Products List / Editor** | `Products` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ✅ Read/Write/Delete | 👁️ Read Only | 👁️ Read Only | 👁️ Read Only |
| **Categories & Brands** | `Categories`/`Brands` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ✅ Read/Write/Delete | 👁️ Read Only | 👁️ Read Only | 👁️ Read Only |
| **Inventory Stock Management** | `Inventory` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ❌ Hidden | 👁️ Read Only | 👁️ Read Only |
| **Orders & Fulfillment** | `Orders` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | 👁️ Read Only | 👁️ Read Only | ✅ Read/Write/Delete | 👁️ Read Only |
| **Customers Directory** | `Customers` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | 👁️ Read Only | 👁️ Read Only | ✅ Read/Write/Delete | 👁️ Read Only |
| **Coupons & Promotions** | `Coupons`/`Promotions` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ❌ Hidden | ✅ Read/Write/Delete | 👁️ Read Only | 👁️ Read Only |
| **Marketing & Banners** | `Banners`/`Popups` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ❌ Hidden | ✅ Read/Write/Delete | 👁️ Read Only | 👁️ Read Only |
| **Analytics & Reports** | `Analytics` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | 👁️ Read Only | ✅ Read/Write/Delete | 👁️ Read Only | 👁️ Read Only |
| **Media Library** | `Media` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ✅ Read/Write/Delete | 👁️ Read Only | 👁️ Read Only |
| **User Management** | `Users` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ❌ Hidden | ❌ Hidden | ❌ Hidden | 👁️ Read Only |
| **Roles & Permissions** | `Roles` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ❌ Hidden | ❌ Hidden | ❌ Hidden | 👁️ Read Only |
| **Store Settings** | `Settings` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ❌ Hidden | ❌ Hidden | ❌ Hidden | 👁️ Read Only |
| **Audit Logs & Sessions** | `AuditLogs`/`Sessions` | ✅ Read/Write/Delete | ✅ Read/Write/Delete | ❌ Hidden | ❌ Hidden | ❌ Hidden | 👁️ Read Only |

---

*End of Role-Based Access Control (RBAC) Reference Specification.*
