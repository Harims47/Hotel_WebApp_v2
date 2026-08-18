import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchInput } from '../../components/ui/SearchInput';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { Truck, Plus, Eye, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function GRNList() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const grns = useSelector(state => state.grn.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const purchaseOrders = useSelector(state => state.purchaseOrders.data) || [];
  
  const isGM = currentUser?.role === 'GM';

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  const sortedGRNs = [...grns].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filteredGRNs = sortedGRNs.filter(grn => 
    !search || 
    grn.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
    grn.supplierSnapshot?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGRNs.length / itemsPerPage);
  const paginatedGRNs = filteredGRNs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Goods Received Notes" 
        breadcrumbs="Inventory / GRN"
        actions={
          !isGM && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/inventory/purchase-orders')}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Receive PO
              </Button>
              <Button onClick={() => navigate('/inventory/grn/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Direct Purchase
              </Button>
            </div>
          )
        }
      />

      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-80">
            <SearchInput 
              placeholder="Search by GRN number or supplier..." 
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
                <Table.Th>GRN Number</Table.Th>
                <Table.Th>PO / Reference</Table.Th>
                <Table.Th>Supplier</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Location</Table.Th>
                <Table.Th>Total Amount</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th align="right">Actions</Table.Th>
              </tr>
            </thead>
            <tbody>
              {paginatedGRNs.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <EmptyState 
                      icon={Truck} 
                      title={search ? "No matches found" : "No GRNs"} 
                      description={search ? "Try adjusting your search." : "You haven't received any goods yet."} 
                    />
                  </td>
                </tr>
              ) : (
                paginatedGRNs.map(grn => {
                  const location = locations.find(l => l.id === grn.locationId);
                  const po = purchaseOrders.find(p => p.id === grn.poId);
                  const reference = po ? po.poNumber : 'Direct Purchase';
                  
                  // Calculate total amount from items
                  const total = grn.items.reduce((sum, item) => sum + (item.amount || 0), 0);

                  return (
                    <tr key={grn.id}>
                      <Table.Td className="font-bold text-text-main">{grn.grnNumber}</Table.Td>
                      <Table.Td>{reference}</Table.Td>
                      <Table.Td>{grn.supplierSnapshot}</Table.Td>
                      <Table.Td>{new Date(grn.grnDate).toLocaleDateString()}</Table.Td>
                      <Table.Td>{location?.name || 'Unknown'}</Table.Td>
                      <Table.Td className="font-medium">{formatCurrency(total)}</Table.Td>
                      <Table.Td>
                        <Badge variant={getStatusBadgeVariant(grn.status)}>
                          {grn.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td align="right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/inventory/grn/${grn.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
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
