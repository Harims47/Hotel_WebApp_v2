import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api/client';

/**
 * Auth Redux Slice
 *
 * State:
 *   initialized  — true after the initial /me check completes (success or failure)
 *   loading      — true while an auth request is in-flight
 *   isAuthenticated — true when session is valid
 *   currentUser  — { id, name, username, phone }
 *   memberships  — [{ restaurant_id, restaurant_name, roles, permissions, locations }]
 *   activeContext — { restaurant_id, restaurant_name, location_id, location_name }
 *   roles        — [string] from the active membership
 *   permissions  — [string] from the active membership
 *   error        — string | null
 *
 * MUST NOT contain: session_token, password, cookie value
 */

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ username, password, restaurantId, locationId }, { rejectWithValue }) => {
    try {
      // 1. POST credentials → server sets HttpOnly cookie, returns only expires_at
      await api.post('/auth/login', { username, password });

      // 2. Fetch the full user context
      const headers = {};
      if (restaurantId) headers['X-Restaurant-ID'] = restaurantId;
      if (locationId) headers['X-Location-ID'] = locationId;
      const meRes = await api.get('/auth/me', { headers });
      return meRes.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const checkAuthAsync = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me');
      return res.data;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout', {});
    } catch (err) {
      // Even if backend fails, we clear client state
      return rejectWithValue(err);
    }
  }
);

// ─── Helper: build normalized state from /me response ───────────────────────

function buildAuthState(data) {
  const { user, active_context, memberships } = data;

  // Find permissions/roles for active restaurant membership
  const activeMembership = memberships?.find(
    m => m.restaurant_id === active_context?.restaurant_id
  );
  const roles = activeMembership?.roles || [];
  const permissions = activeMembership?.permissions || [];

  return {
    currentUser: {
      id: user.id,
      name: user.name,
      username: user.username,
      phone: user.phone,
      // Derive a display role from the first role for UI role-routing
      role: roles[0] || 'GUEST',
    },
    memberships: memberships || [],
    activeContext: active_context || null,
    roles,
    permissions,
  };
}

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    initialized: false,
    loading: false,
    isAuthenticated: false,
    currentUser: null,
    memberships: [],
    activeContext: null,
    roles: [],
    permissions: [],
    error: null,
  },
  reducers: {
    // Called by the session-expired event from the API client
    sessionExpired(state) {
      state.isAuthenticated = false;
      state.currentUser = null;
      state.memberships = [];
      state.activeContext = null;
      state.roles = [];
      state.permissions = [];
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    // ── loginAsync ────────────────────────────────────────────────────────
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.initialized = true;
        Object.assign(state, buildAuthState(action.payload));
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.initialized = true;
        state.error = action.payload?.message || 'Login failed';
      });

    // ── checkAuthAsync ────────────────────────────────────────────────────
    builder
      .addCase(checkAuthAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.initialized = true;
        Object.assign(state, buildAuthState(action.payload));
      })
      .addCase(checkAuthAsync.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.initialized = true;
        state.currentUser = null;
        state.memberships = [];
        state.activeContext = null;
        state.roles = [];
        state.permissions = [];
      });

    // ── logoutAsync ───────────────────────────────────────────────────────
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.initialized = true;
        state.currentUser = null;
        state.memberships = [];
        state.activeContext = null;
        state.roles = [];
        state.permissions = [];
        state.error = null;
      })
      .addCase(logoutAsync.rejected, (state) => {
        // Even on backend failure, clear client state
        state.loading = false;
        state.isAuthenticated = false;
        state.initialized = true;
        state.currentUser = null;
        state.memberships = [];
        state.activeContext = null;
        state.roles = [];
        state.permissions = [];
      });
  },
});

export const { sessionExpired } = authSlice.actions;

// Keep the old synchronous actions as no-ops during migration
// so components that import them don't break immediately.
export const login = (user) => ({ type: 'auth/legacyLogin', payload: user });
export const logout = () => ({ type: 'auth/legacyLogout' });

export default authSlice.reducer;
