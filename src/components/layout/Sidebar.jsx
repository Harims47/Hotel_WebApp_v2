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
  PieChart,
  Banknote,
  BarChart2,
  TrendingUp,
  X,
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { cn } from '../../utils/cn';

const ROLE_NAV = {
  SUPER_ADMIN: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { section: 'Management' },
    { name: 'Mgmt Dashboard', path: '/management/dashboard', icon: TrendingUp },
    { name: 'Mgmt Reports', path: '/management/reports', icon: BarChart2 },
    { section: 'Operations' },
    { name: 'Tables', path: '/admin/tables', icon: UtensilsCrossed },
    { name: 'Menu', path: '/admin/menu', icon: ListOrdered },
    { section: 'People' },
    { name: 'Users', path: '/admin/users', icon: Users },
    { section: 'Settings' },
    { name: 'Restaurant', path: '/admin/restaurant', icon: Settings },
    { name: 'Tax', path: '/admin/settings/tax', icon: Receipt },
    { name: 'Payments', path: '/admin/settings/payment-methods', icon: Receipt },
    { section: 'Inventory' },
    { name: 'Inv Dashboard', path: '/inventory/dashboard', icon: LayoutDashboard },
    { section: 'Inv Operations' },
    { name: 'Low Stock', path: '/inventory/low-stock', icon: AlertCircle },
    { name: 'Purchase Orders', path: '/inventory/purchase-orders', icon: ShoppingCart },
    { name: 'GRN', path: '/inventory/grn', icon: Truck },
    { name: 'Issues', path: '/inventory/issues', icon: Package },
    { name: 'Waste', path: '/inventory/waste', icon: Tags },
    { name: 'Transfers', path: '/inventory/transfers', icon: ArrowRightLeft },
    { name: 'Adjustments', path: '/inventory/adjustments', icon: SlidersHorizontal },
    { name: 'Stock Counts', path: '/inventory/stock-counts', icon: ClipboardList },
    { name: 'Reimbursements', path: '/inventory/reimbursements', icon: Banknote },
    { name: 'Current Stock', path: '/inventory/stock', icon: Box },
    { name: 'Stock Ledger', path: '/inventory/stock-ledger', icon: FileText },
    { name: 'Valuation', path: '/inventory/valuation', icon: Calculator },
    { name: 'Alerts', path: '/inventory/alerts', icon: Bell },
    { name: 'Inv Reports', path: '/inventory/reports', icon: PieChart },
    { section: 'Inv Master Data' },
    { name: 'Items Master', path: '/inventory/items', icon: Package },
    { name: 'Categories', path: '/inventory/categories', icon: Tags },
    { name: 'Suppliers', path: '/inventory/suppliers', icon: Building2 },
    { name: 'Locations', path: '/inventory/locations', icon: MapPin },
    { name: 'UOM', path: '/inventory/uom', icon: Scale },
  ],
  GM: [
    { name: 'Dashboard', path: '/management/dashboard', icon: TrendingUp },
    { section: 'Management' },
    { name: 'Mgmt Reports', path: '/management/reports', icon: BarChart2 },
    { section: 'Restaurant Ops' },
    { name: 'Orders', path: '/gm/orders', icon: Receipt },
    { name: 'KOT', path: '/gm/kot', icon: ChefHat },
    { name: 'Tables', path: '/gm/tables', icon: UtensilsCrossed },
    { name: 'Bills', path: '/gm/bills', icon: Receipt },
    { name: 'Delivery', path: '/gm/delivery', icon: Truck },
    { section: 'Inventory' },
    { name: 'Inv Dashboard', path: '/inventory/dashboard', icon: LayoutDashboard },
    { name: 'Low Stock', path: '/inventory/low-stock', icon: AlertCircle },
    { name: 'Purchase Orders', path: '/inventory/purchase-orders', icon: ShoppingCart },
    { name: 'GRN', path: '/inventory/grn', icon: Truck },
    { name: 'Issues', path: '/inventory/issues', icon: Package },
    { name: 'Waste', path: '/inventory/waste', icon: Tags },
    { name: 'Transfers', path: '/inventory/transfers', icon: ArrowRightLeft },
    { name: 'Adjustments', path: '/inventory/adjustments', icon: SlidersHorizontal },
    { name: 'Stock Counts', path: '/inventory/stock-counts', icon: ClipboardList },
    { name: 'Reimbursements', path: '/inventory/reimbursements', icon: Banknote },
    { name: 'Current Stock', path: '/inventory/stock', icon: Box },
    { name: 'Stock Ledger', path: '/inventory/stock-ledger', icon: FileText },
    { name: 'Valuation', path: '/inventory/valuation', icon: Calculator },
    { name: 'Alerts', path: '/inventory/alerts', icon: Bell },
    { name: 'Inv Reports', path: '/inventory/reports', icon: PieChart },
    { section: 'Inv Master Data' },
    { name: 'Items', path: '/inventory/items', icon: Package },
    { name: 'Categories', path: '/inventory/categories', icon: Tags },
    { name: 'Suppliers', path: '/inventory/suppliers', icon: Building2 },
    { name: 'Locations', path: '/inventory/locations', icon: MapPin },
    { name: 'UOM', path: '/inventory/uom', icon: Scale },
  ],
  INVENTORY_MANAGER: [
    { name: 'Dashboard', path: '/inventory/dashboard', icon: LayoutDashboard },
    { section: 'Operations' },
    { name: 'Low Stock', path: '/inventory/low-stock', icon: AlertCircle },
    { name: 'Purchase Orders', path: '/inventory/purchase-orders', icon: ShoppingCart },
    { name: 'GRN', path: '/inventory/grn', icon: Truck },
    { name: 'Issues', path: '/inventory/issues', icon: Package },
    { name: 'Waste', path: '/inventory/waste', icon: Tags },
    { name: 'Transfers', path: '/inventory/transfers', icon: ArrowRightLeft },
    { name: 'Adjustments', path: '/inventory/adjustments', icon: SlidersHorizontal },
    { name: 'Stock Counts', path: '/inventory/stock-counts', icon: ClipboardList },
    { name: 'Reimbursements', path: '/inventory/reimbursements', icon: Banknote },
    { name: 'Current Stock', path: '/inventory/stock', icon: Box },
    { name: 'Stock Ledger', path: '/inventory/stock-ledger', icon: FileText },
    { name: 'Valuation', path: '/inventory/valuation', icon: Calculator },
    { name: 'Alerts', path: '/inventory/alerts', icon: Bell },
    { name: 'Reports', path: '/inventory/reports', icon: PieChart },
    { section: 'Master Data' },
    { name: 'Items', path: '/inventory/items', icon: Package },
    { name: 'Categories', path: '/inventory/categories', icon: Tags },
    { name: 'Suppliers', path: '/inventory/suppliers', icon: Building2 },
    { name: 'Locations', path: '/inventory/locations', icon: MapPin },
    { name: 'UOM', path: '/inventory/uom', icon: Scale },
  ],
  WAITER: [
    { name: 'Tables', path: '/waiter/tables', icon: UtensilsCrossed },
    { name: 'Orders', path: '/waiter/orders', icon: Receipt },
    { name: 'Menu', path: '/waiter/menu', icon: ListOrdered },
  ],
  KOT: [
    { name: 'New Orders', path: '/kot/orders', icon: Receipt },
    { name: 'Preparing', path: '/kot/preparing', icon: ChefHat },
    { name: 'Ready', path: '/kot/ready', icon: ChefHat },
    { name: 'Completed', path: '/kot/completed', icon: Receipt },
  ],
  CASHIER: [
    { name: 'Bills', path: '/cashier/bills', icon: Receipt },
    { name: 'Takeaway', path: '/cashier/takeaway', icon: ShoppingBag },
    { name: 'Delivery', path: '/cashier/delivery', icon: Truck },
    { name: 'Payments', path: '/cashier/payments', icon: Receipt },
  ],
  DELIVERY_BOY: [
    { name: 'Orders', path: '/delivery/orders', icon: Truck },
  ],
};

