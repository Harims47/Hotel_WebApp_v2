import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { invCategoriesActions } from '../../features/inventory/inventorySlices';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Plus, Power, PowerOff, Tags } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function CategoriesMaster() {
  const dispatch = useDispatch();
  const categories = useSelector(state => state.invCategories.data);
  const { currentUser } = useSelector(state => state.auth);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ code: '', name: '', description: '' });

  const isGM = currentUser?.role === 'GM';

  const filteredCategories = categories.filter(c => 
    !search || 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ code: '', name: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (cat) => {
    if (isGM) return;
    setFormData({ code: cat.code, name: cat.name, description: cat.description || '' });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (isGM) return;
    if (!formData.code || !formData.name) return toast.error('Code and Name are required');

    const isCodeDuplicate = categories.some(c => c.code.toLowerCase() === formData.code.toLowerCase() && c.id !== editingId);
    if (isCodeDuplicate) return toast.error('Category Code must be unique');

    if (editingId) {
      dispatch(invCategoriesActions.updateRecord({ id: editingId, ...formData }));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'CATEGORY_UPDATED',
        entityType: 'INV_CATEGORY', entityId: editingId, description: `Updated category ${formData.name}`,
        createdAt: new Date().toISOString()
      }));
      toast.success('Category updated');
    } else {
      const newId = `ic-${uuidv4().substring(0,6)}`;
      dispatch(invCategoriesActions.createRecord({ 
        id: newId, ...formData, status: 'ACTIVE', createdAt: new Date().toISOString() 
      }));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'CATEGORY_CREATED',
        entityType: 'INV_CATEGORY', entityId: newId, description: `Created category ${formData.name}`,
        createdAt: new Date().toISOString()
      }));
      toast.success('Category created');
    }
    resetForm();
  };

  const toggleStatus = (cat) => {
    if (isGM) return;
    const newStatus = (!cat.status || cat.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
    dispatch(invCategoriesActions.updateRecordStatus({ id: cat.id, status: newStatus }));
    dispatch(logAction({
      id: `log-${uuidv4()}`, userId: currentUser?.id, 
      action: newStatus === 'ACTIVE' ? 'CATEGORY_ACTIVATED' : 'CATEGORY_DEACTIVATED',
      entityType: 'INV_CATEGORY', entityId: cat.id, 
      description: `Category ${cat.name} ${newStatus.toLowerCase()}`,
      createdAt: new Date().toISOString()
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Category Master" 
        breadcrumbs="Inventory / Categories"
        actions={
          !isGM && (
            <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          )
        }
      />

      {showForm && !isGM && (
        <Card className="animate-in fade-in slide-in-from-top-4">
          <CardHeader><CardTitle>{editingId ? 'Edit Category' : 'Create New Category'}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Category Code" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. CAT-GRO" />
              <Input label="Category Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input label="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave}>{editingId ? 'Update' : 'Save'} Category</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-72">
            <SearchInput 
              placeholder="Search categories..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onClear={() => setSearch('')}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto w-full">
          <Table>
            <thead>
              <tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                {!isGM && <Table.Th align="right">Actions</Table.Th>}
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={isGM ? 4 : 5}>
                    <EmptyState icon={Tags} title="No categories found" description="Try adjusting your search criteria." />
                  </td>
                </tr>
              ) : (
                filteredCategories.map(cat => (
                  <tr key={cat.id} className={!isGM ? "cursor-pointer hover:bg-gray-50" : ""} onClick={() => handleEdit(cat)}>
                    <Table.Td className="font-semibold text-text-main whitespace-nowrap">{cat.code}</Table.Td>
                    <Table.Td className="font-bold text-text-main whitespace-nowrap">{cat.name}</Table.Td>
                    <Table.Td className="text-text-muted">{cat.description || '-'}</Table.Td>
                    <Table.Td>
                      <Badge variant={(!cat.status || cat.status === 'ACTIVE') ? 'success' : 'danger'}>
                        {(!cat.status || cat.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </Table.Td>
                    {!isGM && (
                      <Table.Td align="right" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleStatus(cat); }} className={(!cat.status || cat.status === 'ACTIVE') ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'}>
                          {(!cat.status || cat.status === 'ACTIVE') ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                      </Table.Td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
