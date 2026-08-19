import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { invUomActions } from '../../features/inventory/inventorySlices';
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
import { Plus, Power, PowerOff, Scale } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function UomMaster() {
  const dispatch = useDispatch();
  const uoms = useSelector(state => state.invUom.data);
  const { currentUser } = useSelector(state => state.auth);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [formData, setFormData] = useState({ code: '', name: '', type: 'WEIGHT' });

  const isGM = currentUser?.role === 'GM';

  const filteredUoms = uoms.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUoms.length / itemsPerPage);
  const paginatedUoms = filteredUoms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };


  const resetForm = () => {
    setFormData({ code: '', name: '', type: 'WEIGHT' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (uom) => {
    if (isGM) return;
    setFormData({ code: uom.code, name: uom.name, type: uom.type });
    setEditingId(uom.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (isGM) return;
    if (!formData.code || !formData.name || !formData.type) return toast.error('All fields are required');

    const isCodeDuplicate = uoms.some(u => u.code.toLowerCase() === formData.code.toLowerCase() && u.id !== editingId);
    if (isCodeDuplicate) return toast.error('UOM Code must be unique');

    if (editingId) {
      dispatch(invUomActions.updateRecord({ id: editingId, ...formData }));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'UOM_UPDATED',
        entityType: 'INV_UOM', entityId: editingId, description: `Updated UOM ${formData.name}`,
        createdAt: new Date().toISOString()
      }));
      toast.success('UOM updated');
    } else {
      const newId = `uom-${uuidv4().substring(0, 6)}`;
      dispatch(invUomActions.createRecord({
        id: newId, ...formData, status: 'ACTIVE'
      }));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'UOM_CREATED',
        entityType: 'INV_UOM', entityId: newId, description: `Created UOM ${formData.name}`,
        createdAt: new Date().toISOString()
      }));
      toast.success('UOM created');
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="UOM Master"
        breadcrumbs="Inventory / UOM"
        actions={
          !isGM && (
            <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add UOM
            </Button>
          )
        }
      />

      {showForm && !isGM && (
        <Card className="animate-in fade-in slide-in-from-top-4">
          <CardHeader><CardTitle>{editingId ? 'Edit UOM' : 'Create New UOM'}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="UOM Code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. KG" />
              <Input label="UOM Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Kilogram" />
              <Select
                label="Type"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'WEIGHT', label: 'Weight' },
                  { value: 'VOLUME', label: 'Volume' },
                  { value: 'COUNT', label: 'Count' },
                  { value: 'PACKAGING', label: 'Packaging' },
                ]}
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave}>{editingId ? 'Update' : 'Save'} UOM</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-72">
            <SearchInput
              placeholder="Search UOM..."
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
                <Table.Th>Status</Table.Th>
              </tr>
            </thead>
            <tbody>
              {paginatedUoms.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState icon={Scale} title="No UOM found" description="Try adjusting your search criteria." />
                  </td>
                </tr>
              ) : (
                paginatedUoms.map(uom => (
                  <tr key={uom.id} className={!isGM ? "cursor-pointer hover:bg-gray-50" : ""} onClick={() => handleEdit(uom)}>
                    <Table.Td className="font-semibold text-text-main whitespace-nowrap">{uom.code}</Table.Td>
                    <Table.Td className="font-bold text-text-main whitespace-nowrap">{uom.name}</Table.Td>
                    <Table.Td className="text-text-muted">{uom.type}</Table.Td>
                    <Table.Td>
                      <Badge variant={(!uom.status || uom.status === 'ACTIVE') ? 'success' : 'danger'}>
                        {(!uom.status || uom.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </Table.Td>
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
