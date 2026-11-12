import type {
  Alert,
  AuditLog,
  Product,
  Sale,
  StockMovement,
  User,
} from '../types'

export const mockUsers: User[] = [
  { id: 'u1', username: 'a', fullName: 'Anna Employee', role: 'EMPLOYEE' },
  { id: 'u2', username: 'aa', fullName: 'Max Manager', role: 'MANAGER' },
  { id: 'u3', username: 'aaa', fullName: 'Dana DevOps', role: 'DEVOPS' },
]

const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString()

export const mockProducts: Product[] = [
  { id: 'p1', name: 'Dog Food Premium 10kg', description: 'Complete dry food for adult dogs', category: 'FOOD', price: 24.99, stock: 5, lowStockThreshold: 10, createdAt: daysAgo(120) },
  { id: 'p2', name: 'Cat Food Salmon 1.5kg', description: 'Wet food with salmon for cats', category: 'FOOD', price: 3.49, stock: 42, lowStockThreshold: 15, createdAt: daysAgo(120) },
  { id: 'p3', name: 'Amoxicillin 250mg', description: 'Antibiotic for dogs and cats', category: 'MEDICINE', price: 12.9, expiryDate: new Date(now + 20 * 86_400_000).toISOString().slice(0, 10), stock: 8, lowStockThreshold: 5, createdAt: daysAgo(90) },
  { id: 'p4', name: 'Flea Collar', description: '8-month protection collar', category: 'MEDICINE', price: 8.5, expiryDate: new Date(now + 200 * 86_400_000).toISOString().slice(0, 10), stock: 25, lowStockThreshold: 10, createdAt: daysAgo(90) },
  { id: 'p5', name: 'Chew Toy Bone', description: 'Durable rubber chew toy', category: 'TOY', price: 5.99, stock: 3, lowStockThreshold: 8, createdAt: daysAgo(60) },
  { id: 'p6', name: 'Cat Tree Tower', description: '3-level scratching tower', category: 'TOY', price: 59.99, stock: 6, lowStockThreshold: 3, createdAt: daysAgo(60) },
  { id: 'p7', name: 'Dog Leash Reflective', description: '1.5m reflective leash', category: 'ACCESSORY', price: 14.99, stock: 18, lowStockThreshold: 6, createdAt: daysAgo(45) },
  { id: 'p8', name: 'Puppy Shampoo', description: 'Gentle shampoo for puppies', category: 'CARE', price: 7.25, expiryDate: new Date(now + 10 * 86_400_000).toISOString().slice(0, 10), stock: 12, lowStockThreshold: 5, createdAt: daysAgo(45) },
]

export const mockSales: Sale[] = [
  {
    id: 's1',
    items: [{ productId: 'p1', productName: 'Dog Food Premium 10kg', quantity: 5, unitPrice: 24.99 }],
    total: 124.95,
    customerName: 'Walk-in',
    userId: 'u1',
    username: 'a',
    createdAt: daysAgo(0),
  },
  {
    id: 's2',
    items: [{ productId: 'p2', productName: 'Cat Food Salmon 1.5kg', quantity: 3, unitPrice: 3.49 }],
    total: 10.47,
    customerName: 'Maria',
    userId: 'u1',
    username: 'a',
    createdAt: daysAgo(1),
  },
]

export const mockMovements: StockMovement[] = [
  { id: 'm1', productId: 'p1', productName: 'Dog Food Premium 10kg', type: 'IN', quantity: 20, reason: 'Supplier delivery', userId: 'u1', username: 'a', createdAt: daysAgo(7) },
  { id: 'm2', productId: 'p1', productName: 'Dog Food Premium 10kg', type: 'SALE', quantity: -5, reason: 'Sale s1', userId: 'u1', username: 'a', createdAt: daysAgo(0) },
  { id: 'm3', productId: 'p5', productName: 'Chew Toy Bone', type: 'OUT', quantity: -2, reason: 'Damaged goods', userId: 'u1', username: 'a', createdAt: daysAgo(3) },
]

export const mockAlerts: Alert[] = [
  { id: 'a1', type: 'LOW_STOCK', productId: 'p1', productName: 'Dog Food Premium 10kg', message: 'Stock is 5, below threshold of 10', severity: 'HIGH', createdAt: daysAgo(0), resolved: false },
  { id: 'a2', type: 'LOW_STOCK', productId: 'p5', productName: 'Chew Toy Bone', message: 'Stock is 3, below threshold of 8', severity: 'MEDIUM', createdAt: daysAgo(1), resolved: false },
  { id: 'a3', type: 'EXPIRING_MEDICINE', productId: 'p8', productName: 'Puppy Shampoo', message: 'Expires in 10 days', severity: 'MEDIUM', createdAt: daysAgo(2), resolved: false },
  { id: 'a4', type: 'EXPIRING_MEDICINE', productId: 'p3', productName: 'Amoxicillin 250mg', message: 'Expires in 20 days', severity: 'LOW', createdAt: daysAgo(3), resolved: false },
]

export const mockAuditLogs: AuditLog[] = [
  { id: 'l1', userId: 'u1', username: 'a', action: 'SALE_REGISTERED', entityType: 'Sale', entityId: 's1', details: 'Sale total 124.95', createdAt: daysAgo(0) },
  { id: 'l2', userId: 'u1', username: 'a', action: 'STOCK_ADDED', entityType: 'StockMovement', entityId: 'm1', details: '+20 Dog Food Premium 10kg', createdAt: daysAgo(7) },
  { id: 'l3', userId: 'u2', username: 'aa', action: 'PRODUCT_CREATED', entityType: 'Product', entityId: 'p8', details: 'Puppy Shampoo', createdAt: daysAgo(45) },
]
