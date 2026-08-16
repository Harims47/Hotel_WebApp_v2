import { createSlice } from '@reduxjs/toolkit';

const tablesSlice = createSlice({
  name: 'tables',
  initialState: { data: [] },
  reducers: {
    updateTableStatus: (state, action) => {
      const { tableId, status } = action.payload;
      const table = state.data.find(t => t.id === tableId);
      if (table) {
        table.status = status;
      }
    },
    createTable: (state, action) => {
      state.data.push({ ...action.payload, configStatus: 'ACTIVE' });
    },
    updateTable: (state, action) => {
      const index = state.data.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = { ...state.data[index], ...action.payload };
      }
    },
    updateTableConfigStatus: (state, action) => {
      const { id, configStatus } = action.payload;
      const table = state.data.find(t => t.id === id);
      if (table) {
        table.configStatus = configStatus;
      }
    }
  },
});

export const { updateTableStatus, createTable, updateTable, updateTableConfigStatus } = tablesSlice.actions;
export default tablesSlice.reducer;
