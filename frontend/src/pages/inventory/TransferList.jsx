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
import { ArrowRightLeft, Plus, Eye } from 'lucide-react';

const STATUS_VARIANT = { DRAFT: 'secondary', CONFIRMED: 'success', CANCELLED: 'danger' };

export function TransferList() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const transfers = useSelector(state => state.invTransfers.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const isGM = currentUser?.role === 'GM';

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const getLocation = id => locations.find(l => l.id === id)?.name || '—';
  const sorted = [...transfers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filtered = sorted.filter(t => 
    !search || 
    t.transferNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Transfers"
        breadcrumbs="Inventory / Transfers"
        actions={!isGM && (
          <Button onClick={() => navigate('/inventory/transfers/new')}>
            <Plus className="w-4 h-4 mr-2" />New Transfer
          </Button>
        )}
      />
      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-80">
            <SearchInput 
              placeholder="Search by transfer number..." 
              value={search} 
              onChange={handleSearchChange} 
              onClear={() => { setSearch(''); setCurrentPage(1); }}
            />
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <Table>
            <thead><tr>
              <Table.Th>Transfer No.</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>From</Table.Th>
              <Table.Th>To</Table.Th>
              <Table.Th>Items</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th align="right">Action</Table.Th>
            </tr></thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan="7"><EmptyState icon={ArrowRightLeft} title={search ? "No matches found" : "No transfers yet"} description={search ? "Try adjusting your search." : "Transfer stock between locations."} /></td></tr>
              ) : paginated.map(t => (
                <tr key={t.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/inventory/transfers/${t.id}`)}>
                  <Table.Td className="font-semibold">{t.transferNumber}</Table.Td>
                  <Table.Td>{new Date(t.transferDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>{getLocation(t.fromLocationId)}</Table.Td>
                  <Table.Td>{getLocation(t.toLocationId)}</Table.Td>
                  <Table.Td>{t.items?.length || 0}</Table.Td>
                  <Table.Td><Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge></Table.Td>
                  <Table.Td align="right" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/inventory/transfers/${t.id}`)}><Eye className="w-4 h-4" /></Button>
                  </Table.Td>
                </tr>
              ))}
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
