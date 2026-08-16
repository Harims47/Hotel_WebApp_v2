import { createSlice } from '@reduxjs/toolkit';

const createCrudSlice = (name) => {
  return createSlice({
    name,
    initialState: { data: [] },
    reducers: {
      createRecord: (state, action) => {
        if (!state.data) state.data = [];
        state.data.push(action.payload);
      },
      updateRecord: (state, action) => {
        if (!state.data) state.data = [];
        const index = state.data.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = { ...state.data[index], ...action.payload };
        }
      },
      updateRecordStatus: (state, action) => {
        if (!state.data) state.data = [];
        const record = state.data.find(r => r.id === action.payload.id);
        if (record) record.status = action.payload.status;
      }
    },
  });
};

const invCategoriesSlice = createCrudSlice('invCategories');
const invUomSlice = createCrudSlice('invUom');
const invLocationsSlice = createCrudSlice('invLocations');
const invSuppliersSlice = createCrudSlice('invSuppliers');
const invItemsSlice = createCrudSlice('invItems');
const invStockSlice = createCrudSlice('invStock');

export const invCategoriesActions = invCategoriesSlice.actions;
export const invUomActions = invUomSlice.actions;
export const invLocationsActions = invLocationsSlice.actions;
export const invSuppliersActions = invSuppliersSlice.actions;
export const invItemsActions = invItemsSlice.actions;
export const invStockActions = invStockSlice.actions;

export const invCategoriesReducer = invCategoriesSlice.reducer;
export const invUomReducer = invUomSlice.reducer;
export const invLocationsReducer = invLocationsSlice.reducer;
export const invSuppliersReducer = invSuppliersSlice.reducer;
export const invItemsReducer = invItemsSlice.reducer;
export const invStockReducer = invStockSlice.reducer;
