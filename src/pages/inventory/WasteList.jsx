import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Trash2, Plus, Eye } from 'lucide-react';

const STATUS_VARIANT = { DRAFT: 'secondary', CONFIRMED: 'success', CANCELLED: 'danger' };
const REASON_LABELS = { EXPIRED: 'Expired', SPOILED: 'Spoiled', DAMAGED: 'Damaged', QUALITY_ISSUE: 'Quality Issue', OTHER: 'Other' };

export function WasteList() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const wastes = useSelector(state => state.invWaste.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const isGM = currentUser?.role === 'GM';

  const getLocation = id => locations.find(l => l.id === id)?.name || '—';
  const sorted = [...wastes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste Records"
        breadcrumbs="Inventory / Waste"
        actions={!isGM && (
          <Button onClick={() => navigate('/inventory/waste/new')}>
            <Plus className="w-4 h-4 mr-2" />Record Waste
          </Button>
        )}
      />
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead><tr>
              <Table.Th>Waste No.</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Location</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Items</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th align="right">Action</Table.Th>
            </tr></thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan="7"><EmptyState icon={Trash2} title="No waste records" description="Record waste items here." /></td></tr>
              ) : sorted.map(w => (
                <tr key={w.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/inventory/waste/${w.id}`)}>
                  <Table.Td className="font-semibold">{w.wasteNumber}</Table.Td>
                  <Table.Td>{new Date(w.wasteDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>{getLocation(w.locationId)}</Table.Td>
                  <Table.Td><Badge variant="warning">{REASON_LABELS[w.reason] || w.reason}</Badge></Table.Td>
                  <Table.Td>{w.items?.length || 0}</Table.Td>
                  <Table.Td><Badge variant={STATUS_VARIANT[w.status]}>{w.status}</Badge></Table.Td>
                  <Table.Td align="right" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/inventory/waste/${w.id}`)}><Eye className="w-4 h-4" /></Button>
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
