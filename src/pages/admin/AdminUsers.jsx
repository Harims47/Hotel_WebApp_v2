import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createUser, updateUserStatus, updateUserRole } from '../../features/users/usersSlice';
import { logAction } from '../../features/audit/auditSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Edit, Power, PowerOff } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-main">User Management</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Create New User</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full border p-2 rounded">
                  <option value="WAITER">Waiter</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="KOT">Kitchen (KOT)</option>
                  <option value="DELIVERY_BOY">Delivery Boy</option>
                  <option value="GM">General Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Save User</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex gap-4 bg-gray-50">
            <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="border p-2 rounded w-64" />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border p-2 rounded">
              <option value="">All Roles</option>
              <option value="WAITER">Waiter</option>
              <option value="CASHIER">Cashier</option>
              <option value="KOT">Kitchen</option>
              <option value="DELIVERY_BOY">Delivery</option>
              <option value="GM">GM</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-sm">Name</th>
                <th className="p-4 font-semibold text-sm">Username</th>
                <th className="p-4 font-semibold text-sm">Role</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No users found.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium">{user.name}</td>
                    <td className="p-4 text-sm">{user.username}</td>
                    <td className="p-4 text-sm">
                      <select 
                        value={user.role} 
                        onChange={(e) => changeRole(user, e.target.value)}
                        disabled={user.username === 'superadmin'}
                        className="border p-1 rounded text-sm bg-white"
                      >
                        <option value="WAITER">Waiter</option>
                        <option value="CASHIER">Cashier</option>
                        <option value="KOT">Kitchen</option>
                        <option value="DELIVERY_BOY">Delivery</option>
                        <option value="GM">GM</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleStatus(user)}
                        disabled={user.username === 'superadmin'}
                        className={user.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'}
                      >
                        {user.status === 'ACTIVE' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
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
