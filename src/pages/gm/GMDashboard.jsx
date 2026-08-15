import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function GMDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">GM Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><CardHeader><CardTitle>Tables Occupied</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">0 / 12</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Active Orders</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">0</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Pending KOT</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">0</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Today's Revenue</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-primary">₹0</p></CardContent></Card>
      </div>
    </div>
  );
}
