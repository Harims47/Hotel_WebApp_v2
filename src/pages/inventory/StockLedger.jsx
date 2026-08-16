import React from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function StockLedger() {
  const ledger = useSelector(state => state.stockLedger.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const users = useSelector(state => state.users.data) || [];
  
  // Sort descending by date
  const sortedLedger = [...ledger].sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock Ledger" 
        breadcrumbs="Inventory / Stock Ledger"
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Transaction</Table.Th>
                <Table.Th>Item</Table.Th>
                <Table.Th>Location</Table.Th>
                <Table.Th>Ref</Table.Th>
                <Table.Th>Qty (Change)</Table.Th>
                <Table.Th>Balance</Table.Th>
                <Table.Th>Rate</Table.Th>
                <Table.Th>User</Table.Th>
              </tr>
            </thead>
            <tbody>
              {sortedLedger.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <EmptyState 
                      icon={FileText} 
                      title="No Transactions" 
                      description="No stock ledger entries exist yet." 
                    />
                  </td>
                </tr>
              ) : (
                sortedLedger.map(entry => {
                  const location = locations.find(l => l.id === entry.locationId);
                  const uom = uoms.find(u => u.id === entry.uomId);
                  const user = users.find(u => u.id === entry.createdBy);
                  
                  return (
                    <tr key={entry.id}>
                      <Table.Td className="whitespace-nowrap">
                        <div className="text-sm">
                          <div>{new Date(entry.transactionDate).toLocaleDateString()}</div>
                          <div className="text-xs text-text-muted">{new Date(entry.transactionDate).toLocaleTimeString()}</div>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant={entry.quantity >= 0 ? "success" : "danger"}>{entry.transactionType}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <div className="font-bold text-text-main">{entry.itemName}</div>
                          <div className="text-xs text-text-muted">{entry.itemCode}</div>
                        </div>
                      </Table.Td>
                      <Table.Td>{location?.name || 'Unknown'}</Table.Td>
                      <Table.Td>
                        <div className="text-xs font-medium">{entry.referenceType}</div>
                        <div className="text-xs text-text-muted">{entry.referenceNumber}</div>
                      </Table.Td>
                      <Table.Td>
                        <span className={`font-bold ${entry.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {entry.quantity > 0 ? '+' : ''}{entry.quantity} {uom?.code}
                        </span>
                      </Table.Td>
                      <Table.Td>
                        <span className="font-medium">
                          {entry.balanceAfter} {uom?.code}
                        </span>
                      </Table.Td>
                      <Table.Td>
                        {formatCurrency(entry.rate)}
                      </Table.Td>
                      <Table.Td className="text-sm text-text-muted">
                        {user?.name || 'System'}
                      </Table.Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
