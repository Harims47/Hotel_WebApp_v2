import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchInput } from '../../components/ui/SearchInput';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function StockLedger() {
  const ledger = useSelector(state => state.stockLedger.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const uoms = useSelector(state => state.invUom.data) || [];
  const users = useSelector(state => state.users.data) || [];
  
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Sort descending by date
  const sortedLedger = [...ledger].sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

  const filteredLedger = sortedLedger.filter(entry => 
    !search || 
    entry.itemName?.toLowerCase().includes(search.toLowerCase()) ||
    entry.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
    entry.referenceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLedger.length / itemsPerPage);
  const paginatedLedger = filteredLedger.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock Ledger" 
        breadcrumbs="Inventory / Stock Ledger"
      />

      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-80">
            <SearchInput 
              placeholder="Search by item name, code, or ref..." 
              value={search} 
              onChange={handleSearchChange} 
              onClear={() => { setSearch(''); setCurrentPage(1); }}
            />
          </div>
        </div>
        <div className="overflow-x-auto w-full">
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
              {paginatedLedger.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <EmptyState 
                      icon={FileText} 
                      title={search ? "No matches found" : "No Transactions"} 
                      description={search ? "Try adjusting your search." : "No stock ledger entries exist yet."} 
                    />
                  </td>
                </tr>
              ) : (
                paginatedLedger.map(entry => {
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
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </Card>
    </div>
  );
}
