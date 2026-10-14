import { Role } from '@prisma/client';

export type { Role };

export interface PermissionDefinition {
  key: string;
  label: string;
  module: string;
  description: string;
}

export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  { key: 'orders:read', label: 'View Orders', module: 'Order Processing', description: 'Can view customer orders and statuses' },
  { key: 'orders:write', label: 'Create & Edit Orders', module: 'Order Processing', description: 'Can create orders or edit customer details' },
  { key: 'orders:status', label: 'Update Order Status', module: 'Order Processing', description: 'Can update order pipeline stages (Packed, Shipped, Delivered)' },
  { key: 'products:read', label: 'View Products', module: 'Product Catalog', description: 'Can view products, SKUs, and pricing' },
  { key: 'products:write', label: 'Create & Edit Products', module: 'Product Catalog', description: 'Can add new products, update specifications and photos' },
  { key: 'products:delete', label: 'Archive Products', module: 'Product Catalog', description: 'Can soft-delete or deactivate catalog products' },
  { key: 'categories:read', label: 'View Categories', module: 'Categories', description: 'Can view catalog categories' },
  { key: 'categories:write', label: 'Manage Categories', module: 'Categories', description: 'Can create or edit store categories' },
  { key: 'categories:delete', label: 'Delete Categories', module: 'Categories', description: 'Can delete store categories' },
  { key: 'inventory:read', label: 'View Inventory', module: 'Inventory Ledger', description: 'Can check stock balances and movement audit trail' },
  { key: 'inventory:write', label: 'Adjust Inventory', module: 'Inventory Ledger', description: 'Can record purchase receipts or manual stock adjustments' },
  { key: 'banners:read', label: 'View Banners', module: 'Banners & Deals', description: 'Can view promotional banners and campaigns' },
  { key: 'banners:write', label: 'Manage Banners', module: 'Banners & Deals', description: 'Can create, edit, publish, or delete marketing banners' },
  { key: 'coupons:read', label: 'View Coupons', module: 'Coupons & Promos', description: 'Can view discount coupons and promotional campaigns' },
  { key: 'coupons:write', label: 'Manage Coupons', module: 'Coupons & Promos', description: 'Can create, edit, toggle, or delete discount coupons' },
  { key: 'expenses:read', label: 'View Expenses', module: 'Expense Tracker', description: 'Can view business operating expense records' },
  { key: 'expenses:write', label: 'Record Expenses', module: 'Expense Tracker', description: 'Can log business operating expenses' },
  { key: 'reports:read', label: 'Financial Analytics', module: 'Financial Reports', description: 'Can view P&L, gross profit, sales, and inventory valuation' },
  { key: 'employees:read', label: 'View Staff & Roles', module: 'Staff & Security', description: 'Can view employee list and assigned roles' },
  { key: 'employees:write', label: 'Manage Staff & Roles', module: 'Staff & Security', description: 'Can add employees, update roles, and reset passwords' },
  { key: 'integrations:read', label: 'View Integrations', module: 'Integrations & Sync', description: 'Can view Telegram & Google Sheets sync statuses' },
  { key: 'integrations:write', label: 'Trigger Sync', module: 'Integrations & Sync', description: 'Can force manual sync to Google Sheets & test Telegram' },
];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'products:read', 'products:write', 'products:delete',
    'categories:read', 'categories:write', 'categories:delete',
    'orders:read', 'orders:write', 'orders:status',
    'inventory:read', 'inventory:write',
    'expenses:read', 'expenses:write',
    'reports:read',
    'employees:read', 'employees:write',
    'integrations:read', 'integrations:write',
    'banners:read', 'banners:write',
    'coupons:read', 'coupons:write',
  ],
  MANAGER: [
    'products:read', 'products:write',
    'categories:read', 'categories:write',
    'orders:read', 'orders:write', 'orders:status',
    'inventory:read', 'inventory:write',
    'expenses:read', 'expenses:write',
    'reports:read',
    'banners:read', 'banners:write',
    'coupons:read', 'coupons:write',
  ],
  ORDER_MANAGER: [
    'orders:read', 'orders:write', 'orders:status',
    'products:read',
    'inventory:read',
    'coupons:read',
  ],
  INVENTORY_MANAGER: [
    'products:read', 'products:write',
    'categories:read',
    'inventory:read', 'inventory:write',
  ],
  ACCOUNTANT: [
    'expenses:read', 'expenses:write',
    'orders:read',
    'reports:read',
  ],
  STAFF: [
    'orders:read',
    'products:read',
  ],
};

export function hasPermission(role: Role, requiredPermission: string, customPermissions?: string[]): boolean {
  if (role === 'SUPER_ADMIN') return true;
  if (customPermissions && Array.isArray(customPermissions)) {
    if (customPermissions.includes(requiredPermission) || customPermissions.includes('*')) {
      return true;
    }
  }
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(requiredPermission) || permissions.includes('*');
}
