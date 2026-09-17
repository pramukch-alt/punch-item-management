import React, { useState, useEffect } from 'react';
import { 
  Package, 
  FolderKanban, 
  Edit, 
  Trash2, 
  Plus, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  Building2, 
  UserCheck, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  PauseCircle, 
  Users 
} from 'lucide-react';
import api from '../services/api';

interface PackageItem {
  id: string;
  package_name: string;
  max_punch_items: number | null;
  pwa_enabled: boolean;
  report_enabled: boolean;
  duration_months: number | null;
}

interface ProjectItem {
  id: string;
  name: string;
  package_id: string | null;
  package?: PackageItem;
  customer_name: string | null;
  customer_info: string | null;
  admin_name: string | null;
  admin_contact: string | null;
  duration_months: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  users?: Array<{ id: string; email: string; name: string }>;
  _count?: { punch_items: number; users: number };
  history_count?: number;
  storage_bytes?: number;
  storage_formatted?: string;
  created_at: string;
}

const SuperadminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'packages' | 'projects'>('projects');
  
  // Packages State
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [pkgForm, setPkgForm] = useState({ 
    id: '', 
    package_name: '', 
    max_punch_items: '', 
    pwa_enabled: false, 
    report_enabled: false, 
    duration_months: '' 
  });

  // Projects State
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projForm, setProjForm] = useState({ 
    id: '', 
    name: '', 
    package_id: '',
    customer_name: '',
    customer_info: '',
    admin_name: '',
    admin_contact: '',
    admin_email: '',
    admin_password: '',
    duration_months: '12',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'
  });

  useEffect(() => {
    fetchPackages();
    fetchProjects();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/packages');
      setPackages(res.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  const calcEndDate = (startDateStr: string, monthsStr: string) => {
    if (!startDateStr || !monthsStr || isNaN(parseInt(monthsStr))) return '';
    try {
      const d = new Date(startDateStr);
      d.setMonth(d.getMonth() + parseInt(monthsStr));
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleOpenNewProject = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultMonths = '12';
    setProjForm({
      id: '',
      name: '',
      package_id: packages[0]?.id || '',
      customer_name: '',
      customer_info: '',
      admin_name: '',
      admin_contact: '',
      admin_email: '',
      admin_password: '',
      duration_months: defaultMonths,
      start_date: today,
      end_date: calcEndDate(today, defaultMonths),
      status: 'ACTIVE'
    });
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (proj: ProjectItem) => {
    const sDate = proj.start_date ? new Date(proj.start_date).toISOString().split('T')[0] : '';
    const eDate = proj.end_date ? new Date(proj.end_date).toISOString().split('T')[0] : '';
    const adminUser = proj.users && proj.users.length > 0 ? proj.users[0] : null;

    setProjForm({
      id: proj.id,
      name: proj.name || '',
      package_id: proj.package_id || '',
      customer_name: proj.customer_name || '',
      customer_info: proj.customer_info || '',
      admin_name: proj.admin_name || adminUser?.name || '',
      admin_contact: proj.admin_contact || '',
      admin_email: adminUser?.email || '',
      admin_password: '',
      duration_months: proj.duration_months ? String(proj.duration_months) : '',
      start_date: sDate,
      end_date: eDate,
      status: proj.status || 'ACTIVE'
    });
    setIsProjectModalOpen(true);
  };

  const handleSavePackage = async () => {
    if (!pkgForm.package_name.trim()) {
      alert('Please enter a package name');
      return;
    }
    try {
      const data = {
        package_name: pkgForm.package_name.trim(),
        max_punch_items: pkgForm.max_punch_items ? parseInt(pkgForm.max_punch_items) : null,
        pwa_enabled: pkgForm.pwa_enabled,
        report_enabled: pkgForm.report_enabled,
        duration_months: pkgForm.duration_months ? parseInt(pkgForm.duration_months) : null,
      };

      if (pkgForm.id) {
        await api.put('/packages/' + pkgForm.id, data);
      } else {
        await api.post('/packages', data);
      }
      setIsPackageModalOpen(false);
      fetchPackages();
    } catch (err: any) { 
      console.error(err); 
      alert(err.response?.data?.message || 'Error saving package'); 
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await api.delete('/packages/' + id);
      fetchPackages();
    } catch (err: any) { 
      console.error(err); 
      alert(err.response?.data?.message || 'Cannot delete package if it is assigned to a project'); 
    }
  };

  const handleSaveProject = async () => {
    if (!projForm.name.trim()) {
      alert('Please enter a project name');
      return;
    }

    if (!projForm.id && (!projForm.admin_email.trim() || !projForm.admin_password.trim())) {
      if (!window.confirm('You have not set an Admin Username & Password for this project. Do you want to proceed without creating an initial admin?')) {
        return;
      }
    }

    try {
      const data = {
        name: projForm.name.trim(),
        package_id: projForm.package_id || null,
        customer_name: projForm.customer_name.trim() || null,
        customer_info: projForm.customer_info.trim() || null,
        admin_name: projForm.admin_name.trim() || null,
        admin_contact: projForm.admin_contact.trim() || null,
        admin_email: projForm.admin_email.trim() || undefined,
        admin_password: projForm.admin_password.trim() || undefined,
        duration_months: projForm.duration_months ? parseInt(projForm.duration_months) : null,
        start_date: projForm.start_date ? new Date(projForm.start_date).toISOString() : null,
        end_date: projForm.end_date ? new Date(projForm.end_date).toISOString() : null,
        status: projForm.status
      };

      if (projForm.id) {
        await api.put('/projects/' + projForm.id, data);
      } else {
        await api.post('/projects', data);
      }
      setIsProjectModalOpen(false);
      fetchProjects();
    } catch (err: any) { 
      console.error(err); 
      alert(err.response?.data?.message || 'Error saving project'); 
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm('WARNING: Are you sure you want to delete project "' + name + '"? All punch items and users in this project will be removed.')) return;
    try {
      await api.delete('/projects/' + id);
      fetchProjects();
    } catch (err: any) { 
      console.error(err); 
      alert(err.response?.data?.message || 'Error deleting project'); 
    }
  };

  const getStatusBadge = (status: string, endDateStr?: string | null) => {
    const isExpiredDate = endDateStr && new Date(endDateStr) < new Date();
    if (status === 'SUSPENDED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <PauseCircle size={13} /> Suspended
        </span>
      );
    }
    if (status === 'EXPIRED' || isExpiredDate) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertCircle size={13} /> Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={13} /> Active
      </span>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl shadow-xs">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">Superadmin Dashboard</h1>
            <p className="text-surface-textMuted text-sm mt-0.5">Manage global subscription packages, tenant projects, and administrator credentials.</p>
          </div>
        </div>

        {/* Global Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="bg-surface-card border border-surface-border px-4 py-2 rounded-lg text-center shadow-xs">
            <div className="text-xs text-surface-textMuted font-medium">Total Projects</div>
            <div className="text-lg font-bold text-primary-blue">{projects.length}</div>
          </div>
          <div className="bg-surface-card border border-surface-border px-4 py-2 rounded-lg text-center shadow-xs">
            <div className="text-xs text-surface-textMuted font-medium">Packages</div>
            <div className="text-lg font-bold text-purple-600">{packages.length}</div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-surface-border">
        <button
          onClick={() => setActiveTab('projects')}
          className={'px-6 py-3 font-semibold transition-colors ' + (activeTab === 'projects' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-surface-textMuted hover:text-primary-dark')}
        >
          <div className="flex items-center"><FolderKanban className="mr-2" size={18}/> Projects & Tenants ({projects.length})</div>
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={'px-6 py-3 font-semibold transition-colors ' + (activeTab === 'packages' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-surface-textMuted hover:text-primary-dark')}
        >
          <div className="flex items-center"><Package className="mr-2" size={18}/> Subscription Packages ({packages.length})</div>
        </button>
      </div>

      {/* PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <p className="text-sm text-surface-textMuted">
              Manage tenant projects, customer info, subscription duration, and initial administrator accounts.
            </p>
            <button 
              onClick={handleOpenNewProject} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg flex items-center shadow-xs transition-colors"
            >
              <Plus size={18} className="mr-1.5"/> Create New Project
            </button>
          </div>

          <div className="bg-surface-card rounded-xl shadow-xs border border-surface-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[950px]">
                <thead className="bg-surface-app text-surface-textMuted border-b border-surface-border uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Project & Customer</th>
                    <th className="px-6 py-3.5 font-semibold">Package Tier</th>
                    <th className="px-6 py-3.5 font-semibold">Duration & Validity</th>
                    <th className="px-6 py-3.5 font-semibold">Tenant Admin</th>
                    <th className="px-6 py-3.5 font-semibold text-center">Status</th>
                    <th className="px-6 py-3.5 font-semibold text-center">Stats</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-surface-textMuted">
                        No projects created yet. Click "Create New Project" to get started.
                      </td>
                    </tr>
                  ) : (
                    projects.map(proj => {
                      const adminUser = proj.users && proj.users.length > 0 ? proj.users[0] : null;
                      return (
                        <tr key={proj.id} className="hover:bg-surface-app/50 transition-colors">
                          {/* Project & Customer */}
                          <td className="px-6 py-4">
                            <div className="font-bold text-primary-dark text-base">{proj.name}</div>
                            {proj.customer_name ? (
                              <div className="flex items-center gap-1.5 text-xs text-primary-blue mt-0.5">
                                <Building2 size={13} />
                                <span className="font-medium">{proj.customer_name}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-surface-textMuted italic mt-0.5">No customer name</div>
                            )}
                            {proj.customer_info && (
                              <div className="text-xs text-surface-textMuted truncate max-w-xs mt-0.5">
                                {proj.customer_info}
                              </div>
                            )}
                          </td>

                          {/* Package */}
                          <td className="px-6 py-4">
                            {proj.package ? (
                              <div>
                                <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md text-xs font-bold inline-block">
                                  {proj.package.package_name}
                                </span>
                                <div className="text-xs text-surface-textMuted mt-1">
                                  Limit: {proj.package.max_punch_items === null ? 'Unlimited items' : proj.package.max_punch_items + ' items'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded">No Package</span>
                            )}
                          </td>

                          {/* Duration & Validity */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-xs text-surface-textMuted">
                              <Clock size={13} className="text-purple-600" />
                              <span className="font-medium text-primary-dark">
                                {proj.duration_months ? proj.duration_months + ' Months' : 'Unlimited'}
                              </span>
                            </div>
                            <div className="text-xs text-surface-textMuted mt-1">
                              Start: {proj.start_date ? new Date(proj.start_date).toLocaleDateString() : '-'}
                            </div>
                            <div className="text-xs text-surface-textMuted font-medium">
                              Expire: {proj.end_date ? (
                                <span className={new Date(proj.end_date) < new Date() ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                                  {new Date(proj.end_date).toLocaleDateString()}
                                </span>
                              ) : '-'}
                            </div>
                          </td>

                          {/* Tenant Admin */}
                          <td className="px-6 py-4">
                            {adminUser || proj.admin_name ? (
                              <div>
                                <div className="flex items-center gap-1.5 font-medium text-xs text-primary-dark">
                                  <UserCheck size={14} className="text-emerald-600" />
                                  <span>{proj.admin_name || adminUser?.name || 'Administrator'}</span>
                                </div>
                                {adminUser?.email && (
                                  <div className="text-xs text-surface-textMuted mt-0.5">
                                    {adminUser.email}
                                  </div>
                                )}
                                {proj.admin_contact && (
                                  <div className="text-xs text-surface-textMuted mt-0.5">
                                    Tel: {proj.admin_contact}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-amber-600 italic">Not Assigned</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(proj.status, proj.end_date)}
                          </td>

                          {/* Storage & Usage Stats */}
                          <td className="px-6 py-4 text-center text-xs text-surface-textMuted">
                            <div className="font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md inline-block mb-1 shadow-xs">
                              💾 {proj.storage_formatted || '0 B'}
                            </div>
                            <div><span className="font-semibold text-primary-dark">{proj._count?.punch_items ?? 0}</span> items ({proj.history_count ?? 0} logs)</div>
                            <div><span className="font-semibold text-primary-dark">{proj._count?.users ?? 0}</span> users</div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button 
                              onClick={() => handleEditProject(proj)} 
                              title="Edit Project"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors mr-2"
                            >
                              <Edit size={17}/>
                            </button>
                            <button 
                              onClick={() => handleDeleteProject(proj.id, proj.name)} 
                              title="Delete Project"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 size={17}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PACKAGES TAB */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <p className="text-sm text-surface-textMuted">
              Define subscription tiers, maximum punch item quotas, and feature access toggles for tenants.
            </p>
            <button 
              onClick={() => { 
                setPkgForm({ id: '', package_name: '', max_punch_items: '', pwa_enabled: false, report_enabled: false, duration_months: '12' }); 
                setIsPackageModalOpen(true); 
              }} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg flex items-center shadow-xs transition-colors"
            >
              <Plus size={18} className="mr-1.5"/> Create New Package
            </button>
          </div>

          <div className="bg-surface-card rounded-xl shadow-xs border border-surface-border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-app text-surface-textMuted border-b border-surface-border uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Package Name</th>
                  <th className="px-6 py-3.5 font-semibold">Max Punch Items</th>
                  <th className="px-6 py-3.5 font-semibold">Default Duration</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Field App (PWA)</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Report Export/PDF</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-surface-textMuted">
                      No subscription packages created yet.
                    </td>
                  </tr>
                ) : (
                  packages.map(pkg => (
                    <tr key={pkg.id} className="hover:bg-surface-app/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-primary-dark">{pkg.package_name}</td>
                      <td className="px-6 py-4 font-medium">
                        {pkg.max_punch_items === null ? (
                          <span className="text-emerald-700 font-semibold">Unlimited Items</span>
                        ) : (
                          <span>{pkg.max_punch_items.toLocaleString()} Items</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-surface-textMuted">
                        {pkg.duration_months ? pkg.duration_months + ' Months' : 'Unlimited'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {pkg.pwa_enabled ? (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Enabled</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-50 text-rose-600 border border-rose-200">Disabled</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {pkg.report_enabled ? (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Enabled</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-50 text-rose-600 border border-rose-200">Disabled</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button 
                          onClick={() => { 
                            setPkgForm({ 
                              id: pkg.id, 
                              package_name: pkg.package_name, 
                              max_punch_items: pkg.max_punch_items !== null ? String(pkg.max_punch_items) : '', 
                              pwa_enabled: pkg.pwa_enabled, 
                              report_enabled: pkg.report_enabled, 
                              duration_months: pkg.duration_months !== null ? String(pkg.duration_months) : '' 
                            }); 
                            setIsPackageModalOpen(true); 
                          }} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors mr-2"
                        >
                          <Edit size={16}/>
                        </button>
                        <button 
                          onClick={() => handleDeletePackage(pkg.id)} 
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PACKAGE MODAL */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-lg">
                <Package size={20} className="text-purple-600" />
                {pkgForm.id ? 'Edit Package' : 'Create New Package'}
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-surface-textMuted mb-1">Package Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Standard, Pro, Enterprise" 
                  value={pkgForm.package_name} 
                  onChange={e => setPkgForm({...pkgForm, package_name: e.target.value})} 
                  className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-surface-textMuted mb-1">Max Punch Items</label>
                  <input 
                    type="number" 
                    placeholder="Empty = Unlimited" 
                    value={pkgForm.max_punch_items} 
                    onChange={e => setPkgForm({...pkgForm, max_punch_items: e.target.value})} 
                    className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600" 
                  />
                  <span className="text-[11px] text-surface-textMuted">Leave blank for unlimited</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-surface-textMuted mb-1">Duration (Months)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 12" 
                    value={pkgForm.duration_months} 
                    onChange={e => setPkgForm({...pkgForm, duration_months: e.target.value})} 
                    className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600" 
                  />
                  <span className="text-[11px] text-surface-textMuted">Default period in months</span>
                </div>
              </div>

              <div className="pt-2 border-t border-surface-border space-y-3">
                <label className="flex items-center gap-3 p-2.5 border border-surface-border rounded-lg hover:bg-surface-app cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={pkgForm.pwa_enabled} 
                    onChange={e => setPkgForm({...pkgForm, pwa_enabled: e.target.checked})} 
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <div>
                    <div className="text-sm font-semibold text-primary-dark">Field App (PWA) Access</div>
                    <div className="text-xs text-surface-textMuted">Allow contractors to install and use mobile field app</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 border border-surface-border rounded-lg hover:bg-surface-app cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={pkgForm.report_enabled} 
                    onChange={e => setPkgForm({...pkgForm, report_enabled: e.target.checked})} 
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <div>
                    <div className="text-sm font-semibold text-primary-dark">Report Generation & Export</div>
                    <div className="text-xs text-surface-textMuted">Allow PDF print and Excel punch list data export</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-5 bg-surface-app border-t border-surface-border">
              <button 
                onClick={() => setIsPackageModalOpen(false)} 
                className="px-4 py-2 border border-surface-border text-surface-textMuted hover:text-primary-dark rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePackage} 
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
              >
                Save Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL (COMPREHENSIVE ONBOARDING) */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-5 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-purple-950 font-bold text-lg">
                <FolderKanban size={22} className="text-purple-600" />
                <span>{projForm.id ? 'Edit Project & Tenant Settings' : 'Create New Tenant Project'}</span>
              </div>
              <span className="text-xs bg-purple-200/70 text-purple-800 font-semibold px-2.5 py-1 rounded-full">
                {projForm.id ? 'Tenant ID: ' + projForm.id.substring(0, 8) : 'Multi-Tenant Onboarding'}
              </span>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* SECTION 1: PROJECT BASIC INFO */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <FolderKanban size={14} /> 1. Project Information (ข้อมูลโครงการ)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Project Name (ชื่อโครงการ) *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Bangpakong Combined Cycle Power Plant" 
                      value={projForm.name} 
                      onChange={e => setProjForm({...projForm, name: e.target.value})} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Subscription Package (แพ็กเกจ)</label>
                    <select 
                      value={projForm.package_id} 
                      onChange={e => {
                        const selPkg = packages.find(p => p.id === e.target.value);
                        const dur = selPkg?.duration_months ? String(selPkg.duration_months) : projForm.duration_months;
                        setProjForm({
                          ...projForm, 
                          package_id: e.target.value,
                          duration_months: dur,
                          end_date: calcEndDate(projForm.start_date, dur)
                        });
                      }} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600 bg-white"
                    >
                      <option value="">-- Select Package --</option>
                      {packages.map(p => (
                        <option key={p.id} value={p.id}>{p.package_name} ({p.max_punch_items === null ? 'Unlimited' : p.max_punch_items + ' items'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Project Status (สถานะโครงการ)</label>
                    <select 
                      value={projForm.status} 
                      onChange={e => setProjForm({...projForm, status: e.target.value as any})} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600 bg-white"
                    >
                      <option value="ACTIVE">Active (ใช้งานปกติ)</option>
                      <option value="SUSPENDED">Suspended (ระงับชั่วคราว)</option>
                      <option value="EXPIRED">Expired (หมดอายุสัญญา)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DURATION & VALIDITY */}
              <div className="pt-4 border-t border-surface-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <Clock size={14} /> 2. Duration & Validity (อายุการใช้งาน & วันที่สัญญา)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Start Date (วันเริ่มต้น)</label>
                    <input 
                      type="date" 
                      value={projForm.start_date} 
                      onChange={e => {
                        const newStart = e.target.value;
                        setProjForm({
                          ...projForm, 
                          start_date: newStart,
                          end_date: calcEndDate(newStart, projForm.duration_months)
                        });
                      }} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Duration (อายุการใช้งาน - เดือน)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 12" 
                      value={projForm.duration_months} 
                      onChange={e => {
                        const newDur = e.target.value;
                        setProjForm({
                          ...projForm, 
                          duration_months: newDur,
                          end_date: calcEndDate(projForm.start_date, newDur)
                        });
                      }} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Expiration Date (วันหมดอายุ)</label>
                    <input 
                      type="date" 
                      value={projForm.end_date} 
                      onChange={e => setProjForm({...projForm, end_date: e.target.value})} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600 bg-white" 
                    />
                  </div>
                </div>
                <div className="text-[11px] text-surface-textMuted mt-1.5">
                  * เมื่อถึงวันหมดอายุ หรือสถานะเป็น Suspended ผู้ใช้งานในโปรเจกต์นี้จะไม่สามารถเข้าใช้งานระบบได้
                </div>
              </div>

              {/* SECTION 3: CUSTOMER INFORMATION */}
              <div className="pt-4 border-t border-surface-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                  <Building2 size={14} /> 3. Customer Information (ข้อมูลลูกค้า / องค์กร)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Customer Name (ชื่อลูกค้า/บริษัท)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Thai Engineering & Construction Co., Ltd." 
                      value={projForm.customer_name} 
                      onChange={e => setProjForm({...projForm, customer_name: e.target.value})} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Customer Info / Notes (ข้อมูลติดต่อ/สัญญา)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Tax ID, Office Location, Contract Ref." 
                      value={projForm.customer_info} 
                      onChange={e => setProjForm({...projForm, customer_info: e.target.value})} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600" 
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: INITIAL ADMIN CREDENTIALS */}
              <div className="pt-4 border-t border-surface-border bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-800 mb-1 flex items-center gap-1.5">
                  <Key size={14} className="text-purple-600" /> 4. Project Administrator Account (ผู้ดูแลระบบฝั่งลูกค้า)
                </h3>
                <p className="text-xs text-surface-textMuted mb-3">
                  {projForm.id ? 'Update administrator credentials or contact info for this project.' : 'สร้างบัญชี Admin คนแรกของโครงการนี้ทันที เพื่อส่งมอบให้ลูกค้านำไปใช้งานและสร้างผู้ใช้อื่นๆ'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Admin Contact Name (ชื่อผู้ดูแลโครงการ)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Somchai (Project Manager)" 
                      value={projForm.admin_name} 
                      onChange={e => setProjForm({...projForm, admin_name: e.target.value})} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Admin Phone / Contact (เบอร์โทรติดต่อ)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 081-234-5678" 
                      value={projForm.admin_contact} 
                      onChange={e => setProjForm({...projForm, admin_contact: e.target.value})} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">Admin Username / Email (อีเมลเข้าใช้งาน) {!projForm.id && '*'}</label>
                    <input 
                      type="email" 
                      placeholder="e.g. admin@project-customer.com" 
                      value={projForm.admin_email} 
                      onChange={e => setProjForm({...projForm, admin_email: e.target.value})} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary-dark mb-1">
                      {projForm.id ? 'Reset Password (รหัสผ่านใหม่ - ปล่อยว่างถ้าไม่เปลี่ยน)' : 'Admin Password (รหัสผ่านตั้งต้น) *'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={projForm.id ? 'Leave empty to keep current password' : 'Initial password (e.g. Pass1234!)'} 
                      value={projForm.admin_password} 
                      onChange={e => setProjForm({...projForm, admin_password: e.target.value})} 
                      className="w-full border border-surface-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-purple-600 bg-white font-mono" 
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2.5 p-5 bg-surface-app border-t border-surface-border">
              <button 
                onClick={() => setIsProjectModalOpen(false)} 
                className="px-4 py-2 border border-surface-border text-surface-textMuted hover:text-primary-dark rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProject} 
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
              >
                {projForm.id ? 'Save Changes' : 'Create Project & Admin'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SuperadminPanel;
