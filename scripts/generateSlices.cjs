const fs = require('fs');
const slices = ['restaurant', 'users', 'tables', 'menu', 'orders', 'kot', 'billing', 'payments', 'customers', 'delivery', 'notifications', 'audit'];
slices.forEach(slice => {
  const code = `import { createSlice } from '@reduxjs/toolkit';

const initialState = {};

const ${slice}Slice = createSlice({
  name: '${slice}',
  initialState,
  reducers: {},
});

export default ${slice}Slice.reducer;
`;
  fs.writeFileSync(`../frontend/src/features/${slice}/${slice}Slice.js`, code);
});
