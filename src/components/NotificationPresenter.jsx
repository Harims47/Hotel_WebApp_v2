import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { markNotificationRead } from '../features/notifications/notificationsSlice';
import { updateOrderItem } from '../features/orders/ordersSlice';
import { useNavigate } from 'react-router-dom';

import { BEEP_SOUND } from './bellSound';

export function NotificationPresenter() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector(state => state.notifications.data);
  const { currentUser } = useSelector(state => state.auth);

  const audioRef = useRef(null);
  const isInitialized = useRef(false);
  const presentedIds = useRef(new Set());
  
  const [queue, setQueue] = useState([]);
  const [isShowing, setIsShowing] = useState(false);

  // 1. Setup Audio
  useEffect(() => {
    const audio = new Audio(BEEP_SOUND);
    audio.volume = 0.5;
    audio.loop = true;
    audioRef.current = audio;
  }, []);

  // 2. Baseline Initialization & New Notification Detection
  useEffect(() => {
    if (!currentUser) {
      isInitialized.current = false;
      presentedIds.current = new Set();
      setQueue([]);
      return;
    }

    const myNotifications = notifications.filter(
      n => n.userId === currentUser.id || n.role === currentUser.role
    );

    // Initial Baseline
    if (!isInitialized.current) {
      const mountTime = Date.now();
      myNotifications.forEach(n => {
        const createdTime = new Date(n.createdAt).getTime();
        // Only suppress if the notification is older than 15 seconds.
        // This allows a fresh notification (e.g. from a recent cross-tab action or login) to be presented.
        if (mountTime - createdTime > 15000) {
          presentedIds.current.add(n.id);
        }
      });
      isInitialized.current = true;
    }

    // Detect NEW notifications
    const newNotifications = myNotifications.filter(
      n => !n.isRead && !presentedIds.current.has(n.id)
    );

    if (newNotifications.length > 0) {
      const addedToQueue = [];
      newNotifications.forEach(n => {
        presentedIds.current.add(n.id);
        
        // Only show the intrusive SweetAlert/Alarm popup for WAITER and KITCHEN flows
        if (['WAITER', 'KITCHEN'].includes(currentUser.role)) {
          addedToQueue.push(n);
        }
      });
      if (addedToQueue.length > 0) {
        setQueue(prev => [...prev, ...addedToQueue]);
      }
    }
  }, [notifications, currentUser]);

  // 3. Process Queue
  useEffect(() => {
    if (queue.length === 0 || isShowing) return;

    const n = queue[0];
    setIsShowing(true);

    // Play Sound (skip for certain inventory alerts)
    const silentTypes = ['LOW_STOCK', 'GRN_CONFIRMED'];
    if (audioRef.current && !silentTypes.includes(n.type)) {
      audioRef.current.play().catch(err => console.log('Audio restricted', err));
    }

    // Animate Bell
    const bellIcon = document.getElementById('header-notification-bell');
    if (bellIcon) {
      bellIcon.classList.remove('animate-shake');
      // trigger reflow
      void bellIcon.offsetWidth;
      bellIcon.classList.add('animate-shake');
    }

    // Determine icon color based on priority
    let icon = 'info';
    let iconColor = '#0EA5E9'; // primary
    if (n.priority === 'SUCCESS') { icon = 'success'; iconColor = '#22c55e'; }
    if (n.priority === 'WARNING') { icon = 'warning'; iconColor = '#f59e0b'; }
    if (n.priority === 'CRITICAL') { icon = 'error'; iconColor = '#ef4444'; }

    // Prepare SweetAlert configuration
    const hasAction = !!n.actionUrl;
    const isSnooze = n.actionRequired === 'SNOOZE';
    
    let confirmButtonText = hasAction ? 'VIEW DETAILS' : 'OK';
    let cancelButtonText = isSnooze ? 'SNOOZE 3 MIN' : 'CLOSE';
    let showCancelButton = hasAction || isSnooze;

    Swal.fire({
      title: n.title,
      text: n.message,
      icon: icon,
      iconColor: iconColor,
      iconHtml: icon === 'info' ? '<div class="animate-shake" style="font-size: 3rem;">🔔</div>' : undefined,
      toast: false,
      position: 'center',
      showConfirmButton: true,
      showCancelButton: showCancelButton,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      confirmButtonColor: iconColor,
      cancelButtonColor: isSnooze ? '#f59e0b' : '#94a3b8',
      timer: (!hasAction && !isSnooze) ? 4000 : undefined,
      timerProgressBar: (!hasAction && !isSnooze),
      customClass: {
        popup: 'rounded-2xl shadow-modal border border-border',
        title: 'text-lg font-black text-slate-800 uppercase tracking-tight',
        htmlContainer: 'text-sm text-slate-600 font-medium',
        confirmButton: 'rounded-xl font-bold uppercase tracking-wider text-xs px-5 py-2.5',
        cancelButton: 'rounded-xl font-bold uppercase tracking-wider text-xs px-5 py-2.5 text-white',
        icon: icon === 'info' ? 'border-none' : ''
      }
    }).then((result) => {
      // STOP SOUND on interaction
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (result.isConfirmed) {
        // VIEW DETAILS
        dispatch(markNotificationRead(n.id));
        if (hasAction) {
          navigate(n.actionUrl);
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // SNOOZE OR CLOSE
        if (isSnooze) {
          dispatch(updateOrderItem({
            orderId: n.referenceId,
            orderItemId: n.orderItemId,
            updates: { snoozedUntil: new Date(Date.now() + 3 * 60 * 1000).toISOString() }
          }));
          dispatch(markNotificationRead(n.id));
        } else {
          // Just closed
        }
      } else if (result.dismiss === Swal.DismissReason.timer) {
        // Auto closed
      }

      // Process next in queue
      setQueue(prev => prev.slice(1));
      setIsShowing(false);
    });

  }, [queue, isShowing, dispatch, navigate]);

  return null;
}
