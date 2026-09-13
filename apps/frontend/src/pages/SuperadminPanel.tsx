import React, { useState, useEffect } from 'react';
import { Package, FolderKanban, Edit, Trash2, Plus, ShieldAlert } from 'lucide-react';
import api from '../services/api';

const SuperadminPanel = () => {
  const [activeTab, setActiveTab] = useState<'packages' | 'projects'>('packages');
  
  // Packages State
  const [packages, setPackages] = useState<any[]>([]);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [pkgForm, setPkgForm] = useState({ id: '', package_name: '', max_punch_items: '', pwa_enabled: false, report_enabled: false, duration_months: '' });

  // Projects State
  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projForm, setProjForm] = useState({ id: '', name: '', package_id: '' });

  useEffect(() => {
    fetchPackages();
    fetchProjects();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/packages');
      setPackages(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSavePackage = async () => {
    try {
      const data = {
        package_name: pkgForm.package_name,
        max_punch_items: pkgForm.max_punch_items ? parseInt(pkgForm.max_punch_items) : null,
        pwa_enabled: pkgForm.pwa_enabled,
        report_enabled: pkgForm.report_enabled,
        duration_months: pkgForm.duration_months ? parseInt(pkgForm.duration_months) : null,
      };

      if (pkgForm.id) {
        await api.put(/packages/ + pkgForm.id, data);
      } else {
        await api.post('/packages', data);
      }
      setIsPackageModalOpen(false);
      fetchPackages();
    } catch (err) { console.error(err); alert('Error saving package'); }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(/packages/ + id);
      fetchPackages();
    } catch (err) { console.error(err); alert('Cannot delete package if it is assigned to a project'); }
  };

  const handleSaveProject = async () => {
    try {
      const data = {
        name: projForm.name,
        package_id: projForm.package_id || null
      };
      if (projForm.id) {
        await api.put(/projects/ + projForm.id, data);
      } else {
        await api.post('/projects', data);
      }
      setIsProjectModalOpen(false);
      fetchProjects();
    } catch (err) { console.error(err); alert('Error saving project'); }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-8 border-b border-surface-border pb-6">
        <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Superadmin Dashboard</h1>
          <p className="text-surface-textMuted mt-1">Manage global subscription packages and tenant projects.</p>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-surface-border">
        <button
          onClick={() => setActiveTab('packages')}
          className={'px-6 py-4 font-semibold ' + (activeTab === 'packages' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-surface-textMuted hover:text-primary-dark')}
        >
          <div className="flex items-center"><Package className="mr-2" size={18}/> Packages</div>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={'px-6 py-4 font-semibold ' + (activeTab === 'projects' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-surface-textMuted hover:text-primary-dark')}
        >
          <div className="flex items-center"><FolderKanban className="mr-2" size={18}/> Projects (Tenants)</div>
        </button>
      </div>

      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setPkgForm({ id: '', package_name: '', max_punch_items: '', pwa_enabled: false, report_enabled: false, duration_months: '' }); setIsPackageModalOpen(true); }} className="bg-purple-600 text-white px-4 py-2 rounded flex items-center">
              <Plus size={18} className="mr-2"/> New Package
            </button>
          </div>
          <div className="bg-white rounded-lg shadow border border-surface-border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-app text-surface-textMuted border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Package Name</th>
                  <th className="px-6 py-3 font-medium">Max Items</th>
                  <th className="px-6 py-3 font-medium">PWA Access</th>
                  <th className="px-6 py-3 font-medium">Reports Access</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {packages.map(pkg => (
                  <tr key={pkg.id}>
                    <td className="px-6 py-4 font-semibold">{pkg.package_name}</td>
                    <td className="px-6 py-4">{pkg.max_punch_items === null ? 'Unlimited' : pkg.max_punch_items}</td>
                    <td className="px-6 py-4">{pkg.pwa_enabled ? <span className="text-green-600">Enabled</span> : <span className="text-red-500">Disabled</span>}</td>
                    <td className="px-6 py-4">{pkg.report_enabled ? <span className="text-green-600">Enabled</span> : <span className="text-red-500">Disabled</span>}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setPkgForm({ ...pkg, max_punch_items: pkg.max_punch_items || '', duration_months: pkg.duration_months || '' }); setIsPackageModalOpen(true); }} className="text-blue-600 mr-3"><Edit size={16}/></button>
                      <button onClick={() => handleDeletePackage(pkg.id)} className="text-red-600"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setProjForm({ id: '', name: '', package_id: '' }); setIsProjectModalOpen(true); }} className="bg-purple-600 text-white px-4 py-2 rounded flex items-center">
              <Plus size={18} className="mr-2"/> New Project
            </button>
          </div>
          <div className="bg-white rounded-lg shadow border border-surface-border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-app text-surface-textMuted border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Project Name</th>
                  <th className="px-6 py-3 font-medium">Active Package</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {projects.map(proj => (
                  <tr key={proj.id}>
                    <td className="px-6 py-4 font-semibold">{proj.name}</td>
                    <td className="px-6 py-4">
                      {proj.package ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">{proj.package.package_name}</span>
                      ) : <span className="text-red-500 text-xs">No Package</span>}
                    </td>
                    <td className="px-6 py-4">{new Date(proj.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setProjForm({ id: proj.id, name: proj.name, package_id: proj.package_id || '' }); setIsProjectModalOpen(true); }} className="text-blue-600"><Edit size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isPackageModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{pkgForm.id ? 'Edit' : 'Create'} Package</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Package Name</label>
                <input type="text" value={pkgForm.package_name} onChange={e => setPkgForm({...pkgForm, package_name: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Punch Items (Leave empty for Unlimited)</label>
                <input type="number" value={pkgForm.max_punch_items} onChange={e => setPkgForm({...pkgForm, max_punch_items: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={pkgForm.pwa_enabled} onChange={e => setPkgForm({...pkgForm, pwa_enabled: e.target.checked})} />
                <label className="text-sm font-medium">Enable PWA Access</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={pkgForm.report_enabled} onChange={e => setPkgForm({...pkgForm, report_enabled: e.target.checked})} />
                <label className="text-sm font-medium">Enable Report Generation</label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setIsPackageModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSavePackage} className="px-4 py-2 bg-purple-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{projForm.id ? 'Edit' : 'Create'} Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name</label>
                <input type="text" value={projForm.name} onChange={e => setProjForm({...projForm, name: e.target.value})} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign Package</label>
                <select value={projForm.package_id} onChange={e => setProjForm({...projForm, package_id: e.target.value})} className="w-full border rounded p-2">
                  <option value="">-- No Package --</option>
                  {packages.map(p => <option key={p.id} value={p.id}>{p.package_name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSaveProject} className="px-4 py-2 bg-purple-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperadminPanel;
