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

export function AppShell() {
  const dispatch = useDispatch();
  const { isAuthenticated, currentUser } = useSelector(state => state.auth);
  const items = useSelector(state => state.invItems?.data) || [];
  const stock = useSelector(state => state.invStock?.data) || [];
  
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Track which items were LOW in the previous render cycle.
  // An item transitions from NORMAL→LOW only when it was NOT low before.
  // This prevents spam on re-renders, refreshes, or navigation.
  const prevLowItemIds = useRef(new Set());

  // Watch for Low Stock and notify INVENTORY_MANAGER / SUPER_ADMIN
  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'INVENTORY_MANAGER') return;
    
    const activeItems = items.filter(i => i.status === 'ACTIVE');
    const currentLowItemIds = new Set();

    activeItems.forEach(item => {
      const itemStockRecords = stock.filter(s => s.itemId === item.id);
      const totalStock = itemStockRecords.reduce((sum, record) => sum + record.quantity, 0);
      const isLow = totalStock <= (item.reorderLevel || 0);

      if (isLow) {
        currentLowItemIds.add(item.id);
        // Only fire if this item was NOT low in the previous render (LOW→NORMAL→LOW transition)
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

    // Update the ref for next render
    prevLowItemIds.current = currentLowItemIds;
  }, [items, stock, isAuthenticated, currentUser, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Basic check to ensure the user doesn't access other roles' paths
  // SUPER_ADMIN can access anything.
  const path = location.pathname;
  if (currentUser.role !== 'SUPER_ADMIN') {
    let allowedPrefixes = [];
    if (currentUser.role === 'DELIVERY_BOY') allowedPrefixes = ['/delivery'];
    else if (currentUser.role === 'INVENTORY_MANAGER') allowedPrefixes = ['/inventory'];
    else if (currentUser.role === 'GM') allowedPrefixes = ['/management', '/gm', '/inventory'];
    else allowedPrefixes = [`/${currentUser.role.toLowerCase()}`];

    const isAllowed = allowedPrefixes.some(prefix => path.startsWith(prefix));
    if (!isAllowed && path !== '/') {
      return <Navigate to={`${allowedPrefixes[0]}/dashboard`} replace />;
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
