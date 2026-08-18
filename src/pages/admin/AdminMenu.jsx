import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createCategory, updateCategory, updateCategoryStatus, createMenuItem, updateMenuItem, updateMenuItemStatus } from '../../features/menu/menuSlice';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/ui/Pagination';
import { Plus, Power, PowerOff, ListOrdered, Utensils } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function AdminMenu() {
  const dispatch = useDispatch();
  const { categories, items } = useSelector(state => state.menu);
  const { currentUser } = useSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState('ITEMS');
  const [search, setSearch] = useState('');
  
  // Pagination state for items
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', displayOrder: categories.length + 1 });

  const [showCreateItem, setShowCreateItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', categoryId: categories[0]?.id || '', price: '', description: '', image: '' });
  const [priceEdits, setPriceEdits] = useState({});

  const filteredCategories = categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredItems = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCreateCategory = () => {
    if (!newCategory.name) return toast.error('Name required');
    const categoryToCreate = { id: `cat-${uuidv4().substring(0,6)}`, ...newCategory };
    dispatch(createCategory(categoryToCreate));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: 'MENU_CATEGORY_CREATED',
      entityType: 'MENU_CATEGORY',
      entityId: categoryToCreate.id,
      description: `Created category ${categoryToCreate.name}`,
      createdAt: new Date().toISOString()
    }));
    toast.success('Category created');
    setShowCreateCategory(false);
    setNewCategory({ name: '', displayOrder: categories.length + 2 });
  };

  const handleCreateItem = () => {
    if (!newItem.name || !newItem.categoryId || !newItem.price) return toast.error('Name, Category, and Price required');
    const itemToCreate = { id: `mi-${uuidv4().substring(0,6)}`, ...newItem, price: Number(newItem.price) };
    dispatch(createMenuItem(itemToCreate));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: 'MENU_ITEM_CREATED',
      entityType: 'MENU_ITEM',
      entityId: itemToCreate.id,
      description: `Created menu item ${itemToCreate.name}`,
      createdAt: new Date().toISOString()
    }));
    toast.success('Menu item created');
    setShowCreateItem(false);
    setNewItem({ name: '', categoryId: categories[0]?.id || '', price: '', description: '', image: '' });
  };

  const toggleCategoryStatus = (cat) => {
    const newStatus = (!cat.status || cat.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
    if (newStatus === 'INACTIVE' && !window.confirm(`Deactivate category ${cat.name}? It will hide all items in it for new orders.`)) return;
    dispatch(updateCategoryStatus({ id: cat.id, status: newStatus }));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: newStatus === 'ACTIVE' ? 'MENU_CATEGORY_ACTIVATED' : 'MENU_CATEGORY_DEACTIVATED',
      entityType: 'MENU_CATEGORY',
      entityId: cat.id,
      description: `Category ${cat.name} ${newStatus.toLowerCase()}`,
      createdAt: new Date().toISOString()
    }));
  };

  const toggleItemStatus = (item) => {
    const newStatus = (!item.status || item.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
    if (newStatus === 'INACTIVE' && !window.confirm(`Deactivate item ${item.name}? It will no longer appear for new orders.`)) return;
    dispatch(updateMenuItemStatus({ id: item.id, status: newStatus }));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: newStatus === 'ACTIVE' ? 'MENU_ITEM_ACTIVATED' : 'MENU_ITEM_DEACTIVATED',
      entityType: 'MENU_ITEM',
      entityId: item.id,
      description: `Menu item ${item.name} ${newStatus.toLowerCase()}`,
      createdAt: new Date().toISOString()
    }));
  };

  const changeItemPrice = (item, price) => {
    const newPrice = Number(price);
    setPriceEdits(prev => {
      const { [item.id]: _, ...rest } = prev;
      return rest;
    });
    if (Number.isNaN(newPrice) || newPrice === item.price) return;
    dispatch(updateMenuItem({ id: item.id, price: newPrice }));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: 'MENU_PRICE_CHANGED',
      entityType: 'MENU_ITEM',
      entityId: item.id,
      description: `Price of ${item.name} changed from ₹${item.price} to ₹${newPrice}`,
      createdAt: new Date().toISOString()
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Menu Management" 
        breadcrumbs="Admin / Menu"
        actions={
          <Button onClick={() => activeTab === 'CATEGORIES' ? setShowCreateCategory(!showCreateCategory) : setShowCreateItem(!showCreateItem)}>
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === 'CATEGORIES' ? 'Category' : 'Item'}
          </Button>
        }
      />

      <Tabs 
        tabs={[
          { id: 'ITEMS', label: 'Menu Items' },
          { id: 'CATEGORIES', label: 'Categories' }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      {activeTab === 'CATEGORIES' && showCreateCategory && (
        <Card className="animate-in fade-in slide-in-from-top-4">
          <CardHeader><CardTitle>Create New Category</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Category Name" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} />
              <Input type="number" label="Display Order" value={newCategory.displayOrder} onChange={e => setNewCategory({...newCategory, displayOrder: Number(e.target.value)})} />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCreateCategory(false)}>Cancel</Button>
              <Button onClick={handleCreateCategory}>Save Category</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'ITEMS' && showCreateItem && (
        <Card className="animate-in fade-in slide-in-from-top-4">
          <CardHeader><CardTitle>Create New Menu Item</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input label="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              <Select 
                label="Category" 
                value={newItem.categoryId} 
                onChange={e => setNewItem({...newItem, categoryId: e.target.value})}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
              />
              <Input type="number" label="Price (₹)" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Image Upload</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewItem({ ...newItem, image: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer pt-0.5"
                />
              </div>
              <Input label="Description" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCreateItem(false)}>Cancel</Button>
              <Button onClick={handleCreateItem}>Save Item</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-border bg-gray-50/50">
          <div className="w-72">
            <SearchInput 
              placeholder={`Search ${activeTab.toLowerCase()}...`} 
              value={search} 
              onChange={handleSearch} 
              onClear={() => { setSearch(''); setCurrentPage(1); }}
            />
          </div>
        </div>
        
        {activeTab === 'CATEGORIES' ? (
          <Table>
            <thead>
              <tr>
                <Table.Th>Order</Table.Th>
                <Table.Th>Category Name</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th align="right">Actions</Table.Th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <EmptyState icon={ListOrdered} title="No categories found" description="Try adjusting your search criteria or add a new category." />
                  </td>
                </tr>
              ) : (
                filteredCategories.map(cat => (
                  <tr key={cat.id}>
                    <Table.Td>
                      <input type="number" value={cat.displayOrder} onChange={(e) => dispatch(updateCategory({id: cat.id, displayOrder: Number(e.target.value)}))} className="border border-border p-1 rounded-lg w-16 text-sm outline-none focus:border-primary" />
                    </Table.Td>
                    <Table.Td className="font-bold text-text-main">{cat.name}</Table.Td>
                    <Table.Td>
                      <Badge variant={(!cat.status || cat.status === 'ACTIVE') ? 'success' : 'danger'}>
                        {(!cat.status || cat.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </Table.Td>
                    <Table.Td align="right">
                      <Button variant="ghost" size="sm" onClick={() => toggleCategoryStatus(cat)} className={(!cat.status || cat.status === 'ACTIVE') ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'}>
                        {(!cat.status || cat.status === 'ACTIVE') ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                    </Table.Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        ) : (
          <Table>
            <thead>
              <tr>
                <Table.Th>Item Name</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Price (₹)</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th align="right">Actions</Table.Th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState icon={Utensils} title="No menu items found" description="Try adjusting your search criteria or add a new menu item." />
                  </td>
                </tr>
              ) : (
                paginatedItems.map(item => {
                  return (
                  <tr key={item.id}>
                    <Table.Td>
                      <p className="font-bold text-text-main">{item.name}</p>
                      {item.description && <p className="text-xs text-text-muted mt-0.5">{item.description}</p>}
                    </Table.Td>
                    <Table.Td>
                      <select 
                        value={item.categoryId} 
                        onChange={(e) => dispatch(updateMenuItem({id: item.id, categoryId: e.target.value}))}
                        className="border border-border p-1.5 rounded-lg text-sm bg-white outline-none focus:border-primary"
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </Table.Td>
                    <Table.Td className="font-bold text-primary">
                      ₹ <input type="number" value={priceEdits[item.id] ?? item.price} onChange={(e) => setPriceEdits(prev => ({ ...prev, [item.id]: e.target.value }))} onBlur={(e) => changeItemPrice(item, e.target.value)} onKeyDown={(e) => {if(e.key==='Enter') e.target.blur();}} className="border border-border p-1 rounded-lg w-20 text-text-main ml-1 outline-none focus:border-primary" placeholder={item.price} />
                    </Table.Td>
                    <Table.Td>
                      <Badge variant={(!item.status || item.status === 'ACTIVE') ? 'success' : 'danger'}>
                        {(!item.status || item.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </Table.Td>
                    <Table.Td align="right">
                      <Button variant="ghost" size="sm" onClick={() => toggleItemStatus(item)} className={(!item.status || item.status === 'ACTIVE') ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'}>
                        {(!item.status || item.status === 'ACTIVE') ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                    </Table.Td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        )}

        {activeTab === 'ITEMS' && filteredItems.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>
    </div>
  );
}
