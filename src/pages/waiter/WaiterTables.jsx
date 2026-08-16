import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Users } from 'lucide-react';
import { cn } from '../../utils/cn';

export function WaiterTables() {
  const navigate = useNavigate();
  const tables = useSelector(state => state.tables.data);
  const orders = useSelector(state => state.orders.data);
  const { currentUser } = useSelector(state => state.auth);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-main">Tables</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.filter(t => t.configStatus !== 'INACTIVE' || t.status === 'OCCUPIED').map(table => {
          const isOccupied = table.status === 'OCCUPIED';
          
          // Find if there's an active order for this table
          const activeOrder = isOccupied 
            ? orders.find(o => o.tableId === table.id && o.status !== 'CLOSED') 
            : null;
            
          // If occupied by another waiter, maybe show it visually differently, but for V1 just let them view it
          const isMyTable = activeOrder?.waiterId === currentUser?.id;

          return (
            <Card 
              key={table.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-2",
                isOccupied ? (isMyTable ? "border-primary bg-primary-light/30" : "border-status-warning bg-yellow-50") : "border-transparent hover:border-primary"
              )}
              onClick={() => navigate(`/waiter/tables/${table.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{table.tableNumber}</CardTitle>
                  <Badge variant={isOccupied ? 'warning' : 'success'}>
                    {isOccupied ? 'Occupied' : 'Available'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-text-muted text-sm mb-2">
                  <Users className="w-4 h-4 mr-1" />
                  {table.capacity} Seats
                </div>
                {activeOrder && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-sm">
                    <p className="font-semibold text-text-main">{activeOrder.orderNumber}</p>
                    {isMyTable ? (
                      <p className="text-primary text-xs">My Table</p>
                    ) : (
                      <p className="text-text-muted text-xs">Other Waiter</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
