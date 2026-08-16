import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, User, X, Menu } from 'lucide-react';
import { resetDemoData } from '../../services/persistence/localStorage';
import { Button } from '../ui/Button';
import { markNotificationRead } from '../../features/notifications/notificationsSlice';
import { updateOrderItem } from '../../features/orders/ordersSlice';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const restaurant = useSelector(state => state.restaurant.data);
  const notifications = useSelector(state => state.notifications.data.filter(n => n.userId === currentUser?.id || n.role === currentUser?.role));
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [showDropdown, setShowDropdown] = useState(false);
  
  const toastedIds = useRef(new Set());

  // Show toast for new unread notifications
  useEffect(() => {
    notifications.forEach(n => {
      if (!n.isRead && !toastedIds.current.has(n.id)) {
        toastedIds.current.add(n.id);
        toast(n.title, {
          description: n.message,
          action: {
            label: 'View',
            onClick: () => {
              dispatch(markNotificationRead(n.id));
              if (n.referenceId) {
                navigate('/waiter/tables');
              }
            }
          }
        });
      }
    });
  }, [notifications, dispatch, navigate]);

  const handleNotificationClick = (n) => {
    dispatch(markNotificationRead(n.id));
    setShowDropdown(false);
    if (n.referenceId && currentUser?.role === 'WAITER') {
      navigate('/waiter/tables');
    }
  };

  const handleSnooze = (e, n) => {
    e.stopPropagation();
    dispatch(markNotificationRead(n.id));
    dispatch(updateOrderItem({
      orderId: n.referenceId,
      orderItemId: n.orderItemId,
      updates: { snoozedUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString() }
    }));
    toast.success("Reminder snoozed for 5 minutes");
  };

  return (
    <header className="h-16 bg-surface border-b border-border/60 flex items-center justify-between px-4 md:px-8 relative z-30 shadow-sm shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="xl:hidden p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-primary-light"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center space-x-6">
        <Button variant="outline" size="sm" onClick={resetDemoData} className="text-xs">
          Reset Demo Data
        </Button>

        <div className="relative">
          <button 
            className="relative p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-primary-light"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface" />
            )}
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-border overflow-hidden z-50">
              <div className="flex justify-between items-center p-4 border-b border-border bg-gray-50/50">
                <span className="font-semibold text-sm text-text-main">Notifications</span>
                <button onClick={() => setShowDropdown(false)} className="text-text-muted hover:text-text-main transition-colors p-1 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-text-muted">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-primary-light/30' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm text-text-main pr-4 leading-tight">{n.title}</span>
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1"></span>}
                      </div>
                      <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{n.message}</p>
                      {n.actionRequired === 'SNOOZE' && !n.isRead && (
                        <div className="mt-3">
                          <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={(e) => handleSnooze(e, n)}>
                            Snooze 5 min
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 border-l border-border pl-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-text-main">{currentUser?.name}</span>
            <span className="text-xs text-text-muted capitalize">{currentUser?.role.replace('_', ' ').toLowerCase()}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold ring-2 ring-primary/20">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
