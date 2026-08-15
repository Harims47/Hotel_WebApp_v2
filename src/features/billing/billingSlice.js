import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: []
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    createBill: (state, action) => {
      if (!state.data) {
        state.data = state.bills || [];
      }
      state.data.push(action.payload);
    },
    updateBillStatus: (state, action) => {
      if (!state.data) state.data = state.bills || [];
      const { billId, status, printedAt } = action.payload;
      const bill = state.data.find(b => b.id === billId);
      if (bill) {
        bill.status = status;
        if (printedAt) bill.printedAt = printedAt;
      }
    },
    updateBillDetails: (state, action) => {
      if (!state.data) state.data = state.bills || [];
      const { billId, items, subtotal, discountPercentage, discountAmount, taxAmount, grandTotal } = action.payload;
      const bill = state.data.find(b => b.id === billId);
      if (bill) {
        if (items) bill.items = items;
        if (subtotal !== undefined) bill.subtotal = subtotal;
        if (discountPercentage !== undefined) bill.discountPercentage = discountPercentage;
        if (discountAmount !== undefined) bill.discountAmount = discountAmount;
        if (taxAmount !== undefined) bill.taxAmount = taxAmount;
        if (grandTotal !== undefined) bill.grandTotal = grandTotal;
      }
    }
  },
});

export const { createBill, updateBillStatus, updateBillDetails } = billingSlice.actions;
export default billingSlice.reducer;
