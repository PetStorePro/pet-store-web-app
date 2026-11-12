export type Role = 'EMPLOYEE' | 'MANAGER' | 'DEVOPS'

export interface User {
  id: string
  username: string
  fullName: string
  role: Role
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string // JWT
  user: User
}

export type ProductCategory =
  | 'FOOD'
  | 'MEDICINE'
  | 'TOY'
  | 'ACCESSORY'
  | 'CARE'

export interface Product {
  id: string
  name: string
  description: string
  category: ProductCategory
  price: number
  /** ISO date — used for expiring-medicine alerts */
  expiryDate?: string
  /** current stock level */
  stock: number
  /** stock level at/below which a low-stock alert fires */
  lowStockThreshold: number
  createdAt: string
}

export interface CreateProductRequest {
  name: string
  description: string
  category: ProductCategory
  price: number
  expiryDate?: string
  lowStockThreshold: number
}

export type UpdateProductRequest = Partial<CreateProductRequest>

export type MovementType = 'IN' | 'OUT' | 'SALE' | 'ADJUSTMENT'

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: MovementType
  quantity: number // signed
  reason?: string
  userId: string
  username: string
  createdAt: string
}

export interface RegisterSaleRequest {
  productId: string
  quantity: number
  customerName?: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  total: number
  customerName?: string
  userId: string
  username: string
  createdAt: string
}

export type AlertType = 'LOW_STOCK' | 'EXPIRING_MEDICINE' | 'NEGATIVE_STOCK'

export interface Alert {
  id: string
  type: AlertType
  productId: string
  productName: string
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  createdAt: string
  resolved: boolean
}

export interface AuditLog {
  id: string
  userId: string
  username: string
  action: string // e.g. PRODUCT_CREATED, SALE_REGISTERED, STOCK_ADDED
  entityType: string // e.g. Product, Sale, StockMovement
  entityId?: string
  details?: string
  createdAt: string
}

export interface DashboardSummary {
  totalProducts: number
  totalStockValue: number
  salesToday: number
  lowStockCount: number
  expiringCount: number
  openAlerts: number
  recentSales: Sale[]
  topProducts: { productId: string; productName: string; unitsSold: number }[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
