import { createSlice } from '@reduxjs/toolkit';

const grnSlice = createSlice({
  name: 'grn',
  initialState: { data: [] },
  reducers: {
    createGRN: (state, action) => {
      if (!state.data) state.data = [];
      state.data.push(action.payload);
    },
    updateGRN: (state, action) => {
      if (!state.data) state.data = [];
      const index = state.data.findIndex(grn => grn.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = { ...state.data[index], ...action.payload, updatedAt: new Date().toISOString() };
      }
    },
    updateGRNStatus: (state, action) => {
      if (!state.data) state.data = [];
      const grn = state.data.find(grn => grn.id === action.payload.id);
      if (grn) {
        grn.status = action.payload.status;
        grn.updatedAt = new Date().toISOString();
      }
    },
    confirmGRNState: (state, action) => {
      if (!state.data) state.data = [];
      const grn = state.data.find(g => g.id === action.payload.id);
      if (grn) {
        grn.status = 'CONFIRMED';
        grn.confirmedAt = action.payload.confirmedAt;
        grn.confirmedBy = action.payload.confirmedBy;
        grn.updatedAt = new Date().toISOString();
      }
    }
  },
});

export const { createGRN, updateGRN, updateGRNStatus, confirmGRNState } = grnSlice.actions;
export default grnSlice.reducer;
