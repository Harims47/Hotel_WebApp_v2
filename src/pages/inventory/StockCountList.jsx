import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Plus, Eye } from 'lucide-react';

export function StockCountList() {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.auth);
  const stockCounts = useSelector(state => state.invStockCounts.data) || [];
  const locations = useSelector(state => state.invLocations.data) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

  const filteredCounts = stockCounts.filter(sc => {
    const matchesSearch = sc.countNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sc.status === statusFilter;
    const matchesLocation = locationFilter === 'ALL' || sc.locationId === locationFilter;
    return matchesSearch && matchesStatus && matchesLocation;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getLocationName = id => locations.find(l => l.id === id)?.name || 'Unknown';

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  const isGM = currentUser?.role === 'GM';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Counts"
        breadcrumbs="Inventory / Stock Counts"
        actions={
          !isGM && (
            <Button onClick={() => navigate('/inventory/stock-counts/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Stock Count
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput 
                placeholder="Search count number..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'CONFIRMED', label: 'Confirmed' },
                  { value: 'CANCELLED', label: 'Cancelled' }
                ]}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                label="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Locations' },
                  ...locations.map(l => ({ value: l.id, label: l.name }))
                ]}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Table.Th>Count Number</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Items Counted</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th className="text-right">Actions</Table.Th>
                </tr>
              </thead>
              <tbody>
                {filteredCounts.length === 0 ? (
                  <tr>
                    <Table.Td colSpan={6} className="text-center py-8 text-text-muted">
                      No stock counts found.
                    </Table.Td>
                  </tr>
                ) : (
                  filteredCounts.map((sc) => (
                    <tr key={sc.id}>
                      <Table.Td className="font-medium text-text-main">
                        {sc.countNumber}
                      </Table.Td>
                      <Table.Td>{new Date(sc.countDate).toLocaleDateString()}</Table.Td>
                      <Table.Td>{getLocationName(sc.locationId)}</Table.Td>
                      <Table.Td>{sc.items?.length || 0} items</Table.Td>
                      <Table.Td>
                        <Badge variant={getStatusBadgeVariant(sc.status)}>
                          {sc.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/inventory/stock-counts/${sc.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Table.Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
