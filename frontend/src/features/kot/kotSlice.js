import { createSlice } from '@reduxjs/toolkit';

const kotSlice = createSlice({
  name: 'kot',
  initialState: { data: [] },
  reducers: {
    createKOT: (state, action) => {
      state.data.push(action.payload);
    },
    updateKOTStatus: (state, action) => {
      const { kotId, status } = action.payload;
      const kot = state.data.find(k => k.id === kotId);
      if (kot) {
        kot.status = status;
      }
    },
    updateKOTItemStatus: (state, action) => {
      const { kotId, kotItemId, status } = action.payload;
      const kot = state.data.find(k => k.id === kotId);
      if (kot) {
        const item = kot.items.find(i => i.id === kotItemId);
        if (item) {
          item.status = status;
        }
      }
    },
  },
});

export const { createKOT, updateKOTStatus, updateKOTItemStatus } = kotSlice.actions;
export default kotSlice.reducer;
