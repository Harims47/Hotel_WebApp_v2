import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { loginAsync } from '../../features/auth/authSlice';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Map backend role → dashboard path
function roleToDashboardPath(role) {
  switch (role) {
    case 'SUPER_ADMIN':       return '/admin/users';
    case 'GM':                return '/management/dashboard';
    case 'WAITER':            return '/waiter/tables';
    case 'CASHIER':           return '/cashier/bills';
    case 'KOT':               return '/kot/orders';
    case 'DELIVERY_BOY':      return '/delivery/orders';
    case 'INVENTORY_MANAGER': return '/inventory/dashboard';
    default:                  return '/waiter/tables';
  }
}

export function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, initialized, loading, error, currentUser } = useSelector(state => state.auth);

  const { register, handleSubmit, formState: { errors }, setError, clearErrors } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated (e.g., session recovered on refresh)
  if (initialized && isAuthenticated && currentUser) {
    return <Navigate to={roleToDashboardPath(currentUser.role)} replace />;
  }

  const onSubmit = async (data) => {
    clearErrors('root');
    const result = await dispatch(loginAsync({ username: data.username, password: data.password }));

    if (loginAsync.fulfilled.match(result)) {
      const role = result.payload?.user ? (result.payload.memberships?.[0]?.roles?.[0] || 'WAITER') : 'WAITER';
      // Navigation happens automatically via the isAuthenticated redirect above,
      // but we push here too for immediate response.
      const me = result.payload;
      const activeRole = me?.memberships?.[0]?.roles?.[0] || 'WAITER';
      navigate(roleToDashboardPath(activeRole), { replace: true });
    } else {
      const err = result.payload;
      let msg = 'Invalid username or password';
      if (err?.status === 429) {
        msg = 'Too many failed attempts. Please wait 15 minutes before trying again.';
      } else if (err?.status === 403) {
        msg = 'Your account is inactive. Please contact your administrator.';
      } else if (err?.status === 0) {
        msg = 'Cannot connect to server. Please check your network connection.';
      } else if (err?.message) {
        msg = err.message;
      }
      setError('root', { type: 'manual', message: msg });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL - Branding with Owner Photo */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url("/owner-photo.png")' }}
      >
        {/* Dark overlay to ensure text readability if needed */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-md">
          <img src="/logoo.png" alt="Logo" className="max-h-24 w-auto object-contain mb-8" />
          <h1 className="text-5xl font-bold leading-tight mb-6 drop-shadow-lg">
            Welcome!
          </h1>
          <p className="text-lg text-gray-200 leading-relaxed drop-shadow-md">
            Authentic taste, exceptional service, and a memorable dining experience.
          </p>
        </div>

        <div className="relative z-10 text-sm text-gray-300 drop-shadow-md">
          &copy; {new Date().getFullYear()} NS Resto Cafe. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - Login */}
      <div className="w-full lg:w-1/2 bg-peach-soft flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-text-main">
              Sign In
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Welcome back! Please enter your details.
            </p>
          </div>

          <Card className="p-8 shadow-xl border-0 ring-1 ring-border/50">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">
                  Username
                </label>
                <Input
                  type="text"
                  {...register('username')}
                  error={errors.username?.message}
                  placeholder="e.g., superadmin"
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                  placeholder="••••••••"
                  className="bg-gray-50"
                />
              </div>

              {errors.root && (
                <div className="p-3 bg-red-50 border border-red-200 text-status-danger text-sm rounded-lg text-center font-medium">
                  {errors.root.message}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full font-bold text-base mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  'SIGN IN TO POS'
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
