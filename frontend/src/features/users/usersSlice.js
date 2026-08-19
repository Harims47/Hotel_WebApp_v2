import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: []
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    createUser: (state, action) => {
      if (!state.data) state.data = [];
      state.data.push(action.payload);
    },
    updateUser: (state, action) => {
      if (!state.data) state.data = [];
      const index = state.data.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = { ...state.data[index], ...action.payload };
      }
    },
    updateUserStatus: (state, action) => {
      if (!state.data) state.data = [];
      const user = state.data.find(u => u.id === action.payload.id);
      if (user) user.status = action.payload.status;
    },
    updateUserRole: (state, action) => {
      if (!state.data) state.data = [];
      const user = state.data.find(u => u.id === action.payload.id);
      if (user) user.role = action.payload.role;
    }
  },
});

export const { createUser, updateUser, updateUserStatus, updateUserRole } = usersSlice.actions;
export default usersSlice.reducer;
