# PetStore Pro — Backend API Specification

Source contract: `src/api/endpoints.ts` (frontend) and `src/types/index.ts`.

- **Base URL:** configured via `VITE_API_BASE_URL` (see `.env.example`)
- **Auth:** `POST /api/auth/login` returns a JWT; every other endpoint requires header `Authorization: Bearer <token>`.
- **Pagination:** endpoints accepting `page`/`pageSize` return the envelope `{ items, total, page, pageSize }` (`Paginated<T>`).
- **Roles:** `EMPLOYEE`, `MANAGER`, `DEVOPS` (see `src/types/index.ts`).

---

## AUTH

| Method | Path | Request body | Response |
|---|---|---|---|
| POST | `/api/auth/login` | `LoginRequest` | `AuthResponse` |

**LoginRequest:** `{ username: string, password: string }`

**AuthResponse:** `{ token: string /* JWT */, user: User }`

**User:** `{ id, username, fullName, role }` where `role: 'EMPLOYEE' \| 'MANAGER' \| 'DEVOPS'`

---

## PRODUCTS

| Method | Path | Params / Body | Response |
|---|---|---|---|
| GET | `/api/products` | `?search=&category=&lowStockOnly=&page=&pageSize=` | `Paginated<Product>` |
| GET | `/api/products/{id}` | — | `Product` |
| POST | `/api/products` | `CreateProductRequest` | `Product` |
| PUT | `/api/products/{id}` | `UpdateProductRequest` | `Product` |
| DELETE | `/api/products/{id}` | — | 204 |

**Product:**

```ts
{
  id: string
  name: string
  description: string
  category: 'FOOD' | 'MEDICINE' | 'TOY' | 'ACCESSORY' | 'CARE'
  price: number
  expiryDate?: string        // ISO date — used for expiring-medicine alerts
  stock: number              // current stock level
  lowStockThreshold: number  // stock level at/below which a low-stock alert fires
  createdAt: string
}
```

`lowStockOnly` is an optional boolean (default `false`). When `true`, only products with `stock <= lowStockThreshold` are returned. It combines with search and category filters before pagination and counting.

**CreateProductRequest:** `{ name, description, category, price, expiryDate?, lowStockThreshold }`

**UpdateProductRequest:** `Partial<CreateProductRequest>` — all fields optional.

Write operations require `MANAGER`/`DEVOPS` role.

---

## INVENTORY

| Method | Path | Params / Body | Response |
|---|---|---|---|
| GET | `/api/inventory/movements` | `?productId=&page=&pageSize=` | `Paginated<StockMovement>` |
| POST | `/api/inventory/adjustments` | `{ productId, type: 'IN' \| 'OUT' \| 'ADJUSTMENT', quantity, reason }` | `StockMovement` |
| GET | `/api/inventory/products/{id}` | — | `{ productId, stock, movements[] }` (optional detail view) |

**MovementType:** `'IN' | 'OUT' | 'SALE' | 'ADJUSTMENT'`

**StockMovement:**

```ts
{
  id: string
  productId: string
  productName: string
  type: MovementType
  quantity: number          // signed
  reason?: string
  userId: string
  username: string
  createdAt: string
}
```

---

## SALES

| Method | Path | Params / Body | Response |
|---|---|---|---|
| POST | `/api/sales` | `RegisterSaleRequest` | `Sale` |
| GET | `/api/sales` | `?from=&to=&page=&pageSize=` | `Paginated<Sale>` |
| GET | `/api/sales/{id}` | — | `Sale` |

**RegisterSaleRequest:** `{ productId: string, quantity: number, customerName?: string }`

**Sale:**

```ts
{
  id: string
  items: SaleItem[]
  total: number
  customerName?: string
  userId: string
  username: string
  createdAt: string
}
```

**SaleItem:** `{ productId, productName, quantity, unitPrice }`

> Note: the frontend posts a single `productId` but the response `Sale` wraps it in `items[]`. Internally a sale is a one-item sale. The backend may accept `items[]` for future multi-item carts.

---

## ALERTS

| Method | Path | Params | Response |
|---|---|---|---|
| GET | `/api/alerts` | `?type=&resolved=` | `Alert[]` |
| PATCH | `/api/alerts/{id}/resolve` | — | `Alert` |

**AlertType:** `'LOW_STOCK' | 'EXPIRING_MEDICINE' | 'NEGATIVE_STOCK'`

**Alert:**

```ts
{
  id: string
  type: AlertType
  productId: string
  productName: string
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  createdAt: string
  resolved: boolean
}
```

---

## AUDIT (MANAGER only)

| Method | Path | Params | Response |
|---|---|---|---|
| GET | `/api/audit-logs` | `?userId=&action=&from=&to=&page=&pageSize=` | `Paginated<AuditLog>` |

**AuditLog:**

```ts
{
  id: string
  userId: string
  username: string
  action: string      // e.g. PRODUCT_CREATED, SALE_REGISTERED, STOCK_ADDED
  entityType: string  // e.g. Product, Sale, StockMovement
  entityId?: string
  details?: string
  createdAt: string
}
```

---

## DASHBOARD (MANAGER only)

| Method | Path | Response |
|---|---|---|
| GET | `/api/dashboard/summary` | `DashboardSummary` |

**DashboardSummary:**

```ts
{
  totalProducts: number
  totalStockValue: number
  salesToday: number
  lowStockCount: number
  expiringCount: number
  openAlerts: number
  recentSales: Sale[]
  topProducts: { productId: string; productName: string; unitsSold: number }[]
}
```

---

## ACTUATOR (monitoring)

- `GET /actuator/health`
- `GET /actuator/prometheus`

Via `spring-boot-starter-actuator` + `micrometer-registry-prometheus`.

---

## Spring Boot Implementation Checklist

### Controllers

- `AuthController` — `/api/auth/login`
- `ProductController` — `/api/products`
- `InventoryController` — `/api/inventory`
- `SaleController` — `/api/sales`
- `AlertController` — `/api/alerts`
- `AuditController` — `/api/audit-logs`
- `DashboardController` — `/api/dashboard/summary`

### Entities (JPA)

`User`, `Product`, `StockMovement`, `Sale`, `SaleItem`, `Alert`, `AuditLog`

Suggested DB: PostgreSQL or H2 (dev).

### Security

- Spring Security + JWT (`jjwt` or Spring Security OAuth2 resource server)
- Role-based access:
  - `MANAGER`/`DEVOPS`: product write, audit logs, dashboard
  - All authenticated roles: products read, inventory, sales, alerts

### Business logic

- `POST /api/sales` must be `@Transactional`: decrement stock, insert a `SALE` `StockMovement`, persist `Sale` + `SaleItem`, write `AuditLog`, and trigger alert checks (low stock / negative stock).
- Alert generation on product create/update and stock changes: `LOW_STOCK`, `EXPIRING_MEDICINE`, `NEGATIVE_STOCK`, with severity assignment.
- Audit logging on every mutating endpoint (explicit service calls or AOP aspect).

### Cross-cutting

- `@ControllerAdvice` for validation errors; response shapes must match `Paginated<T>` exactly.
- Accept `page`/`pageSize` params; return `{ items, total, page, pageSize }` envelope.
- CORS: allow the Vite frontend origin (dev server).
- Config in `application.properties`: JWT secret, datasource, actuator exposure.

### Open question

Frontend `RegisterSaleRequest` only carries one `productId`, but `Sale.items` is an array. Backend should probably accept `items[]` so the contract doesn't block a future cart UI.
