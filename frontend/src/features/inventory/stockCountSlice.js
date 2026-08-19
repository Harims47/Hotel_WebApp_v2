import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [],
  loading: false,
  error: null,
};

const stockCountSlice = createSlice({
  name: 'invStockCounts',
  initialState,
  reducers: {
    addStockCount: (state, action) => {
      state.data.push(action.payload);
    },
    updateStockCount: (state, action) => {
      const index = state.data.findIndex(sc => sc.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = { ...state.data[index], ...action.payload };
      }
    },
    updateStockCountStatus: (state, action) => {
      const { id, status, confirmedBy, confirmedAt } = action.payload;
      const index = state.data.findIndex(sc => sc.id === id);
      if (index !== -1) {
        state.data[index].status = status;
        if (confirmedBy) state.data[index].confirmedBy = confirmedBy;
        if (confirmedAt) state.data[index].confirmedAt = confirmedAt;
        state.data[index].updatedAt = new Date().toISOString();
      }
    },
    deleteStockCount: (state, action) => {
      state.data = state.data.filter(sc => sc.id !== action.payload);
    }
  },
});

export const {
  addStockCount,
  updateStockCount,
  updateStockCountStatus,
  deleteStockCount
} = stockCountSlice.actions;

export default stockCountSlice.reducer;
