import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { data: [] },
  reducers: {
    addNotification: (state, action) => {
      const newNotif = action.payload;
      
      // Deduplication check
      if (newNotif.eventKey) {
        const isDuplicate = state.data.some(n => 
          n.eventKey === newNotif.eventKey && !n.isRead
        );
        if (isDuplicate) return;
      }

      const fullNotif = {
        isRead: false,
        isActioned: false,
        priority: 'INFO',
        ...newNotif,
        createdAt: newNotif.createdAt || new Date().toISOString()
      };

      state.data.unshift(fullNotif);
    },
    markNotificationRead: (state, action) => {
      const notification = state.data.find(n => n.id === action.payload);
      if (notification) {
        notification.isRead = true;
      }
    },
    markAllRead: (state, action) => {
      const { userId } = action.payload;
      state.data.forEach(n => {
        if (n.userId === userId) {
          n.isRead = true;
        }
      });
    },
  },
});

export const { addNotification, markNotificationRead, markAllRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
