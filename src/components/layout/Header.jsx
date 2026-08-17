import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, X, Menu, ChevronRight } from 'lucide-react';
import { resetDemoData } from '../../services/persistence/localStorage';
import { Button } from '../ui/Button';
import { markNotificationRead } from '../../features/notifications/notificationsSlice';
import { updateOrderItem } from '../../features/orders/ordersSlice';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const restaurant = useSelector(state => state.restaurant.data);
  const allNotifications = useSelector(state => state.notifications.data);

  const notifications = React.useMemo(() => {
    return allNotifications
      .filter(n => n.userId === currentUser?.id || n.role === currentUser?.role)
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);
  }, [allNotifications, currentUser?.id, currentUser?.role]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const toastedIds = useRef(new Set());

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
              if (n.referenceId && currentUser?.role === 'WAITER') {
                navigate('/waiter/tables');
              }
            }
          }
        });
      }
    });
  }, [notifications, dispatch, navigate, currentUser?.role]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotificationClick = (n) => {
    dispatch(markNotificationRead(n.id));
    setShowDropdown(false);
    if (n.referenceId && currentUser?.role === 'WAITER') navigate('/waiter/tables');
  };

  const handleSnooze = (e, n) => {
    e.stopPropagation();
    dispatch(markNotificationRead(n.id));
    dispatch(updateOrderItem({
      orderId: n.referenceId,
      orderItemId: n.orderItemId,
      updates: { snoozedUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString() }
    }));
    toast.success('Reminder snoozed for 5 minutes');
  };

  const markAllRead = () => {
    notifications.filter(n => !n.isRead).forEach(n => dispatch(markNotificationRead(n.id)));
  };

  return (
    <header className="h-[60px] bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 relative z-30 shrink-0 shadow-header">
      {/* Left: hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="xl:hidden w-9 h-9 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light rounded-xl transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="ghost"
          size="xs"
          onClick={resetDemoData}
          className="hidden sm:inline-flex text-text-muted text-xs"
        >
          Reset Data
        </Button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="relative w-9 h-9 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-light rounded-xl transition-colors"
            onClick={() => setShowDropdown(v => !v)}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-surface">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-[340px] md:w-[380px] bg-surface rounded-2xl shadow-modal border border-border overflow-hidden z-50 animate-slide-down">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-canvas">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-text-main">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-primary text-white rounded-full text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-primary hover:text-primary-dark px-2 py-1 rounded-lg hover:bg-primary-light transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="p-1.5 text-text-muted hover:text-text-main hover:bg-border rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto custom-scrollbar divide-y divide-border/60">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-8 h-8 text-border mx-auto mb-3" />
                    <p className="text-sm font-medium text-text-muted">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={cn(
                        'px-4 py-3.5 cursor-pointer hover:bg-canvas transition-colors',
                        !n.isRead && 'bg-primary-lighter'
                      )}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'mt-0.5 w-2 h-2 rounded-full shrink-0',
                          !n.isRead ? 'bg-primary' : 'bg-transparent'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-text-main leading-tight">{n.title}</p>
                            <span className="text-[10px] text-text-muted shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                          </div>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">{n.message}</p>
                          {n.actionRequired === 'SNOOZE' && !n.isRead && (
                            <button
                              onClick={(e) => handleSnooze(e, n)}
                              className="mt-2 text-xs font-semibold text-primary hover:text-primary-dark"
                            >
                              Snooze 5 min
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User chip */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-border">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-text-main leading-tight">{currentUser?.name}</span>
            <span className="text-[10px] text-text-muted font-medium capitalize">
              {currentUser?.role?.replace(/_/g, ' ').toLowerCase()}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
