import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updatePaymentMethods } from '../../features/restaurant/restaurantSlice';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function AdminPayments() {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.restaurant.data?.settings) || {};
  const { currentUser } = useSelector(state => state.auth);

  const [methods, setMethods] = useState(settings.paymentMethods || { CASH: true, UPI: true });

  const handleToggle = (method) => {
    setMethods(prev => ({ ...prev, [method]: !prev[method] }));
  };

  const handleSave = () => {
    dispatch(updatePaymentMethods(methods));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: 'PAYMENT_METHOD_UPDATED',
      entityType: 'SETTINGS',
      entityId: 'payment-methods',
      description: `Payment methods updated`,
      createdAt: new Date().toISOString()
    }));
    toast.success('Payment methods updated');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-text-main">Payment Methods</h1>
      <Card>
        <CardHeader><CardTitle>Enabled Payment Options</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div>
              <p className="font-medium text-gray-800">Cash Payment</p>
              <p className="text-sm text-gray-500">Allow customers to pay with cash</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={methods.CASH} onChange={() => handleToggle('CASH')} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div>
              <p className="font-medium text-gray-800">UPI Payment</p>
              <p className="text-sm text-gray-500">Allow customers to pay via UPI</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={methods.UPI} onChange={() => handleToggle('UPI')} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <p className="text-xs text-gray-500 mt-2">Disabling a payment method will immediately hide it from the Cashier and Delivery workflows. Historical payments will not be affected.</p>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
