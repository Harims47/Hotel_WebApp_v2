import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ListOrdered, 
  ChefHat, 
  Receipt, 
  Truck, 
  Users, 
  Settings,
  LogOut,
  ShoppingBag,
  Package,
  Tags,
  MapPin,
  Scale,
  Building2,
  BookText,
  AlertCircle,
  ShoppingCart,
  Box,
  FileText,
  ArrowRightLeft,
  SlidersHorizontal,
  ClipboardList,
  Calculator,
  Bell,
  PieChart
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { cn } from '../../utils/cn';

const ROLE_NAV = {
  SUPER_ADMIN: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { section: 'OPERATIONS' },
    { name: 'Tables', path: '/admin/tables', icon: UtensilsCrossed },
    { name: 'Menu', path: '/admin/menu', icon: ListOrdered },
    { section: 'PEOPLE' },
    { name: 'Users', path: '/admin/users', icon: Users },
    { section: 'SETTINGS' },
    { name: 'Restaurant', path: '/admin/restaurant', icon: Settings },
    { name: 'Tax', path: '/admin/settings/tax', icon: Receipt },
    { name: 'Payments', path: '/admin/settings/payment-methods', icon: Receipt },
    { section: 'INVENTORY' },
    { name: 'Dashboard', path: '/inventory/dashboard', icon: LayoutDashboard },
    { section: 'INV OPERATIONS' },
    { name: 'Low Stock', path: '/inventory/low-stock', icon: AlertCircle },
    { name: 'Purchase Orders', path: '/inventory/purchase-orders', icon: ShoppingCart },
    { name: 'GRN', path: '/inventory/grn', icon: Truck },
    { name: 'Issues', path: '/inventory/issues', icon: Package },
    { name: 'Waste', path: '/inventory/waste', icon: Tags },
    { name: 'Transfers', path: '/inventory/transfers', icon: ArrowRightLeft },
    { name: 'Adjustments', path: '/inventory/adjustments', icon: SlidersHorizontal },
    { name: 'Stock Counts', path: '/inventory/stock-counts', icon: ClipboardList },
    { name: 'Current Stock', path: '/inventory/stock', icon: Box },
    { name: 'Stock Ledger', path: '/inventory/stock-ledger', icon: FileText },
    { name: 'Valuation', path: '/inventory/valuation', icon: Calculator },
    { name: 'Alerts', path: '/inventory/alerts', icon: Bell },
    { name: 'Reports', path: '/inventory/reports', icon: PieChart },
    { name: 'Inventory Masters', path: '/inventory/masters', icon: Settings },
    { section: 'INV MASTER DATA' },
    { name: 'Items Master', path: '/inventory/items', icon: Package },
    { name: 'Categories', path: '/inventory/categories', icon: Tags },
    { name: 'Suppliers', path: '/inventory/suppliers', icon: Building2 },
    { name: 'Locations', path: '/inventory/locations', icon: MapPin },
    { name: 'UOM', path: '/inventory/uom', icon: Scale },
  ],
  GM: [
    { name: 'Dashboard', path: '/gm/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/gm/orders', icon: Receipt },
    { name: 'KOT', path: '/gm/kot', icon: ChefHat },
    { name: 'Tables', path: '/gm/tables', icon: UtensilsCrossed },
    { name: 'Bills', path: '/gm/bills', icon: Receipt },
    { name: 'Delivery', path: '/gm/delivery', icon: Truck },
    { section: 'INVENTORY' },
    { name: 'Inv Dashboard', path: '/inventory/dashboard', icon: LayoutDashboard },
    { section: 'INV OPERATIONS' },
    { name: 'Low Stock', path: '/inventory/low-stock', icon: AlertCircle },
    { name: 'Purchase Orders', path: '/inventory/purchase-orders', icon: ShoppingCart },
    { name: 'GRN', path: '/inventory/grn', icon: Truck },
    { name: 'Issues', path: '/inventory/issues', icon: Package },
    { name: 'Waste', path: '/inventory/waste', icon: Tags },
    { name: 'Transfers', path: '/inventory/transfers', icon: ArrowRightLeft },
    { name: 'Adjustments', path: '/inventory/adjustments', icon: SlidersHorizontal },
    { name: 'Stock Counts', path: '/inventory/stock-counts', icon: ClipboardList },
    { name: 'Current Stock', path: '/inventory/stock', icon: Box },
    { name: 'Stock Ledger', path: '/inventory/stock-ledger', icon: FileText },
    { name: 'Valuation', path: '/inventory/valuation', icon: Calculator },
    { name: 'Alerts', path: '/inventory/alerts', icon: Bell },
    { name: 'Reports', path: '/inventory/reports', icon: PieChart },
    { section: 'INV MASTER DATA' },
    { name: 'Items', path: '/inventory/items', icon: Package },
    { name: 'Categories', path: '/inventory/categories', icon: Tags },
    { name: 'Suppliers', path: '/inventory/suppliers', icon: Building2 },
    { name: 'Locations', path: '/inventory/locations', icon: MapPin },
    { name: 'UOM', path: '/inventory/uom', icon: Scale },
  ],
  INVENTORY_MANAGER: [
    { name: 'Dashboard', path: '/inventory/dashboard', icon: LayoutDashboard },
    { section: 'OPERATIONS' },
    { name: 'Low Stock', path: '/inventory/low-stock', icon: AlertCircle },
    { name: 'Purchase Orders', path: '/inventory/purchase-orders', icon: ShoppingCart },
    { name: 'GRN', path: '/inventory/grn', icon: Truck },
    { name: 'Issues', path: '/inventory/issues', icon: Package },
    { name: 'Waste', path: '/inventory/waste', icon: Tags },
    { name: 'Transfers', path: '/inventory/transfers', icon: ArrowRightLeft },
    { name: 'Adjustments', path: '/inventory/adjustments', icon: SlidersHorizontal },
    { name: 'Stock Counts', path: '/inventory/stock-counts', icon: ClipboardList },
    { name: 'Current Stock', path: '/inventory/stock', icon: Box },
    { name: 'Stock Ledger', path: '/inventory/stock-ledger', icon: FileText },
    { name: 'Valuation', path: '/inventory/valuation', icon: Calculator },
    { name: 'Alerts', path: '/inventory/alerts', icon: Bell },
    { name: 'Reports', path: '/inventory/reports', icon: PieChart },
    { section: 'MASTER DATA' },
    { name: 'Items', path: '/inventory/items', icon: Package },
    { name: 'Categories', path: '/inventory/categories', icon: Tags },
    { name: 'Suppliers', path: '/inventory/suppliers', icon: Building2 },
    { name: 'Locations', path: '/inventory/locations', icon: MapPin },
    { name: 'UOM', path: '/inventory/uom', icon: Scale },
  ],
  WAITER: [
    { name: 'Dashboard', path: '/waiter/dashboard', icon: LayoutDashboard },
    { name: 'Tables', path: '/waiter/tables', icon: UtensilsCrossed },
    { name: 'Menu', path: '/waiter/menu', icon: ListOrdered },
    { name: 'Orders', path: '/waiter/orders', icon: Receipt },
  ],
  KOT: [
    { name: 'Dashboard', path: '/kot/dashboard', icon: LayoutDashboard },
    { name: 'New Orders', path: '/kot/orders', icon: Receipt },
    { name: 'Preparing', path: '/kot/preparing', icon: ChefHat },
    { name: 'Ready', path: '/kot/ready', icon: ChefHat },
    { name: 'Completed', path: '/kot/completed', icon: Receipt },
  ],
  CASHIER: [
    { name: 'Dashboard', path: '/cashier/dashboard', icon: LayoutDashboard },
    { name: 'Bills', path: '/cashier/bills', icon: Receipt },
    { name: 'Takeaway', path: '/cashier/takeaway', icon: ShoppingBag },
    { name: 'Delivery', path: '/cashier/delivery', icon: Truck },
    { name: 'Payments', path: '/cashier/payments', icon: Receipt },
  ],
  DELIVERY_BOY: [
    { name: 'Dashboard', path: '/delivery/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/delivery/orders', icon: Truck },
  ]
};

