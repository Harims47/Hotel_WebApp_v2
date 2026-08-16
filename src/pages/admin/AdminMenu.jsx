import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createCategory, updateCategory, updateCategoryStatus, createMenuItem, updateMenuItem, updateMenuItemStatus } from '../../features/menu/menuSlice';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Power, PowerOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function AdminMenu() {
  const dispatch = useDispatch();
  const { categories, items } = useSelector(state => state.menu);
  const { currentUser } = useSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState('ITEMS');
  const [search, setSearch] = useState('');

  // Categories
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', displayOrder: categories.length + 1 });

  // Items
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', categoryId: categories[0]?.id || '', price: '', description: '' });

  const filteredCategories = categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredItems = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));

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
    setNewItem({ name: '', categoryId: categories[0]?.id || '', price: '', description: '' });
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
    if (newPrice === item.price) return;
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-main">Menu Management</h1>
        <Button onClick={() => activeTab === 'CATEGORIES' ? setShowCreateCategory(!showCreateCategory) : setShowCreateItem(!showCreateItem)}>
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab === 'CATEGORIES' ? 'Category' : 'Item'}
        </Button>
      </div>

      <div className="flex space-x-4 border-b">
        <button className={`py-2 px-4 border-b-2 font-medium ${activeTab === 'ITEMS' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('ITEMS')}>Menu Items</button>
        <button className={`py-2 px-4 border-b-2 font-medium ${activeTab === 'CATEGORIES' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('CATEGORIES')}>Categories</button>
      </div>

      {activeTab === 'CATEGORIES' && showCreateCategory && (
        <Card>
          <CardHeader><CardTitle>Create New Category</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input type="text" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input type="number" value={newCategory.displayOrder} onChange={e => setNewCategory({...newCategory, displayOrder: Number(e.target.value)})} className="w-full border p-2 rounded" />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateCategory(false)}>Cancel</Button>
              <Button onClick={handleCreateCategory}>Save Category</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'ITEMS' && showCreateItem && (
        <Card>
          <CardHeader><CardTitle>Create New Menu Item</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={newItem.categoryId} onChange={e => setNewItem({...newItem, categoryId: e.target.value})} className="w-full border p-2 rounded bg-white">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="w-full border p-2 rounded" />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateItem(false)}>Cancel</Button>
              <Button onClick={handleCreateItem}>Save Item</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-gray-50">
            <input type="text" placeholder={`Search ${activeTab.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} className="border p-2 rounded w-64" />
          </div>
          
          {activeTab === 'CATEGORIES' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 font-semibold text-sm">Order</th>
                  <th className="p-4 font-semibold text-sm">Category Name</th>
                  <th className="p-4 font-semibold text-sm">Status</th>
                  <th className="p-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr><td colSpan="4" className="p-4 text-center text-gray-500">No categories found.</td></tr>
                ) : (
                  filteredCategories.map(cat => (
                    <tr key={cat.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm font-medium w-24">
                        <input type="number" value={cat.displayOrder} onChange={(e) => dispatch(updateCategory({id: cat.id, displayOrder: Number(e.target.value)}))} className="border p-1 rounded w-16" />
                      </td>
                      <td className="p-4 text-sm font-medium">{cat.name}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${(!cat.status || cat.status === 'ACTIVE') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {(!cat.status || cat.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleCategoryStatus(cat)} className={(!cat.status || cat.status === 'ACTIVE') ? 'text-red-500' : 'text-green-500'}>
                          {(!cat.status || cat.status === 'ACTIVE') ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 font-semibold text-sm">Item Name</th>
                  <th className="p-4 font-semibold text-sm">Category</th>
                  <th className="p-4 font-semibold text-sm">Price (₹)</th>
                  <th className="p-4 font-semibold text-sm">Status</th>
                  <th className="p-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-500">No menu items found.</td></tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm font-medium">
                        {item.name}
                        {item.description && <p className="text-xs text-gray-500 font-normal mt-0.5">{item.description}</p>}
                      </td>
                      <td className="p-4 text-sm">
                        <select 
                          value={item.categoryId} 
                          onChange={(e) => dispatch(updateMenuItem({id: item.id, categoryId: e.target.value}))}
                          className="border p-1 rounded text-sm bg-white"
                        >
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="p-4 text-sm font-medium text-orange-600">
                        ₹ <input type="number" value={item.price} onBlur={(e) => changeItemPrice(item, e.target.value)} onChange={(e) => {}} onKeyDown={(e) => {if(e.key==='Enter') changeItemPrice(item, e.target.value)}} className="border p-1 rounded w-20 ml-1 text-gray-900" placeholder={item.price} />
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${(!item.status || item.status === 'ACTIVE') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {(!item.status || item.status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => toggleItemStatus(item)} className={(!item.status || item.status === 'ACTIVE') ? 'text-red-500' : 'text-green-500'}>
                          {(!item.status || item.status === 'ACTIVE') ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
