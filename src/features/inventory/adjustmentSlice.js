import { createSlice } from '@reduxjs/toolkit';

const adjustmentSlice = createSlice({
  name: 'invAdjustments',
  initialState: { data: [] },
  reducers: {
    createAdjustment: (state, action) => {
      if (!state.data) state.data = [];
      state.data.push(action.payload);
    },
    updateAdjustment: (state, action) => {
      if (!state.data) state.data = [];
      const index = state.data.findIndex(r => r.id === action.payload.id);
      if (index !== -1 && state.data[index].status === 'DRAFT') {
        state.data[index] = { ...state.data[index], ...action.payload, updatedAt: new Date().toISOString() };
      }
    },
    updateAdjustmentStatus: (state, action) => {
      if (!state.data) state.data = [];
      const record = state.data.find(r => r.id === action.payload.id);
      if (record) {
        record.status = action.payload.status;
        record.updatedAt = new Date().toISOString();
      }
    },
    confirmAdjustmentState: (state, action) => {
      if (!state.data) state.data = [];
      const record = state.data.find(r => r.id === action.payload.id);
      if (record) {
        record.status = 'CONFIRMED';
        record.confirmedAt = action.payload.confirmedAt;
        record.confirmedBy = action.payload.confirmedBy;
        record.updatedAt = new Date().toISOString();
      }
    }
  },
});

export const { createAdjustment, updateAdjustment, updateAdjustmentStatus, confirmAdjustmentState } = adjustmentSlice.actions;
export default adjustmentSlice.reducer;
