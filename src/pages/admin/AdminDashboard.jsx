import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Super Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><CardHeader><CardTitle>Total Users</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">7</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Tables</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">12</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Menu Items</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">17</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Active Orders</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">0</p></CardContent></Card>
      </div>
    </div>
  );
}
