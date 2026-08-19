import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateRestaurantProfile } from '../../features/restaurant/restaurantSlice';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function AdminRestaurant() {
  const dispatch = useDispatch();
  const restaurant = useSelector(state => state.restaurant.data) || {};
  const { currentUser } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    address: restaurant.address || '',
    phone: restaurant.phone || '',
    email: restaurant.email || '',
    gstNumber: restaurant.gstNumber || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    dispatch(updateRestaurantProfile(formData));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: 'RESTAURANT_PROFILE_UPDATED',
      entityType: 'RESTAURANT',
      entityId: restaurant.id || 'rest-1',
      description: 'Restaurant profile updated',
      createdAt: new Date().toISOString()
    }));
    toast.success('Restaurant profile updated');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-text-main">Restaurant Profile</h1>
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full border p-2 rounded focus:ring-primary focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded focus:ring-primary focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
            <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full border p-2 rounded focus:ring-primary focus:border-primary" />
          </div>
          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
