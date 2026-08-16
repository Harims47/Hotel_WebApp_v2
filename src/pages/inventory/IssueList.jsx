import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ArrowUpRight, Plus, Eye } from 'lucide-react';

const STATUS_VARIANT = { DRAFT: 'secondary', CONFIRMED: 'success', CANCELLED: 'danger' };

export function IssueList() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const issues = useSelector(state => state.invIssues.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];
  const isGM = currentUser?.role === 'GM';

  const getLocation = id => locations.find(l => l.id === id)?.name || id || '—';

  const sorted = [...issues].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Issues"
        breadcrumbs="Inventory / Issues"
        actions={!isGM && (
          <Button onClick={() => navigate('/inventory/issues/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Issue
          </Button>
        )}
      />
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Table.Th>Issue No.</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>From Location</Table.Th>
                <Table.Th>Department / To</Table.Th>
                <Table.Th>Items</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th align="right">Action</Table.Th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan="7">
                  <EmptyState icon={ArrowUpRight} title="No issues yet" description="Create a stock issue to record inventory movement." />
                </td></tr>
              ) : sorted.map(issue => (
                <tr key={issue.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/inventory/issues/${issue.id}`)}>
                  <Table.Td className="font-semibold text-text-main">{issue.issueNumber}</Table.Td>
                  <Table.Td>{new Date(issue.issueDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>{getLocation(issue.fromLocationId)}</Table.Td>
                  <Table.Td>{issue.department || getLocation(issue.toLocationId) || '—'}</Table.Td>
                  <Table.Td>{issue.items?.length || 0}</Table.Td>
                  <Table.Td><Badge variant={STATUS_VARIANT[issue.status]}>{issue.status}</Badge></Table.Td>
                  <Table.Td align="right" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/inventory/issues/${issue.id}`)}>
                      <Eye className="w-4 h-4" />
                    </Button>
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
