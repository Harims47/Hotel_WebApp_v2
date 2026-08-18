import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { invSuppliersActions } from '../../features/inventory/inventorySlices';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Plus, Power, PowerOff, Building2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function SuppliersMaster() {
  const dispatch = useDispatch();
  const suppliers = useSelector(state => state.invSuppliers.data);
  const categories = useSelector(state => state.invCategories.data);
  const { currentUser } = useSelector(state => state.auth);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [formData, setFormData] = useState({ 
    code: '', name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '', suppliedCategoryIds: []
  });

  const isGM = currentUser?.role === 'GM';

  const filteredSuppliers = suppliers.filter(s => 
    !search || 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({ code: '', name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '', suppliedCategoryIds: [] });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (sup) => {
    if (isGM) return;
    setFormData({ 
      code: sup.code, name: sup.name, contactPerson: sup.contactPerson || '', 
      phone: sup.phone || '', email: sup.email || '', address: sup.address || '', 
      gstNumber: sup.gstNumber || '', suppliedCategoryIds: sup.suppliedCategoryIds || [] 
    });
    setEditingId(sup.id);
    setShowForm(true);
  };

  const handleCategoryToggle = (catId) => {
    setFormData(prev => ({
      ...prev,
      suppliedCategoryIds: prev.suppliedCategoryIds.includes(catId) 
        ? prev.suppliedCategoryIds.filter(id => id !== catId)
        : [...prev.suppliedCategoryIds, catId]
    }));
  };

  const handleSave = () => {
    if (isGM) return;
    if (!formData.code || !formData.name) return toast.error('Code and Name are required');

    const isCodeDuplicate = suppliers.some(s => s.code.toLowerCase() === formData.code.toLowerCase() && s.id !== editingId);
    if (isCodeDuplicate) return toast.error('Supplier Code must be unique');

    if (editingId) {
      dispatch(invSuppliersActions.updateRecord({ id: editingId, ...formData }));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'SUPPLIER_UPDATED',
        entityType: 'INV_SUPPLIER', entityId: editingId, description: `Updated supplier ${formData.name}`,
        createdAt: new Date().toISOString()
      }));
      toast.success('Supplier updated');
    } else {
      const newId = `sup-${uuidv4().substring(0,6)}`;
      dispatch(invSuppliersActions.createRecord({ 
        id: newId, ...formData, status: 'ACTIVE', createdAt: new Date().toISOString() 
      }));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'SUPPLIER_CREATED',
        entityType: 'INV_SUPPLIER', entityId: newId, description: `Created supplier ${formData.name}`,
        createdAt: new Date().toISOString()
      }));
      toast.success('Supplier created');
    }
    resetForm();
  };

  const toggleStatus = (sup) => {
    if (isGM) return;
    const newStatus = (!sup.status || sup.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
    dispatch(invSuppliersActions.updateRecordStatus({ id: sup.id, status: newStatus }));
    dispatch(logAction({
      id: `log-${uuidv4()}`, userId: currentUser?.id, 
      action: newStatus === 'ACTIVE' ? 'SUPPLIER_ACTIVATED' : 'SUPPLIER_DEACTIVATED',
      entityType: 'INV_SUPPLIER', entityId: sup.id, 
      description: `Supplier ${sup.name} ${newStatus.toLowerCase()}`,
      createdAt: new Date().toISOString()
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Supplier Master" 
        breadcrumbs="Inventory / Suppliers"
        actions={
          !isGM && (
            <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          )
        }
      />

      {showForm && !isGM && (
        <Card className="animate-in fade-in slide-in-from-top-4">
          <CardHeader><CardTitle>{editingId ? 'Edit Supplier' : 'Create New Supplier'}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Supplier Code" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. SUP-001" />
              <Input label="Supplier Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input label="Contact Person" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
              <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input label="GST Number" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
              <div className="md:col-span-2">
                <Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-text-main mb-2">Supplied Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      formData.suppliedCategoryIds.includes(cat.id)
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-border text-text-muted hover:border-primary/50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave}>{editingId ? 'Update' : 'Save'} Supplier</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-96">
            <SearchInput 
              placeholder="Search by code, name, person, or phone..." 
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
                <Table.Th>Supplier Details</Table.Th>
                <Table.Th>Contact</Table.Th>
                <Table.Th>Status</Table.Th>
                {!isGM && <Table.Th align="right">Actions</Table.Th>}
              </tr>
            </thead>
            <tbody>
              {paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={isGM ? 4 : 5}>
                    <EmptyState icon={Building2} title="No suppliers found" description="Try adjusting your search criteria." />
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map(sup => (
                  <tr key={sup.id} className={!isGM ? "cursor-pointer hover:bg-gray-50" : ""} onClick={() => handleEdit(sup)}>
                    <Table.Td className="font-semibold text-text-main whitespace-nowrap">{sup.code}</Table.Td>
                    <Table.Td>
                      <p className="font-bold text-text-main whitespace-nowrap">{sup.name}</p>
                      {sup.gstNumber && <p className="text-xs text-text-muted">GST: {sup.gstNumber}</p>}
                    </Table.Td>
                    <Table.Td>
                      <p className="text-sm font-medium text-text-main whitespace-nowrap">{sup.contactPerson || 'N/A'}</p>
                      <p className="text-xs text-text-muted whitespace-nowrap">{sup.phone || '-'}</p>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant={(!sup.status || sup.status === 'ACTIVE') ? 'success' : 'danger'}>
                        {(!sup.status || sup.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </Table.Td>
                    {!isGM && (
                      <Table.Td align="right" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleStatus(sup); }} className={(!sup.status || sup.status === 'ACTIVE') ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'}>
                          {(!sup.status || sup.status === 'ACTIVE') ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
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
