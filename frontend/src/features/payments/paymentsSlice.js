import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: []
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    createPayment: (state, action) => {
      state.data.push(action.payload);
    }
  },
});

export const { createPayment } = paymentsSlice.actions;
export default paymentsSlice.reducer;
