import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './app/store';
import { AppRouter } from './app/router';
import { checkAuthAsync, sessionExpired } from './features/auth/authSlice';

/**
 * AuthBootstrapper
 *
 * Runs on every page load (including browser refreshes) to call GET /auth/me.
 * If the HttpOnly session cookie is still valid, the user context is restored.
 * If not, the user is redirected to /login by the route guards.
 *
 * Also listens for the 'auth:session-expired' custom event dispatched by
 * the API client when any request returns HTTP 401.
 */
function AuthBootstrapper() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Bootstrap: check if we already have a valid server session
    dispatch(checkAuthAsync());

    // Listen for session expiry events from the API client
    const handleSessionExpired = () => {
      dispatch(sessionExpired());
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [dispatch]);

  return null;
}

function App() {
  return (
    <Provider store={store}>
      <AuthBootstrapper />
      <AppRouter />
      <Toaster position="top-right" richColors />
    </Provider>
  );
}

export default App;
