import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { data: [] },
  reducers: {
    addNotification: (state, action) => {
      // unshift to put newest first
      state.data.unshift(action.payload);
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
