import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export function KOTDashboard() {
  const navigate = useNavigate();
  const kots = useSelector(state => state.kot.data);

  const newCount = kots.filter(k => k.status === 'NEW').length;
  const preparingCount = kots.filter(k => k.status === 'PREPARING').length;
  const readyCount = kots.filter(k => k.status === 'READY').length;
  const completedCount = kots.filter(k => k.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">KOT Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/kot/orders')}>
          <CardHeader><CardTitle>New Orders</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{newCount}</p></CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/kot/preparing')}>
          <CardHeader><CardTitle>Preparing</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{preparingCount}</p></CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/kot/ready')}>
          <CardHeader><CardTitle>Ready</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{readyCount}</p></CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/kot/completed')}>
          <CardHeader><CardTitle>Completed</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{completedCount}</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
