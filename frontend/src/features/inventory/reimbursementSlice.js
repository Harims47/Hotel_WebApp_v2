import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [],
  loading: false,
  error: null
};

const reimbursementSlice = createSlice({
  name: 'reimbursements',
  initialState,
  reducers: {
    createRecord: (state, action) => {
      state.data.push(action.payload);
    },
    updateRecord: (state, action) => {
      const index = state.data.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = { ...state.data[index], ...action.payload };
      }
    },
    updateStatus: (state, action) => {
      const { id, status, updatedFields } = action.payload;
      const index = state.data.findIndex(r => r.id === id);
      if (index !== -1) {
        state.data[index] = { ...state.data[index], status, ...updatedFields };
      }
    }
  }
});

export const { createRecord, updateRecord, updateStatus } = reimbursementSlice.actions;
export default reimbursementSlice.reducer;
