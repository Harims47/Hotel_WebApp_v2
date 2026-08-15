import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function CashierBills() {
  const navigate = useNavigate();
  const bills = useSelector(state => state.billing.data);
  const tables = useSelector(state => state.tables.data);
  const orders = useSelector(state => state.orders.data);

  const [filter, setFilter] = useState('REQUESTED'); // 'REQUESTED', 'ALL', 'PAID'

  const filteredBills = bills.filter(b => {
    if (filter === 'REQUESTED') return b.status === 'REQUESTED' || b.status === 'PRINTED';
    if (filter === 'PAID') return b.status === 'PAID';
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-main">Bills</h1>
        <div className="flex space-x-2">
          <Button 
            variant={filter === 'REQUESTED' ? 'default' : 'outline'} 
            onClick={() => setFilter('REQUESTED')}
          >
            Requests
          </Button>
          <Button 
            variant={filter === 'PAID' ? 'default' : 'outline'} 
            onClick={() => setFilter('PAID')}
          >
            Paid
          </Button>
          <Button 
            variant={filter === 'ALL' ? 'default' : 'outline'} 
            onClick={() => setFilter('ALL')}
          >
            All Bills
          </Button>
        </div>
      </div>
      
      {filteredBills.length === 0 ? (
        <div className="text-text-muted">No bills found for the selected filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map(bill => {
            const table = tables.find(t => t.id === bill.tableId);
            const order = orders.find(o => o.id === bill.orderId);
            
            return (
              <Card key={bill.id} className="border border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-primary">{bill.billNumber}</h3>
                      <p className="text-sm font-semibold text-text-main">Table {table?.tableNumber || 'Unknown'}</p>
                    </div>
                    <Badge variant={
                      bill.status === 'REQUESTED' ? 'warning' :
                      bill.status === 'PRINTED' ? 'primary' :
                      'success'
                    }>
                      {bill.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-text-muted mb-4">
                    <p>Order: {order?.orderNumber}</p>
                    <p>Total: <span className="font-semibold text-text-main">₹{bill.grandTotal.toFixed(2)}</span></p>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate(`/cashier/bills/${bill.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
