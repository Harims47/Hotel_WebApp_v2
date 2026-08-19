import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createUser, updateUserStatus, updateUserRole } from '../../features/users/usersSlice';
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
import { Plus, Power, PowerOff, Users as UsersIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function AdminUsers() {
  const dispatch = useDispatch();
  const users = useSelector(state => state.users.data) || [];
  const { currentUser } = useSelector(state => state.auth);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'WAITER' });

  const filteredUsers = users.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.username.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  const handleCreate = () => {
    if (!newUser.name || !newUser.username || !newUser.password) return toast.error('All fields required');
    const userToCreate = {
      id: `u-${uuidv4().substring(0,6)}`,
      ...newUser,
      status: 'ACTIVE'
    };
    dispatch(createUser(userToCreate));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: userToCreate.id,
      description: `Created user ${userToCreate.username}`,
      createdAt: new Date().toISOString()
    }));
    toast.success('User created');
    setShowCreate(false);
    setNewUser({ name: '', username: '', password: '', role: 'WAITER' });
  };

  const toggleStatus = (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (newStatus === 'INACTIVE') {
      if (!window.confirm(`Deactivate user ${user.name}? They will no longer be able to log in.`)) return;
    }
    dispatch(updateUserStatus({ id: user.id, status: newStatus }));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: newStatus === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'USER',
      entityId: user.id,
      description: `User ${user.username} ${newStatus.toLowerCase()}`,
      createdAt: new Date().toISOString()
    }));
    toast.success(`User ${newStatus.toLowerCase()}`);
  };

  const changeRole = (user, newRole) => {
    dispatch(updateUserRole({ id: user.id, role: newRole }));
    dispatch(logAction({
      id: `log-${uuidv4()}`,
      userId: currentUser?.id,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: user.id,
      description: `User ${user.username} role changed to ${newRole}`,
      createdAt: new Date().toISOString()
    }));
    toast.success('Role updated');
  };

  const roleOptions = [
    { value: 'WAITER', label: 'Waiter' },
    { value: 'CASHIER', label: 'Cashier' },
    { value: 'KOT', label: 'Kitchen (KOT)' },
    { value: 'DELIVERY_BOY', label: 'Delivery Boy' },
    { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
    { value: 'GM', label: 'General Manager' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        breadcrumbs="Admin / Users"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        }
      />

      {showCreate && (
        <Card className="animate-in fade-in slide-in-from-top-4">
          <CardHeader><CardTitle>Create New User</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Display Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              <Input label="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              <Input type="password" label="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <Select 
                label="Role" 
                value={newUser.role} 
                onChange={e => setNewUser({...newUser, role: e.target.value})}
                options={roleOptions}
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Save User</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 bg-gray-50/50">
          <div className="w-full md:w-72">
            <SearchInput 
              placeholder="Search users..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onClear={() => setSearch('')}
            />
          </div>
          <div className="w-full md:w-48">
            <Select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              options={[{value: '', label: 'All Roles'}, ...roleOptions]}
            />
          </div>
        </div>
        
        <Table>
          <thead>
            <tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Username</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th align="right">Actions</Table.Th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <EmptyState icon={UsersIcon} title="No users found" description="Adjust your filters or add a new user." />
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <Table.Td className="font-bold text-text-main">{user.name}</Table.Td>
                  <Table.Td>{user.username}</Table.Td>
                  <Table.Td>
                    <select 
                      value={user.role} 
                      onChange={(e) => changeRole(user, e.target.value)}
                      disabled={user.username === 'superadmin'}
                      className="border border-border p-1.5 rounded-lg text-sm bg-white outline-none focus:border-primary disabled:opacity-50"
                    >
                      {roleOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant={user.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {user.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td align="right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleStatus(user)}
                      disabled={user.username === 'superadmin'}
                      className={user.status === 'ACTIVE' ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'}
                    >
                      {user.status === 'ACTIVE' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                  </Table.Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
