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
  ShoppingBag
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { cn } from '../../utils/cn';

const ROLE_NAV = {
  SUPER_ADMIN: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Tables', path: '/admin/tables', icon: UtensilsCrossed },
    { name: 'Menu', path: '/admin/menu', icon: ListOrdered },
    { name: 'Orders', path: '/admin/orders', icon: Receipt },
    { name: 'KOT', path: '/admin/kot', icon: ChefHat },
  ],
  GM: [
    { name: 'Dashboard', path: '/gm/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/gm/orders', icon: Receipt },
    { name: 'KOT', path: '/gm/kot', icon: ChefHat },
    { name: 'Tables', path: '/gm/tables', icon: UtensilsCrossed },
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

export function Sidebar() {
  const { currentUser } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navItems = currentUser ? ROLE_NAV[currentUser.role] || [] : [];

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="flex flex-col w-64 bg-sidebar-dark h-full text-gray-300">
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white tracking-wider text-primary">Resto<span className="text-white">OS</span></h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
