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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('petstore_token')
  if (!token) throw new Error('You must sign in to access products')

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (!response.ok) {
    const body = await response.text()
    let message = `Request failed (HTTP ${response.status})`
    if (body) {
      try {
        const result: unknown = JSON.parse(body)
        if (isRecord(result)) {
          for (const key of ['detail', 'message', 'title']) {
            if (key in result && typeof result[key] === 'string') {
              message = result[key]
              break
            }
          }
        }
      } catch {
        message = body
      }
    }
    throw new Error(message)
  }
  return response
}

function isProductCategory(value: unknown): value is ProductCategory {
  return value === 'FOOD' || value === 'MEDICINE' || value === 'TOY' || value === 'ACCESSORY' || value === 'CARE'
}

function parseProduct(value: unknown): Product {
  if (
    !value ||
    typeof value !== 'object' ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !('description' in value) ||
    typeof value.description !== 'string' ||
    !('category' in value) ||
    !isProductCategory(value.category) ||
    !('price' in value) ||
    typeof value.price !== 'number' ||
    !('stock' in value) ||
    typeof value.stock !== 'number' ||
    !('lowStockThreshold' in value) ||
    typeof value.lowStockThreshold !== 'number' ||
    !('createdAt' in value) ||
    typeof value.createdAt !== 'string' ||
    !('expiryDate' in value) ||
    (value.expiryDate !== null && typeof value.expiryDate !== 'string')
  ) {
    throw new Error('The server returned an invalid product')
  }
  return value as Product
}

function parseProductPage(value: unknown): Paginated<Product> {
  if (
    !value ||
    typeof value !== 'object' ||
    !('items' in value) ||
    !Array.isArray(value.items) ||
    !('total' in value) ||
    typeof value.total !== 'number' ||
    !('page' in value) ||
    typeof value.page !== 'number' ||
    !('pageSize' in value) ||
    typeof value.pageSize !== 'number'
  ) {
    throw new Error('The server returned an invalid product list')
  }
  return { items: value.items.map(parseProduct), total: value.total, page: value.page, pageSize: value.pageSize }
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
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.category) query.set('category', params.category)
    if (params?.page !== undefined) query.set('page', String(params.page))
    if (params?.pageSize !== undefined) query.set('pageSize', String(params.pageSize))
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    const response = await authenticatedFetch(`/api/products${suffix}`)
    return parseProductPage(await response.json())
  },

  /** Mock catalog retained until inventory and sales are connected to the backend. */
  async listMockProducts(params?: {
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
    const response = await authenticatedFetch(`/api/products/${encodeURIComponent(id)}`)
    return parseProduct(await response.json())
  },

  /** POST /api/products — body: CreateProductRequest (MANAGER/DEVOPS) */
  async createProduct(req: CreateProductRequest): Promise<Product> {
    const response = await authenticatedFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(req),
    })
    return parseProduct(await response.json())
  },

  /** PUT /api/products/{id} — body: UpdateProductRequest (MANAGER/DEVOPS) */
  async updateProduct(id: string, req: UpdateProductRequest): Promise<Product> {
    const response = await authenticatedFetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    })
    return parseProduct(await response.json())
  },

  /** DELETE /api/products/{id} (MANAGER/DEVOPS) */
  async deleteProduct(id: string): Promise<void> {
    await authenticatedFetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },

  /** GET /api/inventory/movements?productId=&page=&pageSize= */
  async listMovements(params?: {
    productId?: string
    page?: number
    pageSize?: number
  }): Promise<Paginated<StockMovement>> {
    const query = new URLSearchParams()
    if (params?.productId) query.set('productId', params.productId)
    if (params?.page !== undefined) query.set('page', String(params.page))
    if (params?.pageSize !== undefined) query.set('pageSize', String(params.pageSize))
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    const response = await authenticatedFetch(`/api/inventory/movements${suffix}`)
    return response.json() as Promise<Paginated<StockMovement>>
  },

  /**
   * POST /api/inventory/adjustments
   * body: { productId, type: 'IN'|'OUT'|'ADJUSTMENT', quantity, reason }
   * IN adds stock; OUT removes stock; ADJUSTMENT sets absolute stock.
   */
  async adjustStock(
    req: { productId: string; type: MovementType; quantity: number; reason?: string },
  ): Promise<StockMovement> {
    const response = await authenticatedFetch('/api/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify(req),
    })
    return response.json() as Promise<StockMovement>
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
