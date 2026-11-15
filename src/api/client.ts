import type {
  Alert,
  AuditLog,
  AuthResponse,
  CreateProductRequest,
  DashboardSummary,
  LoginRequest,
  MovementType,
  Paginated,
  Product,
  ProductCategory,
  RegisterSaleRequest,
  Sale,
  StockMovement,
  UpdateProductRequest,
  User,
} from '../types'
import { API_BASE_URL } from './endpoints'
import {
  mockAlerts,
  mockAuditLogs,
  mockMovements,
  mockProducts,
  mockSales,
} from './mockData'

/**
 * API client. Login uses the real backend; the remaining methods still use
 * in-memory mock data until their backend endpoints are implemented.
 */

// In-memory stores seeded from mock data (mutated per session)
const products = [...mockProducts]
const sales = [...mockSales]
const movements = [...mockMovements]
const alerts = [...mockAlerts]
const auditLogs = [...mockAuditLogs]

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))
let idSeq = 1000
const nextId = (prefix: string) => `${prefix}${++idSeq}`
const now = () => new Date().toISOString()

function audit(user: User, action: string, entityType: string, entityId?: string, details?: string) {
  auditLogs.unshift({
    id: nextId('l'),
    userId: user.id,
    username: user.username,
    action,
    entityType,
    entityId,
    details,
    createdAt: now(),
  })
}

function paginate<T>(items: T[], page = 1, pageSize = 50): Paginated<T> {
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize }
}

function isRole(value: unknown): value is User['role'] {
  return value === 'EMPLOYEE' || value === 'MANAGER' || value === 'DEVOPS'
}

export function currentUser(): User | null {
  const raw = localStorage.getItem('petstore_token')
  if (!raw) return null
  try {
    const encodedPayload = raw.split('.')[1]
    if (!encodedPayload) throw new Error('Invalid token')
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const payload: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
    if (!payload || typeof payload !== 'object') throw new Error('Invalid token')

    const claims = payload as Record<string, unknown>
    if (
      typeof claims.sub !== 'string' ||
      typeof claims.username !== 'string' ||
      typeof claims.fullName !== 'string' ||
      !isRole(claims.role) ||
      typeof claims.exp !== 'number' ||
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      throw new Error('Invalid or expired token')
    }

    return {
      id: claims.sub,
      username: claims.username,
      fullName: claims.fullName,
      role: claims.role,
    }
  } catch {
    localStorage.removeItem('petstore_token')
    return null
  }
}

