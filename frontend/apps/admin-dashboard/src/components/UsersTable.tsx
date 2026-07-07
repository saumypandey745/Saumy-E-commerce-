"use client";
import { useEffect, useState } from 'react';
import { ShieldAlert, Unlock, Lock, Shield, User as UserIcon } from 'lucide-react';
import { api } from '@/lib/api'; // using the shared axios instance with interceptors

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  lock_until: string | null;
  createdAt: string;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/v1/admin/users');
      if (res.data && res.data.success) {
        setUsers(res.data.users);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (id: string, newRole: string) => {
    try {
      await api.put(`/api/v1/admin/users/${id}/role`, { role: newRole });
      fetchUsers(); // Refresh the list
    } catch (e) {
      alert('Failed to change role');
    }
  };

  const toggleLock = async (id: string, isCurrentlyLocked: boolean) => {
    try {
      await api.put(`/api/v1/admin/users/${id}/status`, { lock: !isCurrentlyLocked });
      fetchUsers();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-500">Loading users...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900">User Management</h2>
        <span className="text-sm font-medium text-gray-500">{users.length} Total Users</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const isLocked = user.lock_until && new Date(user.lock_until) > new Date();
              return (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <UserIcon size={16} />
                      </div>
                      <div>
                        <div className="font-bold">{user.full_name || 'No Name'}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="SELLER">SELLER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {isLocked ? (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded border border-red-200">Locked</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded border border-green-200">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => toggleLock(user.id, !!isLocked)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex inline-flex items-center gap-1 ${
                        isLocked 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {isLocked ? <><Unlock size={14} /> Unlock</> : <><Lock size={14} /> Lock</>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
