export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],

  GM: [
    'user:read', 'restaurant:read', 'menu:read', 'table:read',
    'order:read', 'kot:read', 'bill:read', 'payment:read',
    'purchase_order:read', 'goods_receipt:read', 'stock:read',
    'reimbursement:read', 'reimbursement:approve', 'reimbursement:pay',
    'delivery:read', 'report:view', 'report:export', 'audit:read'
  ],

  INVENTORY_MANAGER: [
    'purchase_order:create', 'purchase_order:read', 'purchase_order:update', 'purchase_order:cancel',
    'goods_receipt:create', 'goods_receipt:read', 'goods_receipt:confirm',
    'stock:read', 'stock:write', 'stock:transfer', 'stock:adjust',
    'reimbursement:create', 'reimbursement:read'
  ],

  CASHIER: [
    'order:create', 'order:read', 'order:update', 'order:cancel',
    'kot:create', 'kot:read', 'bill:create', 'bill:read', 'bill:update', 'bill:print',
    'payment:create', 'payment:read', 'delivery:assign', 'delivery:read'
  ],

  WAITER: [
    'order:create', 'order:read', 'order:update', 'order:cancel',
    'kot:create', 'kot:read', 'bill:create', 'bill:read', 'bill:print',
    'table:read', 'table:update_status'
  ],

  KOT: [
    'kot:read', 'kot:update'
  ],

  DELIVERY_BOY: [
    'delivery:read', 'delivery:update'
  ]
};

export function getPermissionsForRoles(roles: string[]): string[] {
  const perms = new Set<string>();
  for (const role of roles) {
    if (role in ROLE_PERMISSIONS) {
      for (const perm of ROLE_PERMISSIONS[role]) {
        perms.add(perm);
      }
    }
  }
  return Array.from(perms);
}

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (userPermissions.includes('*')) {
    return true;
  }
  return userPermissions.includes(requiredPermission);
}
