import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createTable, updateTable, updateTableConfigStatus } from '../../features/tables/tablesSlice';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Plus, Power, PowerOff, Search, Info } from 'lucide-react';
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
      id: `t-${uuidv4().substring(0, 6)}`,
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
    <div className="space-y-6 max-w-7xl ">
      <PageHeader
        title="Table Management"
        description="Configure table layouts, capacity, and active status."
        actions={
          <Button onClick={() => setShowCreate(!showCreate)} className="font-bold shadow-md shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        }
      />

      {showCreate && (
        <Card className="border-0 ring-1 ring-primary/20 shadow-md">
          <div className="p-4 border-b border-border/60 bg-primary/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-main">Create New Table</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Close</Button>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-sm font-bold text-text-main mb-1.5">Table Number / Name</label>
                <input
                  type="text"
                  placeholder="e.g. T15 or VIP-1"
                  value={newTable.tableNumber}
                  onChange={e => setNewTable({ ...newTable, tableNumber: e.target.value })}
                  className="w-full border border-border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-main mb-1.5">Capacity (Seats)</label>
                <input
                  type="number"
                  value={newTable.capacity}
                  onChange={e => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
                  className="w-full border border-border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-main mb-1.5">Section / Area</label>
                <input
                  type="text"
                  value={newTable.section}
                  onChange={e => setNewTable({ ...newTable, section: e.target.value })}
                  className="w-full border border-border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center border-t border-border/50 pt-4">
              <p className="text-sm text-text-muted flex items-center"><Info className="w-4 h-4 mr-1.5" /> Tables are immediately available upon creation.</p>
              <div className="space-x-3">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} className="font-bold">Save Table</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-0 ring-1 ring-border shadow-sm">
        <div className="p-4 border-b border-border/60 bg-gray-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tables..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-border rounded-lg pl-9 p-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow bg-white text-sm"
            />
          </div>
          <span className="text-sm font-medium text-text-muted bg-white border border-border/50 px-2 py-1 rounded shadow-sm">
            {filteredTables.length} tables found
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Table ID</TableHead>
              <TableHead>Section</TableHead>
              <TableHead className="w-[150px]">Capacity</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-text-muted">
                  No tables found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredTables.map(table => (
                <TableRow key={table.id}>
                  <TableCell className="font-bold text-text-main">{table.tableNumber}</TableCell>
                  <TableCell>{table.section}</TableCell>
                  <TableCell>
                    <input
                      type="number"
                      value={table.capacity}
                      onChange={(e) => changeCapacity(table, e.target.value)}
                      className="border border-border p-1.5 rounded-md w-20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={table.configStatus !== 'INACTIVE' ? 'success' : 'default'} className="shadow-sm font-bold">
                      {table.configStatus !== 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(table)}
                      className={table.configStatus !== 'INACTIVE' ? 'border-red-200 text-status-danger hover:bg-red-50 hover:text-red-700' : 'border-green-200 text-status-success hover:bg-green-50 hover:text-green-700'}
                      title={table.configStatus !== 'INACTIVE' ? 'Deactivate Table' : 'Activate Table'}
                    >
                      {table.configStatus !== 'INACTIVE' ? <PowerOff className="w-4 h-4 mr-1.5" /> : <Power className="w-4 h-4 mr-1.5" />}
                      {table.configStatus !== 'INACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
