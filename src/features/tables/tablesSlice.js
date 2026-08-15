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
  },
});

export const { updateTableStatus } = tablesSlice.actions;
export default tablesSlice.reducer;
