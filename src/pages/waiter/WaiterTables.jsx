import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Users } from 'lucide-react';
import { cn } from '../../utils/cn';

export function WaiterTables() {
  const navigate = useNavigate();
  const tables = useSelector(state => state.tables.data);
  const orders = useSelector(state => state.orders.data);
  const { currentUser } = useSelector(state => state.auth);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Tables" 
        description="Select a table to start a new order or manage an existing one."
      />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {tables.filter(t => t.configStatus !== 'INACTIVE' || t.status === 'OCCUPIED').map(table => {
          const isOccupied = table.status === 'OCCUPIED';
          
          const activeOrder = isOccupied 
            ? orders.find(o => o.tableId === table.id && o.status !== 'CLOSED' && o.status !== 'CANCELLED') 
            : null;
            
          const isMyTable = activeOrder?.waiterId === currentUser?.id;

          return (
            <Card 
              key={table.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border-2",
                isOccupied 
                  ? (isMyTable ? "border-primary bg-primary/5" : "border-transparent bg-yellow-50/50") 
                  : "border-transparent hover:border-primary/50 bg-white"
              )}
              onClick={() => navigate(`/waiter/tables/${table.id}`)}
            >
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Table</p>
                    <CardTitle className="text-2xl">{table.tableNumber}</CardTitle>
                  </div>
                  <Badge variant={isOccupied ? (isMyTable ? 'primary' : 'warning') : 'success'} className="px-2.5 py-1">
                    {isOccupied ? 'Occupied' : 'Available'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center text-text-muted text-sm font-medium">
                  <Users className="w-4 h-4 mr-2" />
                  {table.capacity} Seats
                </div>
                {activeOrder && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-text-main text-sm">{activeOrder.orderNumber}</p>
                      {isMyTable ? (
                        <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-0.5 rounded">My Table</span>
                      ) : (
                        <span className="text-text-muted text-xs font-medium">Other Waiter</span>
                      )}
                    </div>
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
