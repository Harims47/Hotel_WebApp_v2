import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { invItemsActions } from '../../features/inventory/inventorySlices';
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
import { Plus, Power, PowerOff, Package } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function ItemsMaster() {
  const dispatch = useDispatch();
  const items = useSelector(state => state.invItems.data);
  const categories = useSelector(state => state.invCategories.data);
  const uoms = useSelector(state => state.invUom.data);
  const suppliers = useSelector(state => state.invSuppliers.data);
  const { currentUser } = useSelector(state => state.auth);

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ 
    code: '', name: '', categoryId: '', baseUomId: '', purchaseUomId: '', 
    conversionFactor: 1, reorderLevel: 0, minimumStock: 0, maximumStock: 0, preferredSupplierId: ''
  });

  const isGM = currentUser?.role === 'GM';

  const activeCategories = categories.filter(c => !c.status || c.status === 'ACTIVE');
  const activeUoms = uoms.filter(u => !u.status || u.status === 'ACTIVE');
  const activeSuppliers = suppliers.filter(s => !s.status || s.status === 'ACTIVE');

  const filteredItems = items.filter(i => 
    !search || 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.code.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ 
      code: '', name: '', categoryId: '', baseUomId: '', purchaseUomId: '', 
      conversionFactor: 1, reorderLevel: 0, minimumStock: 0, maximumStock: 0, preferredSupplierId: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item) => {
    if (isGM) return;
    setFormData({ 
      code: item.code, name: item.name, categoryId: item.categoryId, 
      baseUomId: item.baseUomId, purchaseUomId: item.purchaseUomId, 
      conversionFactor: item.conversionFactor, reorderLevel: item.reorderLevel, 
      minimumStock: item.minimumStock, maximumStock: item.maximumStock, 
      preferredSupplierId: item.preferredSupplierId || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (isGM) return;
    if (!formData.code || !formData.name || !formData.categoryId || !formData.baseUomId || !formData.purchaseUomId) {
      return toast.error('Code, Name, Category, and UOMs are required');
    }
    
    if (formData.conversionFactor <= 0) return toast.error('Conversion factor must be > 0');
    if (formData.reorderLevel < 0 || formData.minimumStock < 0) return toast.error('Stock levels cannot be negative');
    if (Number(formData.maximumStock) > 0 && Number(formData.maximumStock) < Number(formData.minimumStock)) {
      return toast.error('Maximum stock cannot be less than minimum stock');
    }

    const isCodeDuplicate = items.some(i => i.code.toLowerCase() === formData.code.toLowerCase() && i.id !== editingId);
    if (isCodeDuplicate) return toast.error('Item Code must be unique');

    const payload = {
      ...formData,
      conversionFactor: Number(formData.conversionFactor),
      reorderLevel: Number(formData.reorderLevel),
      minimumStock: Number(formData.minimumStock),
      maximumStock: Number(formData.maximumStock),
    };

    if (editingId) {
      dispatch(invItemsActions.updateRecord({ id: editingId, ...payload }));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'INVENTORY_ITEM_UPDATED',
        entityType: 'INV_ITEM', entityId: editingId, description: `Updated item ${formData.name}`,
        createdAt: new Date().toISOString()
      }));
      toast.success('Item updated');
    } else {
      const newId = `inv-${uuidv4().substring(0,6)}`;
      dispatch(invItemsActions.createRecord({ 
        id: newId, ...payload, status: 'ACTIVE', createdAt: new Date().toISOString() 
      }));
      dispatch(logAction({
        id: `log-${uuidv4()}`, userId: currentUser?.id, action: 'INVENTORY_ITEM_CREATED',
        entityType: 'INV_ITEM', entityId: newId, description: `Created item ${formData.name}`,
        createdAt: new Date().toISOString()
      }));
      toast.success('Item created');
    }
    resetForm();
  };

  const toggleStatus = (item) => {
    if (isGM) return;
    const newStatus = (!item.status || item.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
    dispatch(invItemsActions.updateRecordStatus({ id: item.id, status: newStatus }));
    dispatch(logAction({
      id: `log-${uuidv4()}`, userId: currentUser?.id, 
      action: newStatus === 'ACTIVE' ? 'INVENTORY_ITEM_ACTIVATED' : 'INVENTORY_ITEM_DEACTIVATED',
      entityType: 'INV_ITEM', entityId: item.id, 
      description: `Item ${item.name} ${newStatus.toLowerCase()}`,
      createdAt: new Date().toISOString()
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Item Master" 
        breadcrumbs="Inventory / Items"
        actions={
          !isGM && (
            <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          )
        }
      />

      {showForm && !isGM && (
        <Card className="animate-in fade-in slide-in-from-top-4">
          <CardHeader><CardTitle>{editingId ? 'Edit Item' : 'Create New Item'}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Item Code" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. ITEM-001" />
              <Input label="Item Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Select label="Select" hideLabel 
                label="Category" 
                value={formData.categoryId} 
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                options={[{value:'', label:'Select Category'}, ...activeCategories.map(c => ({ value: c.id, label: c.name }))]}
              />
              <Select label="Select" hideLabel 
                label="Preferred Supplier" 
                value={formData.preferredSupplierId} 
                onChange={e => setFormData({...formData, preferredSupplierId: e.target.value})}
                options={[{value:'', label:'None'}, ...activeSuppliers.map(s => ({ value: s.id, label: s.name }))]}
              />
              
              <Select label="Select" hideLabel 
                label="Base UOM" 
                value={formData.baseUomId} 
                onChange={e => setFormData({...formData, baseUomId: e.target.value})}
                options={[{value:'', label:'Select UOM'}, ...activeUoms.map(u => ({ value: u.id, label: `${u.name} (${u.code})` }))]}
              />
              <Select label="Select" hideLabel 
                label="Purchase UOM" 
                value={formData.purchaseUomId} 
                onChange={e => setFormData({...formData, purchaseUomId: e.target.value})}
                options={[{value:'', label:'Select UOM'}, ...activeUoms.map(u => ({ value: u.id, label: `${u.name} (${u.code})` }))]}
              />
              <div className="md:col-span-2">
                <Input label="Conversion Factor (Purchase UOM = X Base UOM)" type="number" step="0.01" value={formData.conversionFactor} onChange={e => setFormData({...formData, conversionFactor: e.target.value})} />
              </div>

              <Input label="Minimum Stock" type="number" value={formData.minimumStock} onChange={e => setFormData({...formData, minimumStock: e.target.value})} />
              <Input label="Maximum Stock" type="number" value={formData.maximumStock} onChange={e => setFormData({...formData, maximumStock: e.target.value})} />
              <Input label="Reorder Level" type="number" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave}>{editingId ? 'Update' : 'Save'} Item</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-full md:w-96">
            <SearchInput 
              placeholder="Search by code or name..." 
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
                <Table.Th>Item Name</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Base UOM</Table.Th>
                <Table.Th>Purchase UOM</Table.Th>
                <Table.Th>Status</Table.Th>
                {!isGM && <Table.Th align="right">Actions</Table.Th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={isGM ? 5 : 6}>
                    <EmptyState icon={Package} title="No items found" description="Try adjusting your search criteria." />
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const category = categories.find(c => c.id === item.categoryId);
                  const baseUom = uoms.find(u => u.id === item.baseUomId);
                  
                  return (
                    <tr key={item.id} className={!isGM ? "cursor-pointer hover:bg-gray-50" : ""} onClick={() => handleEdit(item)}>
                      <Table.Td className="font-semibold text-text-main whitespace-nowrap">{item.code}</Table.Td>
                      <Table.Td className="font-bold text-text-main whitespace-nowrap">{item.name}</Table.Td>
                      <Table.Td className="text-text-muted whitespace-nowrap">{category ? category.name : '-'}</Table.Td>
                      <Table.Td className="whitespace-nowrap">
                        <div className="text-xs">
                          <div className="font-medium text-text-main">Base: {baseUom ? baseUom.code : '-'}</div>
                          {(() => {
                            const purchaseUom = uoms.find(u => u.id === item.purchaseUomId);
                            return purchaseUom ? (
                              <div className="text-text-muted">Buy: {purchaseUom.code} × {item.conversionFactor}</div>
                            ) : null;
                          })()}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant={(!item.status || item.status === 'ACTIVE') ? 'success' : 'danger'}>
                          {(!item.status || item.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </Table.Td>
                      {!isGM && (
                        <Table.Td align="right" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleStatus(item); }} className={(!item.status || item.status === 'ACTIVE') ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'}>
                            {(!item.status || item.status === 'ACTIVE') ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                        </Table.Td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
