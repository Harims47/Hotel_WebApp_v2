import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  categories: [],
  items: []
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    createCategory: (state, action) => {
      if (!state.categories) state.categories = [];
      state.categories.push({ ...action.payload, status: 'ACTIVE' });
    },
    updateCategory: (state, action) => {
      if (!state.categories) state.categories = [];
      const index = state.categories.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = { ...state.categories[index], ...action.payload };
      }
    },
    updateCategoryStatus: (state, action) => {
      if (!state.categories) state.categories = [];
      const { id, status } = action.payload;
      const category = state.categories.find(c => c.id === id);
      if (category) {
        category.status = status;
      }
    },
    createMenuItem: (state, action) => {
      if (!state.items) state.items = [];
      state.items.push({ ...action.payload, isAvailable: true, status: 'ACTIVE' });
    },
    updateMenuItem: (state, action) => {
      if (!state.items) state.items = [];
      const index = state.items.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    updateMenuItemStatus: (state, action) => {
      if (!state.items) state.items = [];
      const { id, status } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item) {
        item.status = status;
        item.isAvailable = status === 'ACTIVE';
      }
    }
  },
});

export const { 
  createCategory, 
  updateCategory, 
  updateCategoryStatus,
  createMenuItem,
  updateMenuItem,
  updateMenuItemStatus
} = menuSlice.actions;

export default menuSlice.reducer;
