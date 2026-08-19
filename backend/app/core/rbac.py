ROLE_PERMISSIONS = {
    "SUPER_ADMIN": ["*"],
    
    "GM": [
        "user:read", "restaurant:read", "menu:read", "table:read",
        "order:read", "kot:read", "bill:read", "payment:read",
        "purchase_order:read", "goods_receipt:read", "stock:read",
        "reimbursement:read", "reimbursement:approve", "reimbursement:pay",
        "delivery:read", "report:view", "report:export", "audit:read"
    ],
    
    "INVENTORY_MANAGER": [
        "purchase_order:create", "purchase_order:read", "purchase_order:update", "purchase_order:cancel",
        "goods_receipt:create", "goods_receipt:read", "goods_receipt:confirm",
        "stock:read", "stock:write", "stock:transfer", "stock:adjust",
        "reimbursement:create", "reimbursement:read"
    ],
    
    "CASHIER": [
        "order:create", "order:read", "order:update", "order:cancel",
        "kot:create", "kot:read", "bill:create", "bill:read", "bill:update", "bill:print",
        "payment:create", "payment:read", "delivery:assign", "delivery:read"
    ],
    
    "WAITER": [
        "order:create", "order:read", "order:update", "order:cancel",
        "kot:create", "kot:read", "bill:create", "bill:read", "bill:print",
        "table:read", "table:update_status"
    ],
    
    "KOT": [
        "kot:read", "kot:update"
    ],
    
    "DELIVERY_BOY": [
        "delivery:read", "delivery:update"
    ]
}

def get_permissions_for_roles(roles: list[str]) -> list[str]:
    """
    Resolve all unique permissions for a list of assigned roles.
    """
    perms = set()
    for role in roles:
        if role in ROLE_PERMISSIONS:
            for perm in ROLE_PERMISSIONS[role]:
                perms.add(perm)
    return list(perms)

def has_permission(user_permissions: list[str], required_permission: str) -> bool:
    """
    Check if a set of resolved permissions satisfies the required action check.
    Supports wildcards ('*') for SUPER_ADMIN roles.
    """
    if "*" in user_permissions:
        return True
    return required_permission in user_permissions
