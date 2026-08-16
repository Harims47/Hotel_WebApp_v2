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
    const rolePrefix = currentUser.role === 'SUPER_ADMIN' ? 'admin' : 
                       currentUser.role === 'DELIVERY_BOY' ? 'delivery' : 
                       currentUser.role === 'INVENTORY_MANAGER' ? 'inventory' : 
                       currentUser.role.toLowerCase();
    return <Navigate to={`/${rolePrefix}/dashboard`} replace />;
  }

  const onSubmit = (data) => {
    const user = users.find(u => u.username === data.username && u.password === data.password);
    
    if (user) {
      dispatch(login(user));
      const rolePrefix = user.role === 'SUPER_ADMIN' ? 'admin' : 
                         user.role === 'DELIVERY_BOY' ? 'delivery' : 
                         user.role === 'INVENTORY_MANAGER' ? 'inventory' : 
                         user.role.toLowerCase();
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
    <div className="min-h-screen flex">
      {/* LEFT PANEL - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar-dark flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Subtle background pattern/gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight">
            <span className="text-primary">Resto</span>OS
          </h2>
          <p className="mt-2 text-sm text-gray-400 font-medium tracking-widest uppercase">
            Restaurant Management System
          </p>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Fine Dining,<br/>
            <span className="text-primary">Orchestrated.</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            The premium operating system designed for modern restaurants. Streamline your operations, empower your staff, and deliver exceptional experiences.
          </p>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          &copy; {new Date().getFullYear()} RestoOS. All rights reserved.
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

              <Button type="submit" size="lg" className="w-full font-bold text-base mt-2">
                SIGN IN TO POS
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-border/60">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Quick Demo Access</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div 
                  className="bg-white p-3 rounded-xl border border-border cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                  onClick={() => handleDemoClick('superadmin')}
                >
                  <span className="font-bold block text-text-main group-hover:text-primary transition-colors">Super Admin</span>
                  <span className="text-text-muted mt-0.5 block">superadmin</span>
                </div>
                <div 
                  className="bg-white p-3 rounded-xl border border-border cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                  onClick={() => handleDemoClick('gm')}
                >
                  <span className="font-bold block text-text-main group-hover:text-primary transition-colors">Manager</span>
                  <span className="text-text-muted mt-0.5 block">gm</span>
                </div>
                <div 
                  className="bg-white p-3 rounded-xl border border-border cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                  onClick={() => handleDemoClick('waiter1')}
                >
                  <span className="font-bold block text-text-main group-hover:text-primary transition-colors">Waiter</span>
                  <span className="text-text-muted mt-0.5 block">waiter1</span>
                </div>
                <div 
                  className="bg-white p-3 rounded-xl border border-border cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                  onClick={() => handleDemoClick('kitchen')}
                >
                  <span className="font-bold block text-text-main group-hover:text-primary transition-colors">Kitchen</span>
                  <span className="text-text-muted mt-0.5 block">kitchen</span>
                </div>
                <div 
                  className="bg-white p-3 rounded-xl border border-border cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                  onClick={() => handleDemoClick('cashier')}
                >
                  <span className="font-bold block text-text-main group-hover:text-primary transition-colors">Cashier</span>
                  <span className="text-text-muted mt-0.5 block">cashier</span>
                </div>
                <div 
                  className="bg-white p-3 rounded-xl border border-border cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                  onClick={() => handleDemoClick('delivery')}
                >
                  <span className="font-bold block text-text-main group-hover:text-primary transition-colors">Delivery</span>
                  <span className="text-text-muted mt-0.5 block">delivery</span>
                </div>
                <div 
                  className="bg-white p-3 rounded-xl border border-border cursor-pointer hover:border-primary hover:shadow-md transition-all group lg:col-span-2"
                  onClick={() => handleDemoClick('inventory')}
                >
                  <span className="font-bold block text-text-main group-hover:text-primary transition-colors">Inventory</span>
                  <span className="text-text-muted mt-0.5 block">inventory</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