export function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useSelector(state => state.auth);
  const restaurant = useSelector(state => state.restaurant.data);
  const dispatch = useDispatch();
  const navItems = currentUser ? ROLE_NAV[currentUser.role] || [] : [];

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <>
      {/* Overlay for mobile/tablet when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div 
        className={cn(
          "fixed xl:static inset-y-0 left-0 flex flex-col w-[260px] bg-sidebar-dark h-full text-gray-300 border-r border-sidebar-dark shadow-2xl z-50 transition-transform duration-300 ease-in-out shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
        )}
      >
        <div className="flex flex-col items-start justify-center h-16 px-6 border-b border-gray-800/50 bg-black/20 shrink-0">
          <h1 className="text-xl font-bold text-white truncate w-full">
            {restaurant?.name || 'Sri Annapoorna'}
          </h1>
          <p className="text-[10px] font-semibold text-primary tracking-[0.2em] uppercase mt-1">
            Restaurant OS
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
          <nav className="space-y-1.5 px-4">
            {navItems.map((item, index) => {
              if (item.section) {
                return (
                  <div key={`section-${index}`} className="px-3 pt-6 pb-2">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {item.section}
                    </p>
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.path || item.name}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1280) onClose();
                  }}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-1' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  <item.icon className={cn("mr-3 flex-shrink-0", "h-5 w-5")} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800/50 bg-black/10 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
