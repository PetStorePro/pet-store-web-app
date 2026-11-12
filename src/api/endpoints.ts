/**
 * API CONTRACT — PetStore Pro backend (Spring Boot)
 * ==================================================
 * Base URL: configured via VITE_API_BASE_URL (see .env.example)
 * Auth:     POST /api/auth/login returns a JWT; every other endpoint
 *           requires header `Authorization: Bearer <token>`.
 *
 * AUTH
 *   POST   /api/auth/login              body: LoginRequest            -> AuthResponse
 *
 * PRODUCTS
 *   GET    /api/products                query: ?search=&category=&page=&pageSize=
 *   GET    /api/products/{id}
 *   POST   /api/products                body: CreateProductRequest    -> Product
 *   PUT    /api/products/{id}           body: UpdateProductRequest    -> Product
 *   DELETE /api/products/{id}
 *
 * INVENTORY
 *   GET    /api/inventory/movements     query: ?productId=&page=&pageSize=
 *   POST   /api/inventory/adjustments   body: { productId, type: 'IN'|'OUT'|'ADJUSTMENT',
 *                                               quantity, reason }    -> StockMovement
 *   GET    /api/inventory/products/{id} -> { productId, stock, movements[] } (optional detail view)
 *
 * SALES
 *   POST   /api/sales                   body: RegisterSaleRequest     -> Sale
 *   GET    /api/sales                   query: ?from=&to=&page=&pageSize=
 *   GET    /api/sales/{id}
 *
 * ALERTS
 *   GET    /api/alerts                  query: ?type=&resolved=
 *   PATCH  /api/alerts/{id}/resolve
 *
 * AUDIT  (MANAGER only)
 *   GET    /api/audit-logs              query: ?userId=&action=&from=&to=&page=&pageSize=
 *
 * DASHBOARD (MANAGER only)
 *   GET    /api/dashboard/summary
 *
 * ACTUATOR (monitoring — Student 1)
 *   GET    /actuator/health
 *   GET    /actuator/prometheus
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
