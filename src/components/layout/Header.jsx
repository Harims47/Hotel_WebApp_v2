import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, User, X } from 'lucide-react';
import { resetDemoData } from '../../services/persistence/localStorage';
import { Button } from '../ui/Button';
import { markNotificationRead } from '../../features/notifications/notificationsSlice';
import { updateOrderItem } from '../../features/orders/ordersSlice';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function Header() {
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
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 relative z-50">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-text-main">
          {restaurant?.name || 'Restaurant'}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={resetDemoData}>
          Reset Demo Data
        </Button>

        <div className="relative">
          <button 
            className="relative p-2 text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-gray-100"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
            )}
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-border overflow-hidden">
              <div className="flex justify-between items-center p-3 border-b border-border bg-gray-50">
                <span className="font-semibold text-sm">Notifications</span>
                <button onClick={() => setShowDropdown(false)} className="text-text-muted hover:text-text-main"><X className="w-4 h-4" /></button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-text-muted">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-orange-50/50' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm text-text-main">{n.title}</span>
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary mt-1.5"></span>}
                      </div>
                      <p className="text-xs text-text-muted mt-1">{n.message}</p>
                      {n.actionRequired === 'SNOOZE' && !n.isRead && (
                        <div className="mt-2">
                          <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={(e) => handleSnooze(e, n)}>
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

        <div className="flex items-center space-x-3 border-l border-border pl-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-text-main">{currentUser?.name}</span>
            <span className="text-xs text-text-muted">{currentUser?.role}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
