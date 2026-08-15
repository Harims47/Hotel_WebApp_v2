import { createSlice } from '@reduxjs/toolkit';

const auditSlice = createSlice({
  name: 'audit',
  initialState: { data: [] },
  reducers: {
    logAction: (state, action) => {
      state.data.push(action.payload);
    },
  },
});

export const { logAction } = auditSlice.actions;
export default auditSlice.reducer;
