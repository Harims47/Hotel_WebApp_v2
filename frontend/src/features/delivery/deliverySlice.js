import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: []
};

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    createDelivery: (state, action) => {
      state.data.push(action.payload);
    },
    updateDeliveryStatus: (state, action) => {
      const { deliveryId, status } = action.payload;
      const delivery = state.data.find(d => d.id === deliveryId);
      if (delivery) {
        delivery.status = status;
        
        const now = new Date().toISOString();
        if (status === 'ASSIGNED') delivery.assignedAt = now;
        if (status === 'PICKED_UP') delivery.pickedUpAt = now;
        if (status === 'OUT_FOR_DELIVERY') delivery.outForDeliveryAt = now;
        if (status === 'DELIVERED') delivery.deliveredAt = now;
      }
    },
    assignDeliveryBoy: (state, action) => {
      const { deliveryId, userId } = action.payload;
      const delivery = state.data.find(d => d.id === deliveryId);
      if (delivery) {
        delivery.assignedDeliveryUserId = userId;
        delivery.status = 'ASSIGNED';
        delivery.assignedAt = new Date().toISOString();
      }
    },
    updateDeliveryPayment: (state, action) => {
      const { deliveryId, paymentMethod } = action.payload;
      const delivery = state.data.find(d => d.id === deliveryId);
      if (delivery) {
        delivery.paymentMethod = paymentMethod;
      }
    }
  },
});

export const { createDelivery, updateDeliveryStatus, assignDeliveryBoy, updateDeliveryPayment } = deliverySlice.actions;
export default deliverySlice.reducer;
