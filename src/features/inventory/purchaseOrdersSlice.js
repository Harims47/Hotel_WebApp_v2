import { createSlice } from '@reduxjs/toolkit';

const purchaseOrdersSlice = createSlice({
  name: 'purchaseOrders',
  initialState: { data: [] },
  reducers: {
    createPO: (state, action) => {
      if (!state.data) state.data = [];
      state.data.push(action.payload);
    },
    updatePO: (state, action) => {
      if (!state.data) state.data = [];
      const index = state.data.findIndex(po => po.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = { ...state.data[index], ...action.payload, updatedAt: new Date().toISOString() };
      }
    },
    updatePOFull: (state, action) => {
      if (!state.data) state.data = [];
      const index = state.data.findIndex(po => po.id === action.payload.id);
      if (index !== -1 && state.data[index].status === 'DRAFT') {
        state.data[index] = { ...state.data[index], ...action.payload, updatedAt: new Date().toISOString() };
      }
    },
    updatePOStatus: (state, action) => {
      if (!state.data) state.data = [];
      const po = state.data.find(po => po.id === action.payload.id);
      if (po) {
        po.status = action.payload.status;
        po.updatedAt = new Date().toISOString();
      }
    }
  },
});

export const { createPO, updatePO, updatePOFull, updatePOStatus } = purchaseOrdersSlice.actions;
export default purchaseOrdersSlice.reducer;
