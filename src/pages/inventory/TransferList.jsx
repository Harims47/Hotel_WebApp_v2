import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ArrowRightLeft, Plus, Eye } from 'lucide-react';

const STATUS_VARIANT = { DRAFT: 'secondary', CONFIRMED: 'success', CANCELLED: 'danger' };

export function TransferList() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const transfers = useSelector(state => state.invTransfers.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const isGM = currentUser?.role === 'GM';

  const getLocation = id => locations.find(l => l.id === id)?.name || '—';
  const sorted = [...transfers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
        <div className="overflow-x-auto">
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
              {sorted.length === 0 ? (
                <tr><td colSpan="7"><EmptyState icon={ArrowRightLeft} title="No transfers yet" description="Transfer stock between locations." /></td></tr>
              ) : sorted.map(t => (
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
      </Card>
    </div>
  );
}
