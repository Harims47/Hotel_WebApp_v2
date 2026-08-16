import { createSlice } from '@reduxjs/toolkit';

const stockLedgerSlice = createSlice({
  name: 'stockLedger',
  initialState: { data: [] },
  reducers: {
    addLedgerEntry: (state, action) => {
      if (!state.data) state.data = [];
      state.data.push(action.payload);
    },
    addMultipleLedgerEntries: (state, action) => {
      if (!state.data) state.data = [];
      state.data.push(...action.payload);
    }
  },
});

export const { addLedgerEntry, addMultipleLedgerEntries } = stockLedgerSlice.actions;
export default stockLedgerSlice.reducer;
