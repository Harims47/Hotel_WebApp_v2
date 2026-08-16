import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: {
    settings: {
      taxRate: 5,
      paymentMethods: {
        CASH: true,
        UPI: true
      }
    }
  }
};

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    updateRestaurantProfile: (state, action) => {
      if (!state.data) state.data = {};
      state.data = { ...state.data, ...action.payload };
    },
    updateTaxSettings: (state, action) => {
      if (!state.data) state.data = { settings: {} };
      if (!state.data.settings) state.data.settings = {};
      state.data.settings.taxRate = action.payload.taxRate;
      state.data.settings.taxEnabled = action.payload.taxEnabled;
    },
    updatePaymentMethods: (state, action) => {
      if (!state.data) state.data = { settings: {} };
      if (!state.data.settings) state.data.settings = {};
      if (!state.data.settings.paymentMethods) state.data.settings.paymentMethods = {};
      state.data.settings.paymentMethods = { ...state.data.settings.paymentMethods, ...action.payload };
    }
  },
});

export const { updateRestaurantProfile, updateTaxSettings, updatePaymentMethods } = restaurantSlice.actions;
export default restaurantSlice.reducer;
