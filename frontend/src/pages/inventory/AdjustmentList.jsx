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
import { SlidersHorizontal, Plus, Eye } from 'lucide-react';

const STATUS_VARIANT = { DRAFT: 'secondary', CONFIRMED: 'success', CANCELLED: 'danger' };
const REASON_LABELS = { PHYSICAL_COUNT: 'Physical Count', DATA_ENTRY_ERROR: 'Data Entry Error', DAMAGE_NOT_RECORDED: 'Damage Not Recorded', OPENING_CORRECTION: 'Opening Correction', OTHER: 'Other' };

export function AdjustmentList() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const adjustments = useSelector(state => state.invAdjustments.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const isGM = currentUser?.role === 'GM';

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const getLocation = id => locations.find(l => l.id === id)?.name || '—';
  const sorted = [...adjustments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filtered = sorted.filter(a => 
    !search || 
    a.adjustmentNumber.toLowerCase().includes(search.toLowerCase())
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
        title="Stock Adjustments"
        breadcrumbs="Inventory / Adjustments"
        actions={!isGM && (
          <Button onClick={() => navigate('/inventory/adjustments/new')}>
            <Plus className="w-4 h-4 mr-2" />New Adjustment
          </Button>
        )}
      />
      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-80">
            <SearchInput 
              placeholder="Search by adjustment number..." 
              value={search} 
              onChange={handleSearchChange} 
              onClear={() => { setSearch(''); setCurrentPage(1); }}
            />
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <Table>
            <thead><tr>
              <Table.Th>Adjustment No.</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Items</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th align="right">Action</Table.Th>
            </tr></thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan="7"><EmptyState icon={SlidersHorizontal} title={search ? "No matches found" : "No adjustments"} description={search ? "Try adjusting your search." : "Adjust system stock to match physical stock."} /></td></tr>
              ) : paginated.map(a => (
                <tr key={a.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/inventory/adjustments/${a.id}`)}>
                  <Table.Td className="font-semibold">{a.adjustmentNumber}</Table.Td>
                  <Table.Td>{new Date(a.adjustmentDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>{getLocation(a.locationId)}</Table.Td>
                  <Table.Td>{REASON_LABELS[a.reason] || a.reason}</Table.Td>
                  <Table.Td>{a.items?.length || 0}</Table.Td>
                  <Table.Td><Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge></Table.Td>
                  <Table.Td align="right" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/inventory/adjustments/${a.id}`)}><Eye className="w-4 h-4" /></Button>
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
