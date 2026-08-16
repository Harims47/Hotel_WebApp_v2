import { createSlice } from '@reduxjs/toolkit';

const ordersSlice = createSlice({
  name: 'orders',
  initialState: { data: [] },
  reducers: {
    createOrder: (state, action) => {
      state.data.push(action.payload);
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.data.find(o => o.id === orderId);
      if (order) {
        order.status = status;
      }
    },
    updateOrderItemStatus: (state, action) => {
      const { orderId, orderItemId, status } = action.payload;
      const order = state.data.find(o => o.id === orderId);
      if (order) {
        const item = order.items.find(i => i.id === orderItemId);
        if (item) {
          item.status = status;
        }
      }
    },
    updateOrderItem: (state, action) => {
      const { orderId, orderItemId, updates } = action.payload;
      const order = state.data.find(o => o.id === orderId);
      if (order) {
        const item = order.items.find(i => i.id === orderItemId);
        if (item) {
          Object.assign(item, updates);
        }
      }
    },
    addOrderItems: (state, action) => {
      const { orderId, items } = action.payload;
      const order = state.data.find(o => o.id === orderId);
      if (order) {
        order.items.push(...items);
      }
    }
  },
});

export const { createOrder, updateOrderStatus, updateOrderItemStatus, updateOrderItem, addOrderItems } = ordersSlice.actions;
export default ordersSlice.reducer;
