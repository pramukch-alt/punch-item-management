import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CONTRACTOR');
  const [discipline, setDiscipline] = useState('');
  const [signature, setSignature] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setName(user.name || '');
    setEmail(user.email || '');
    setPassword('');
    setRole(user.role || 'CONTRACTOR');
    setDiscipline(user.discipline || '');
    setSignature(null);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('CONTRACTOR');
    setDiscipline('');
    setSignature(null);
    setIsModalOpen(true);
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    if (name) formData.append('name', name);
    if (discipline) formData.append('discipline', discipline);
    if (signature) {
      formData.append('signature', signature);
    }

    try {
      if (editingUserId) {
        // Edit mode (password is optional)
        if (!password) {
          formData.delete('password'); // Remove if empty so we don't hash an empty string
        }
        await api.put(`/users/${editingUserId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Create mode
        await api.post('/users', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      fetchUsers();
      setIsModalOpen(false);
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setRole('CONTRACTOR');
      setDiscipline('');
      setSignature(null);
    } catch (error: any) {
      console.error('Failed to create user', error);
      alert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user', error);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-dark">User Management</h1>
        <button 
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-primary-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-app border-b border-surface-border text-surface-textMuted text-sm">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Discipline</th>
              <th className="px-6 py-4 font-medium">Signature</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-surface-app transition-colors">
                <td className="px-6 py-3">{user.name || '-'}</td>
                <td className="px-6 py-3">{user.email}</td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-3">{user.discipline || '-'}</td>
                <td className="px-6 py-3">
                  {user.signature_image_path ? (
                    <img src={user.signature_image_path} alt="signature" className="h-8 object-contain" />
                  ) : (
                    <span className="text-sm text-surface-textMuted">-</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => openEditModal(user)} className="text-surface-textMuted hover:text-primary-blue transition-colors p-2" title="Edit User">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 transition-colors p-2" title="Delete User">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-surface-textMuted">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUserId ? "Edit User" : "Add New User"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">Name (First Last)</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue"
              placeholder="e.g. John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">
              Password {editingUserId && <span className="text-surface-textMuted text-xs font-normal">(Leave blank to keep unchanged)</span>}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue"
              required={!editingUserId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">Role</label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue bg-white"
            >
              <option value="CONTRACTOR">Contractor</option>
              <option value="OE">OE (Owner Engineer)</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">Discipline (Optional)</label>
            <select 
              value={discipline}
              onChange={e => setDiscipline(e.target.value)}
              className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue bg-white"
            >
              <option value="">-- None --</option>
              <option value="CIV">CIV</option>
              <option value="MEC">MEC</option>
              <option value="ELE">ELE</option>
              <option value="CSI">CSI</option>
              <option value="COM">COM</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">Signature Image (Optional) - For refer to show in the doc when print out as PDF (Future)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setSignature(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-surface-textMuted hover:text-primary-dark transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editingUserId ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
