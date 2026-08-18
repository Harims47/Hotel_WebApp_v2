import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { invLocationsActions } from '../../features/inventory/inventorySlices';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/ui/Pagination';
import { Plus, Power, PowerOff, MapPin } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function LocationsMaster() {
  const dispatch = useDispatch();
  const locations = useSelector(state => state.invLocations.data);
  const { currentUser } = useSelector(state => state.auth);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [formData, setFormData] = useState({ code: '', name: '', type: 'STORE', description: '' });

  const isGM = currentUser?.role === 'GM';

  const filteredLocations = locations.filter(l => 
    !search || 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const paginatedLocations = filteredLocations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };


  const resetForm = () => {
    setFormData({ code: '', name: '', type: 'STORE', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (loc) => {
    if (isGM) return;
    setFormData({ code: loc.code, name: loc.name, type: loc.type, description: loc.description || '' });
    setEditingId(loc.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (isGM) return;
    if (!formData.code || !formData.name || !formData.type) return toast.error('Code, Name, and Type are required');

    const isCodeDuplicate = locations.some(l => l.code.toLowerCase() === formData.code.toLowerCase() && l.id !== editingId);
    if (isCodeDuplicate) return toast.error('Location Code must be unique');

    if (editingId) {
      dispatch(invLocationsActions.updateRecord({ id: editingId, ...formData }));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'LOCATION_UPDATED',
        entityType: 'INV_LOCATION', entityId: editingId, description: `Updated location ${formData.name}`,
        createdAt: new Date().toISOString()
      }));
      toast.success('Location updated');
    } else {
      const newId = `loc-${uuidv4().substring(0,6)}`;
      dispatch(invLocationsActions.createRecord({ 
        id: newId, ...formData, status: 'ACTIVE'
      }));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'LOCATION_CREATED',
        entityType: 'INV_LOCATION', entityId: newId, description: `Created location ${formData.name}`,
        createdAt: new Date().toISOString()
      }));
      toast.success('Location created');
    }
    resetForm();
  };

  const toggleStatus = (loc) => {
    if (isGM) return;
    const newStatus = (!loc.status || loc.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
    dispatch(invLocationsActions.updateRecordStatus({ id: loc.id, status: newStatus }));
    dispatch(logAction({
      id: `log-${uuidv4()}`, userId: currentUser?.id, 
      action: newStatus === 'ACTIVE' ? 'LOCATION_ACTIVATED' : 'LOCATION_DEACTIVATED',
      entityType: 'INV_LOCATION', entityId: loc.id, 
      description: `Location ${loc.name} ${newStatus.toLowerCase()}`,
      createdAt: new Date().toISOString()
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Location Master" 
        breadcrumbs="Inventory / Locations"
        actions={
          !isGM && (
            <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          )
        }
      />

      {showForm && !isGM && (
        <Card className="animate-in fade-in slide-in-from-top-4">
          <CardHeader><CardTitle>{editingId ? 'Edit Location' : 'Create New Location'}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Location Code" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. LOC-MAIN" />
              <Input label="Location Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Select
                label="Type"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                options={[
                  { value: 'STORE', label: 'Store' },
                  { value: 'KITCHEN', label: 'Kitchen' },
                  { value: 'COLD_STORAGE', label: 'Cold Storage' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
              <Input label="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave}>{editingId ? 'Update' : 'Save'} Location</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-72">
            <SearchInput 
              placeholder="Search locations..." 
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
                <Table.Th>Code</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                {!isGM && <Table.Th align="right">Actions</Table.Th>}
              </tr>
            </thead>
            <tbody>
              {paginatedLocations.length === 0 ? (
                <tr>
                  <td colSpan={isGM ? 5 : 6}>
                    <EmptyState icon={MapPin} title="No locations found" description="Try adjusting your search criteria." />
                  </td>
                </tr>
              ) : (
                paginatedLocations.map(loc => (
                  <tr key={loc.id} className={!isGM ? "cursor-pointer hover:bg-gray-50" : ""} onClick={() => handleEdit(loc)}>
                    <Table.Td className="font-semibold text-text-main whitespace-nowrap">{loc.code}</Table.Td>
                    <Table.Td className="font-bold text-text-main whitespace-nowrap">{loc.name}</Table.Td>
                    <Table.Td className="text-text-muted">{loc.type}</Table.Td>
                    <Table.Td className="text-text-muted truncate max-w-xs">{loc.description || '-'}</Table.Td>
                    <Table.Td>
                      <Badge variant={(!loc.status || loc.status === 'ACTIVE') ? 'success' : 'danger'}>
                        {(!loc.status || loc.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </Table.Td>
                    {!isGM && (
                      <Table.Td align="right" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleStatus(loc); }} className={(!loc.status || loc.status === 'ACTIVE') ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'}>
                          {(!loc.status || loc.status === 'ACTIVE') ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                      </Table.Td>
                    )}
                  </tr>
                ))
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
