import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'sonner';
import { NotificationPresenter } from '../NotificationPresenter';
import { TimerEngine } from '../TimerEngine';
import { addNotification } from '../../features/notifications/notificationsSlice';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../utils/cn';

// Derive the allowed route prefixes from the backend role string
function getAllowedPrefixes(role) {
  if (!role) return [];
  switch (role) {
    case 'SUPER_ADMIN':      return null; // null = allow everything
    case 'GM':               return ['/management', '/gm', '/inventory'];
    case 'WAITER':           return ['/waiter'];
    case 'CASHIER':          return ['/cashier'];
    case 'KOT':              return ['/kot'];
    case 'DELIVERY_BOY':     return ['/delivery'];
    case 'INVENTORY_MANAGER':return ['/inventory'];
    default:                 return [];
  }
}

export function AppShell() {
  const dispatch = useDispatch();
  const { initialized, isAuthenticated, currentUser } = useSelector(state => state.auth);
  const items = useSelector(state => state.invItems?.data) || [];
  const stock = useSelector(state => state.invStock?.data) || [];
  
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const prevLowItemIds = useRef(new Set());

  // Watch for Low Stock — notify INVENTORY_MANAGER / SUPER_ADMIN
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const role = currentUser?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'INVENTORY_MANAGER') return;
    
    const activeItems = items.filter(i => i.status === 'ACTIVE');
    const currentLowItemIds = new Set();

    activeItems.forEach(item => {
      const itemStockRecords = stock.filter(s => s.itemId === item.id);
      const totalStock = itemStockRecords.reduce((sum, record) => sum + record.quantity, 0);
      const isLow = totalStock <= (item.reorderLevel || 0);

      if (isLow) {
        currentLowItemIds.add(item.id);
        const wasLow = prevLowItemIds.current.has(item.id);
        if (!wasLow) {
          dispatch(addNotification({
            id: `LOW_STOCK:${item.id}:${Date.now()}`,
            userId: null,
            role: 'INVENTORY_MANAGER',
            type: 'LOW_STOCK',
            title: 'Low Stock Alert',
            message: `${item.name} is at or below reorder level: ${totalStock} remaining (Reorder Level: ${item.reorderLevel}).`,
            referenceId: item.id,
            entityType: 'INVENTORY_ITEM',
            entityId: item.id,
            actionUrl: '/inventory/stock',
            priority: 'WARNING',
            eventKey: `LOW_STOCK:${item.id}:INVENTORY_MANAGER`,
          }));
        }
      }
    });

    prevLowItemIds.current = currentLowItemIds;
  }, [items, stock, isAuthenticated, currentUser, dispatch]);

  // ── Initialization guard: show nothing while /me is still loading ─────────
  // This prevents the brief redirect-to-login flash on page refresh.
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Role-based route protection ───────────────────────────────────────────
  const path = location.pathname;
  const allowedPrefixes = getAllowedPrefixes(currentUser?.role);

  if (allowedPrefixes !== null) {
    const isAllowed = allowedPrefixes.some(prefix => path.startsWith(prefix));
    if (!isAllowed && path !== '/') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-canvas">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-status-danger mb-2">Access Denied</h1>
            <p className="text-text-muted">You do not have permission to view this page.</p>
          </div>
        </div>
      );
    }
  }

  const isOrderEntry = path.startsWith('/waiter/tables/') && path !== '/waiter/tables';
  const isNewTakeaway = path === '/cashier/takeaway/new';
  const noScrollMain = isOrderEntry || isNewTakeaway;

  return (
    <div className="flex h-screen bg-canvas overflow-hidden relative">
      <Toaster position="top-right" richColors expand={false} gap={8} />
      <NotificationPresenter />
      <TimerEngine />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {!isOrderEntry && <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />}
        <main className={cn(
          "flex flex-col flex-1 custom-scrollbar",
          noScrollMain ? "overflow-hidden" : "overflow-y-auto",
          isOrderEntry ? "p-0" : "p-4 md:p-6"
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
