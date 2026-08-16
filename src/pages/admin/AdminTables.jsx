import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createTable, updateTable, updateTableConfigStatus } from '../../features/tables/tablesSlice';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Power, PowerOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function AdminTables() {
  const dispatch = useDispatch();
  const tables = useSelector(state => state.tables.data) || [];
  const { currentUser } = useSelector(state => state.auth);

  const [search, setSearch] = useState('');
  
  const [showCreate, setShowCreate] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 2, section: 'Main Hall' });

  const filteredTables = tables.filter(t => {
    if (search && !t.tableNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = () => {
    if (!newTable.tableNumber) return toast.error('Table Number required');
    const tableToCreate = {
      id: `t-${uuidv4().substring(0,6)}`,
      ...newTable,
      status: 'AVAILABLE', // Initial runtime state
      configStatus: 'ACTIVE'
    };
    dispatch(createTable(tableToCreate));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: 'TABLE_CREATED',
      entityType: 'TABLE',
      entityId: tableToCreate.id,
      description: `Created table ${tableToCreate.tableNumber}`,
      createdAt: new Date().toISOString()
    }));
    toast.success('Table created');
    setShowCreate(false);
    setNewTable({ tableNumber: '', capacity: 2, section: 'Main Hall' });
  };

  const toggleStatus = (table) => {
    const newStatus = table.configStatus === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    if (newStatus === 'INACTIVE') {
      if (!window.confirm(`Deactivate table ${table.tableNumber}? It will not be available for new orders.`)) return;
    }
    dispatch(updateTableConfigStatus({ id: table.id, configStatus: newStatus }));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: newStatus === 'ACTIVE' ? 'TABLE_ACTIVATED' : 'TABLE_DEACTIVATED',
      entityType: 'TABLE',
      entityId: table.id,
      description: `Table ${table.tableNumber} ${newStatus.toLowerCase()}`,
      createdAt: new Date().toISOString()
    }));
    toast.success(`Table ${newStatus.toLowerCase()}`);
  };

  const changeCapacity = (table, capacity) => {
    dispatch(updateTable({ id: table.id, capacity: Number(capacity) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-main">Table Management</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Table
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Create New Table</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                <input type="text" placeholder="e.g. T15" value={newTable.tableNumber} onChange={e => setNewTable({...newTable, tableNumber: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input type="number" value={newTable.capacity} onChange={e => setNewTable({...newTable, capacity: Number(e.target.value)})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input type="text" value={newTable.section} onChange={e => setNewTable({...newTable, section: e.target.value})} className="w-full border p-2 rounded" />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Save Table</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-gray-50">
            <input type="text" placeholder="Search tables..." value={search} onChange={e => setSearch(e.target.value)} className="border p-2 rounded w-64" />
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-sm">Table Number</th>
                <th className="p-4 font-semibold text-sm">Section</th>
                <th className="p-4 font-semibold text-sm">Capacity</th>
                <th className="p-4 font-semibold text-sm">Configuration Status</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTables.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No tables found.</td></tr>
              ) : (
                filteredTables.map(table => (
                  <tr key={table.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium">{table.tableNumber}</td>
                    <td className="p-4 text-sm">{table.section}</td>
                    <td className="p-4 text-sm">
                      <input 
                        type="number" 
                        value={table.capacity} 
                        onChange={(e) => changeCapacity(table, e.target.value)}
                        className="border p-1 rounded w-16"
                      />
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${table.configStatus !== 'INACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {table.configStatus !== 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleStatus(table)}
                        className={table.configStatus !== 'INACTIVE' ? 'text-red-500' : 'text-green-500'}
                      >
                        {table.configStatus !== 'INACTIVE' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