export const api = {
  /** POST /api/auth/login — body: LoginRequest */
  async login(req: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })

    let result: unknown
    try {
      result = await response.json()
    } catch {
      throw new Error(`Login failed (HTTP ${response.status})`)
    }

    if (!response.ok) {
      const message =
        result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
          ? result.message
          : `Login failed (HTTP ${response.status})`
      throw new Error(message)
    }

    if (!result || typeof result !== 'object' || !('token' in result) || !('user' in result)) {
      throw new Error('The server returned an invalid login response')
    }

    const auth = result as AuthResponse
    if (
      typeof auth.token !== 'string' ||
      !auth.user ||
      typeof auth.user.id !== 'string' ||
      typeof auth.user.username !== 'string' ||
      typeof auth.user.fullName !== 'string' ||
      !isRole(auth.user.role)
    ) {
      throw new Error('The server returned an invalid login response')
    }

    localStorage.setItem('petstore_token', auth.token)
    return auth
  },

  /** POST /api/auth/logout (client-side: discard token) */
  logout() {
    localStorage.removeItem('petstore_token')
  },

  /** GET /api/products?search=&category=&page=&pageSize= */
  async listProducts(params?: {
    search?: string
    category?: ProductCategory
    page?: number
    pageSize?: number
  }): Promise<Paginated<Product>> {
    await delay(150)
    let items = [...products].sort((a, b) => a.name.localeCompare(b.name))
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    if (params?.category) items = items.filter((p) => p.category === params.category)
    return paginate(items, params?.page, params?.pageSize)
  },

  /** GET /api/products/{id} */
  async getProduct(id: string): Promise<Product> {
    await delay(100)
    const p = products.find((x) => x.id === id)
    if (!p) throw new Error('Product not found')
    return p
  },

  /** POST /api/products — body: CreateProductRequest (MANAGER/DEVOPS) */
  async createProduct(user: User, req: CreateProductRequest): Promise<Product> {
    await delay()
    const product: Product = {
      id: nextId('p'),
      ...req,
      stock: 0,
      createdAt: now(),
    }
    products.unshift(product)
    audit(user, 'PRODUCT_CREATED', 'Product', product.id, product.name)
    return product
  },

  /** PUT /api/products/{id} — body: UpdateProductRequest (MANAGER/DEVOPS) */
  async updateProduct(user: User, id: string, req: UpdateProductRequest): Promise<Product> {
    await delay()
    const idx = products.findIndex((x) => x.id === id)
    if (idx === -1) throw new Error('Product not found')
    products[idx] = { ...products[idx], ...req }
    audit(user, 'PRODUCT_UPDATED', 'Product', id, products[idx].name)
    return products[idx]
  },

  /** DELETE /api/products/{id} (MANAGER/DEVOPS) */
  async deleteProduct(user: User, id: string): Promise<void> {
    await delay()
    const idx = products.findIndex((x) => x.id === id)
    if (idx === -1) throw new Error('Product not found')
    const [removed] = products.splice(idx, 1)
    audit(user, 'PRODUCT_DELETED', 'Product', id, removed.name)
  },

  /** GET /api/inventory/movements?productId=&page=&pageSize= */
  async listMovements(params?: {
    productId?: string
    page?: number
    pageSize?: number
  }): Promise<Paginated<StockMovement>> {
    await delay(150)
    let items = [...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (params?.productId) items = items.filter((m) => m.productId === params.productId)
    return paginate(items, params?.page, params?.pageSize)
  },

  /**
   * POST /api/inventory/adjustments
   * body: { productId, type: 'IN'|'OUT'|'ADJUSTMENT', quantity, reason }
   * IN adds stock; OUT removes stock; ADJUSTMENT sets absolute stock.
   */
  async adjustStock(
    user: User,
    req: { productId: string; type: MovementType; quantity: number; reason?: string },
  ): Promise<StockMovement> {
    await delay()
    const product = products.find((p) => p.id === req.productId)
    if (!product) throw new Error('Product not found')
    const delta = req.type === 'ADJUSTMENT' ? req.quantity - product.stock : req.type === 'IN' ? req.quantity : -Math.abs(req.quantity)
    const newStock = req.type === 'ADJUSTMENT' ? req.quantity : product.stock + delta
    product.stock = newStock

    const movement: StockMovement = {
      id: nextId('m'),
      productId: product.id,
      productName: product.name,
      type: req.type,
      quantity: req.type === 'ADJUSTMENT' ? delta : req.type === 'IN' ? req.quantity : -Math.abs(req.quantity),
      reason: req.reason,
      userId: user.id,
      username: user.username,
      createdAt: now(),
    }
    movements.unshift(movement)
    audit(user, 'STOCK_ADJUSTED', 'StockMovement', movement.id, `${product.name}: ${movement.quantity > 0 ? '+' : ''}${movement.quantity}`)
    if (newStock < 0) {
      alerts.unshift({
        id: nextId('a'),
        type: 'NEGATIVE_STOCK',
        productId: product.id,
        productName: product.name,
        message: `Negative stock detected: ${product.name} is at ${newStock}`,
        severity: 'CRITICAL',
        createdAt: now(),
        resolved: false,
      })
    }
    return movement
  },

  /** POST /api/sales — body: RegisterSaleRequest */
  async registerSale(user: User, req: RegisterSaleRequest): Promise<Sale> {
    await delay()
    const product = products.find((p) => p.id === req.productId)
    if (!product) throw new Error('Product not found')
    if (product.stock < req.quantity) throw new Error(`Not enough stock for ${product.name} (available: ${product.stock})`)

    product.stock -= req.quantity
    const sale: Sale = {
      id: nextId('s'),
      items: [{ productId: product.id, productName: product.name, quantity: req.quantity, unitPrice: product.price }],
      total: +(product.price * req.quantity).toFixed(2),
      customerName: req.customerName,
      userId: user.id,
      username: user.username,
      createdAt: now(),
    }
    sales.unshift(sale)
    movements.unshift({
      id: nextId('m'),
      productId: product.id,
      productName: product.name,
      type: 'SALE',
      quantity: -req.quantity,
      reason: `Sale ${sale.id}`,
      userId: user.id,
      username: user.username,
      createdAt: sale.createdAt,
    })
    audit(user, 'SALE_REGISTERED', 'Sale', sale.id, `Total ${sale.total}`)
    return sale
  },

  /** GET /api/sales?from=&to=&page=&pageSize= */
  async listSales(params?: { from?: string; to?: string; page?: number; pageSize?: number }): Promise<Paginated<Sale>> {
    await delay(150)
    let items = [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (params?.from) items = items.filter((s) => s.createdAt >= params.from!)
    if (params?.to) items = items.filter((s) => s.createdAt <= params.to!)
    return paginate(items, params?.page, params?.pageSize)
  },

  /** GET /api/alerts?type=&resolved= */
  async listAlerts(params?: { type?: Alert['type']; resolved?: boolean }): Promise<Alert[]> {
    await delay(150)
    let items = [...alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (params?.type) items = items.filter((a) => a.type === params.type)
    if (params?.resolved !== undefined) items = items.filter((a) => a.resolved === params.resolved)
    return items
  },

  /** PATCH /api/alerts/{id}/resolve */
  async resolveAlert(id: string): Promise<void> {
    await delay(100)
    const alert = alerts.find((a) => a.id === id)
    if (alert) alert.resolved = true
  },

  /** GET /api/audit-logs?userId=&action=&page=&pageSize= — MANAGER only */
  async listAuditLogs(params?: {
    userId?: string
    action?: string
    page?: number
    pageSize?: number
  }): Promise<Paginated<AuditLog>> {
    await delay(200)
    let items = [...auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (params?.userId) items = items.filter((l) => l.userId === params.userId)
    if (params?.action) items = items.filter((l) => l.action === params.action)
    return paginate(items, params?.page, params?.pageSize)
  },

  /** GET /api/dashboard/summary — MANAGER only */
  async dashboardSummary(): Promise<DashboardSummary> {
    await delay(300)
    const today = new Date().toDateString()
    const salesToday = sales.filter((s) => new Date(s.createdAt).toDateString() === today)
    const unitsByProduct = new Map<string, { name: string; units: number }>()
    for (const s of sales) {
      for (const item of s.items) {
        const e = unitsByProduct.get(item.productId) ?? { name: item.productName, units: 0 }
        e.units += item.quantity
        unitsByProduct.set(item.productId, e)
      }
    }
    return {
      totalProducts: products.length,
      totalStockValue: +products.reduce((sum, p) => sum + p.stock * p.price, 0).toFixed(2),
      salesToday: salesToday.length,
      lowStockCount: products.filter((p) => p.stock <= p.lowStockThreshold).length,
      expiringCount: products.filter((p) => p.category === 'MEDICINE' && p.expiryDate && new Date(p.expiryDate) < new Date(Date.now() + 30 * 86_400_000)).length,
      openAlerts: alerts.filter((a) => !a.resolved).length,
      recentSales: sales.slice(0, 5),
      topProducts: [...unitsByProduct.entries()]
        .map(([productId, v]) => ({ productId, productName: v.name, unitsSold: v.units }))
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 5),
    }
  },
}
