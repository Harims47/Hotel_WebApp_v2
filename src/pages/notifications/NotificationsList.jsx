import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, CheckCircle } from 'lucide-react';
import { markNotificationRead, markAllRead } from '../../features/notifications/notificationsSlice';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';

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

export function NotificationsList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector(state => state.auth);
  const allNotifications = useSelector(state => state.notifications.data);

  const notifications = React.useMemo(() => {
    return allNotifications
      .filter(n => n.userId === currentUser?.id || n.role === currentUser?.role)
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allNotifications, currentUser?.id, currentUser?.role]);

  const [activeTab, setActiveTab] = useState('ALL');

  const displayedNotifications = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (n) => {
    dispatch(markNotificationRead(n.id));
    if (n.actionUrl) {
      navigate(n.actionUrl);
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllRead({ userId: currentUser?.id }));
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between px-4 py-6 md:px-0 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-black text-text-main leading-none uppercase tracking-tight">Notifications</h1>
          <p className="text-sm text-text-muted mt-1 font-medium">History of your system events</p>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 px-4 md:px-0">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-all", activeTab === 'ALL' ? "bg-text-main text-canvas shadow-sm" : "bg-surface text-text-muted hover:text-text-main border border-border")}
        >
          All
        </button>
        <button 
          onClick={() => setActiveTab('UNREAD')}
          className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2", activeTab === 'UNREAD' ? "bg-text-main text-canvas shadow-sm" : "bg-surface text-text-muted hover:text-text-main border border-border")}
        >
          Unread
          {unreadCount > 0 && (
            <span className={cn("inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[10px]", activeTab === 'UNREAD' ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto pb-safe">
        {displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-border" />
            </div>
            <h3 className="text-lg font-bold text-text-main">No notifications</h3>
            <p className="text-sm text-text-muted mt-1 max-w-sm">You are all caught up with your operational alerts.</p>
          </div>
        ) : (
          <div className="space-y-3 px-4 md:px-0">
            {displayedNotifications.map(n => {
              let dotColor = 'bg-primary';
              let badgeColor = 'bg-primary/10 text-primary border-primary/20';
              if (n.priority === 'SUCCESS') {
                dotColor = 'bg-green-500';
                badgeColor = 'bg-green-500/10 text-green-700 border-green-500/20';
              }
              if (n.priority === 'WARNING') {
                dotColor = 'bg-amber-500';
                badgeColor = 'bg-amber-500/10 text-amber-700 border-amber-500/20';
              }
              if (n.priority === 'CRITICAL') {
                dotColor = 'bg-red-500';
                badgeColor = 'bg-red-500/10 text-red-700 border-red-500/20';
              }

              return (
                <div 
                  key={n.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm",
                    !n.isRead ? "bg-primary-lighter/10 border-primary/20" : "bg-white border-border/60 hover:border-border"
                  )}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'mt-1.5 w-2.5 h-2.5 rounded-full shrink-0',
                      !n.isRead ? dotColor : 'bg-border'
                    )} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border", badgeColor)}>
                          {n.type?.replace(/_/g, ' ') || 'SYSTEM'}
                        </span>
                        <span className="text-xs text-text-muted font-medium">{timeAgo(n.createdAt)}</span>
                      </div>
                      <h4 className="text-sm font-bold text-text-main">{n.title}</h4>
                      <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  </div>

                  {n.actionUrl && (
                    <Button variant="ghost" size="sm" className="w-full sm:w-auto shrink-0 uppercase text-xs tracking-wider font-bold h-9">
                      View Details
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
