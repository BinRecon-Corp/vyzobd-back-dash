# UI Design System & Architecture

## 1. Design Language & Principles
- **Style**: Minimal, Professional, Enterprise-Grade (inspired by Stripe and Shopify Admin).
- **Core Philosophy**: High signal-to-noise ratio. Data is the primary focus. Use borders and subtle background shades to separate content rather than heavy drop shadows.
- **Color Palette**:
  - **Background (Light)**: Clean White (`#FFFFFF`) with subtle off-white (`#F9FAFB`) for secondary surfaces (e.g., sidebar, table headers).
  - **Background (Dark)**: Deep Gray (`#09090B`) with elevated surfaces in (`#18181B`).
  - **Text**: High contrast grays (`#09090B` for primary, `#71717A` for secondary).
  - **Accent/Brand**: Deep professional Blue (e.g., `#2563EB` to `#1D4ED8`).
  - **Status Colors**: Emerald Green (Success), Amber (Warning), Rose (Destructive/Error).
- **Typography**: Inter or Geist (if available) for clean, readable data presentation.
- **Radii**: Subtle rounding (e.g., `0.5rem` or `8px` for cards, `6px` for buttons).

## 2. Layouts

### Desktop Layout
- **Sidebar (Left)**: Collapsible (expanded by default). Contains primary navigation links with active state styling. 
- **Top Bar**: Global search (CMD+K), User profile dropdown, Theme toggle, Notification bell.
- **Main Content Area**: Padded container (`p-6` or `p-8`) with a max-width for ultra-wide screens to maintain readability.

### Mobile Layout
- **Sidebar**: Becomes a hidden Drawer (Sheet) accessible via a hamburger menu in the Top Bar.
- **Bottom Navigation**: (Optional for mobile-first quick actions, though complex tables remain horizontal scrolling).
- **Main Content Area**: Reduced padding (`p-4`). Data tables utilize horizontal scroll or card-based list views.

## 3. Page Structures (Wireframes)

### Dashboard (Overview)
- **Header**: Greeting and Date Range Picker.
- **KPI Cards**: 4 cards in a row (Total Revenue, Active Users, Total Orders, Conversion Rate). Include trend indicators (+/- %).
- **Charts**: 
  - Main Chart (Area Chart): Revenue over time.
  - Secondary Chart (Bar Chart): Top selling categories.
- **Recent Orders**: A compact data table showing the last 5 orders with status pills.

### Products / Orders / Customers (Standard List View)
- **Page Header**: Title (e.g., "Products") and primary action button (e.g., "Add Product").
- **Toolbar**: 
  - Left: Search input (`<Search className="w-4 h-4" /> Search products...`).
  - Right: Filter dropdowns (Category, Status) and View toggle.
- **Data Table**: 
  - Sortable column headers.
  - Checkboxes for bulk actions.
  - Action menu (Elipsis/Three dots) per row (Edit, Delete, Duplicate).
- **Footer**: Pagination controls (Rows per page, Previous/Next, Page numbers).

## 4. Component Tree

```text
src/frontend/
└── components/
    ├── ui/                 # Shadcn primitives (Button, Input, Table, etc.)
    ├── layout/
    │   ├── AdminLayout.tsx   # Wraps Sidebar, Header, and Main Content
    │   ├── Sidebar.tsx       # Desktop sidebar / Mobile drawer content
    │   ├── Header.tsx        # Top navigation, UserNav, GlobalSearch
    │   └── PageContainer.tsx # Consistent padding and max-width wrapper
    ├── shared/
    │   ├── DataTable/        # Reusable complex table component
    │   ├── StatusBadge.tsx   # Reusable pill for Active/Pending/etc.
    │   ├── MetricCard.tsx    # Dashboard KPI widget
    │   └── EmptyState.tsx    # For when lists have no data
    └── forms/
        ├── ProductForm.tsx
        ├── CategoryForm.tsx
        └── SettingsForm.tsx
```

## 5. UI Features & Interactions
- **Dark Mode**: Handled via `next-themes` (or standard React context adding a `dark` class to `html`). All colors use Tailwind's `dark:` modifier.
- **Loading States**: 
  - Initial load uses Skeleton components matching the shape of the incoming data (e.g., `<Skeleton className="h-4 w-[250px]" />`).
  - Button loading states (Spinner + "Saving...").
- **Notifications**: Toast notifications (via Sonner or Shadcn Toaster) for CRUD operations (e.g., "Product saved successfully").
- **Data Tables**: Built on `@tanstack/react-table` for headless, robust sorting, filtering, and pagination.