function RoleChip({ role }) {
  const labels = {
    WAITER: { label: 'Waiter', color: 'text-blue-400' },
    CASHIER: { label: 'Cashier', color: 'text-green-400' },
    KOT: { label: 'Kitchen', color: 'text-yellow-400' },
    GM: { label: 'General Manager', color: 'text-purple-400' },
    SUPER_ADMIN: { label: 'Super Admin', color: 'text-red-400' },
    DELIVERY_BOY: { label: 'Delivery', color: 'text-orange-400' },
    INVENTORY_MANAGER: { label: 'Inventory', color: 'text-cyan-400' },
  };
  const cfg = labels[role] || { label: role, color: 'text-gray-400' };
  return <span className={cn('text-[10px] font-bold uppercase tracking-widest', cfg.color)}>{cfg.label}</span>;
}

export function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useSelector(state => state.auth);
  const restaurant = useSelector(state => state.restaurant.data);
  const dispatch = useDispatch();
  const navItems = currentUser ? ROLE_NAV[currentUser.role] || [] : [];

  const handleLogout = () => dispatch(logout());

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed xl:static inset-y-0 left-0 flex flex-col w-[240px] h-full z-50 shrink-0',
          'bg-sidebar-dark border-r border-white/5 shadow-sidebar',
          'transition-transform duration-300 ease-smooth',
          isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 h-[72px] px-5 border-b border-white/5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-primary-sm">
            <span className="text-white font-black text-sm">NS</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm leading-tight truncate">
              {restaurant?.name || 'NS Resto Cafe'}
            </p>
            <p className="text-[9px] font-semibold text-primary tracking-widest uppercase mt-0.5">
              Restaurant OS
            </p>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="xl:hidden p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-0.5">
          {navItems.map((item, index) => {
            if (item.section) {
              return (
                <div key={`section-${index}`} className="px-3 pt-5 pb-1.5 first:pt-1">
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.12em]">
                    {item.section}
                  </p>
                </div>
              );
            }

            return (
              <NavLink
                key={item.path || item.name}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1280) onClose(); }}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-primary text-white shadow-primary-sm'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-white/5 p-4 shrink-0 flex flex-col gap-3">
          <div className="bg-sidebar-item rounded-xl p-4 flex flex-col gap-2 border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-tight">{currentUser?.name || 'User'}</p>
                <p className="text-primary text-[10px] font-bold uppercase tracking-wider">{currentUser?.role?.replace('_', ' ') || 'User'}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all duration-150"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
