import { createSlice } from '@reduxjs/toolkit';

const transferSlice = createSlice({
  name: 'invTransfers',
  initialState: { data: [] },
  reducers: {
    createTransfer: (state, action) => {
      if (!state.data) state.data = [];
      state.data.push(action.payload);
    },
    updateTransfer: (state, action) => {
      if (!state.data) state.data = [];
      const index = state.data.findIndex(r => r.id === action.payload.id);
      if (index !== -1 && state.data[index].status === 'DRAFT') {
        state.data[index] = { ...state.data[index], ...action.payload, updatedAt: new Date().toISOString() };
      }
    },
    updateTransferStatus: (state, action) => {
      if (!state.data) state.data = [];
      const record = state.data.find(r => r.id === action.payload.id);
      if (record) {
        record.status = action.payload.status;
        record.updatedAt = new Date().toISOString();
      }
    },
    confirmTransferState: (state, action) => {
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

export const { createTransfer, updateTransfer, updateTransferStatus, confirmTransferState } = transferSlice.actions;
export default transferSlice.reducer;
