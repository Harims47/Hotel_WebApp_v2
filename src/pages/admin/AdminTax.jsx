import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateTaxSettings } from '../../features/restaurant/restaurantSlice';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function AdminTax() {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.restaurant.data?.settings) || {};
  const { currentUser } = useSelector(state => state.auth);

  const [taxRate, setTaxRate] = useState(settings.taxRate ?? 5);
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled ?? true);

  const handleSave = () => {
    dispatch(updateTaxSettings({ taxRate: Number(taxRate), taxEnabled }));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: 'TAX_UPDATED',
      entityType: 'SETTINGS',
      entityId: 'tax',
      description: `Tax updated to ${taxRate}% (Enabled: ${taxEnabled})`,
      createdAt: new Date().toISOString()
    }));
    toast.success('Tax settings saved');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-text-main">Tax Configuration</h1>
      <Card>
        <CardHeader><CardTitle>Tax Settings</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div>
              <p className="font-medium text-gray-800">Enable Tax</p>
              <p className="text-sm text-gray-500">Apply tax to all new bills</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={taxEnabled} onChange={(e) => setTaxEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Percentage (%)</label>
            <input 
              type="number" 
              value={taxRate} 
              onChange={(e) => setTaxRate(e.target.value)} 
              disabled={!taxEnabled}
              className="w-full border p-2 rounded focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-400" 
            />
            <p className="text-xs text-gray-500 mt-2">This will only affect new bills. Existing bills will remain unchanged.</p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
