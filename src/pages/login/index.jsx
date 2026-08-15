import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { login } from '../../features/auth/authSlice';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const users = useSelector(state => state.users.data) || [];
  const { isAuthenticated, currentUser } = useSelector(state => state.auth);

  const { register, handleSubmit, setValue, formState: { errors }, setError } = useForm({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated && currentUser) {
    const rolePrefix = currentUser.role === 'SUPER_ADMIN' ? 'admin' : currentUser.role === 'DELIVERY_BOY' ? 'delivery' : currentUser.role.toLowerCase();
    return <Navigate to={`/${rolePrefix}/dashboard`} replace />;
  }

  const onSubmit = (data) => {
    const user = users.find(u => u.username === data.username && u.password === data.password);
    
    if (user) {
      dispatch(login(user));
      const rolePrefix = user.role === 'SUPER_ADMIN' ? 'admin' : user.role === 'DELIVERY_BOY' ? 'delivery' : user.role.toLowerCase();
      navigate(`/${rolePrefix}/dashboard`);
    } else {
      setError('root', { type: 'manual', message: 'Invalid username or password' });
    }
  };

  const handleDemoClick = (username, password = '123456') => {
    setValue('username', username);
    setValue('password', password);
  };

  return (
    <div className="min-h-screen bg-peach-soft flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
          Resto<span className="text-text-main">OS</span>
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          Restaurant Management System V1
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Username
              </label>
              <Input
                type="text"
                {...register('username')}
                error={errors.username?.message}
                placeholder="superadmin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Password
              </label>
              <Input
                type="password"
                {...register('password')}
                error={errors.password?.message}
                placeholder="123456"
              />
            </div>

            {errors.root && (
              <div className="text-status-danger text-sm text-center">
                {errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-sm font-medium text-text-muted text-center mb-4">Demo Accounts (Password: 123456)</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div 
                className="bg-gray-50 p-2 rounded border border-border cursor-pointer hover:bg-orange-50 hover:border-primary transition-colors"
                onClick={() => handleDemoClick('superadmin')}
              >
                <span className="font-semibold block text-primary">Super Admin</span>
                <span className="text-text-muted">superadmin</span>
              </div>
              <div 
                className="bg-gray-50 p-2 rounded border border-border cursor-pointer hover:bg-orange-50 hover:border-primary transition-colors"
                onClick={() => handleDemoClick('gm')}
              >
                <span className="font-semibold block text-primary">General Manager</span>
                <span className="text-text-muted">gm</span>
              </div>
              <div 
                className="bg-gray-50 p-2 rounded border border-border cursor-pointer hover:bg-orange-50 hover:border-primary transition-colors"
                onClick={() => handleDemoClick('waiter1')}
              >
                <span className="font-semibold block text-primary">Waiter</span>
                <span className="text-text-muted">waiter1</span>
              </div>
              <div 
                className="bg-gray-50 p-2 rounded border border-border cursor-pointer hover:bg-orange-50 hover:border-primary transition-colors"
                onClick={() => handleDemoClick('kitchen')}
              >
                <span className="font-semibold block text-primary">KOT</span>
                <span className="text-text-muted">kitchen</span>
              </div>
              <div 
                className="bg-gray-50 p-2 rounded border border-border cursor-pointer hover:bg-orange-50 hover:border-primary transition-colors"
                onClick={() => handleDemoClick('cashier')}
              >
                <span className="font-semibold block text-primary">Cashier</span>
                <span className="text-text-muted">cashier</span>
              </div>
              <div 
                className="bg-gray-50 p-2 rounded border border-border cursor-pointer hover:bg-orange-50 hover:border-primary transition-colors"
                onClick={() => handleDemoClick('delivery')}
              >
                <span className="font-semibold block text-primary">Delivery</span>
                <span className="text-text-muted">delivery</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
