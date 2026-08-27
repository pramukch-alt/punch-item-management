import { useState, useEffect } from 'react';
import { Save, Package, Settings as SettingsIcon, Shield, Bell, Plus, Trash2, Users } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    PROJECT_NAME: '',
    RUNNING_NO_FORMAT: '',
    EMAIL_NOTIFICATIONS: 'false',
    PACKAGES: '[]',
    DISCIPLINES: '[]',
    AUTH_RULES: '{}'
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [newDiscipline, setNewDiscipline] = useState({ id: '', name: '' });
  const [newPackage, setNewPackage] = useState({ id: '', name: '' });
  const [newSystemMap, setNewSystemMap] = useState<{[key:string]: string}>({});
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [showAddDiscipline, setShowAddDiscipline] = useState(false);

  // Default fallback data if empty
  const defaultPackages = [
    { id: 'A01', name: 'Package A', systems: ['A01-1', 'A01-2', 'A01-3'] },
    { id: 'B01', name: 'Package B', systems: ['B01-1', 'B01-2'] }
  ];

  const defaultDisciplines = [
    { id: 'CIV', name: 'Civil' },
    { id: 'MEC', name: 'Mechanical' },
    { id: 'ELE', name: 'Electrical' },
    { id: 'CSI', name: 'Control System' },
    { id: 'COM', name: 'Commissioning' }
  ];

  const defaultRoles = [
    { id: 'CONTRACTOR', name: 'Contractor', description: 'Can create punch items, upload evidence, and submit to OE.' },
    { id: 'OE', name: 'Owner Engineer (OE)', description: 'Can review, reject, and approve items to Owner.' },
    { id: 'OWNER', name: 'Owner', description: 'Final approval authority. Can reject or close items.' }
  ];

  const defaultAuthRules = [
    { action: 'Create Item', contractor: true, oe: false, owner: false, admin: true },
    { action: 'Submit to OE', contractor: true, oe: false, owner: false, admin: true },
    { action: 'Approve to Owner', contractor: false, oe: true, owner: false, admin: true },
    { action: 'Reject Item', contractor: false, oe: true, owner: true, admin: true },
    { action: 'Close Item', contractor: false, oe: false, owner: true, admin: true }
  ];

  const defaultNotifRules = [
    { event: 'New Item Created', email: true, app: true },
    { event: 'Item Submitted to OE', email: true, app: true },
    { event: 'Item Submitted to Owner', email: true, app: true },
    { event: 'Item Rejected', email: true, app: true },
    { event: 'Item Closed', email: false, app: true }
  ];

  // Parse state
  const packages = settings.PACKAGES && settings.PACKAGES !== '[]' ? JSON.parse(settings.PACKAGES) : defaultPackages;
  const disciplines = settings.DISCIPLINES && settings.DISCIPLINES !== '[]' ? JSON.parse(settings.DISCIPLINES) : defaultDisciplines;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/settings');
        setSettings(prev => ({ ...prev, ...response.data }));
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        setFetching(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAddDiscipline = () => {
    if (!newDiscipline.id || !newDiscipline.name) return;
    const updated = [...disciplines, newDiscipline];
    handleChange('DISCIPLINES', JSON.stringify(updated));
    setNewDiscipline({ id: '', name: '' });
    setShowAddDiscipline(false);
  };

  const handleRemoveDiscipline = (id: string) => {
    if(!window.confirm('Remove this discipline?')) return;
    const updated = disciplines.filter((d: any) => d.id !== id);
    handleChange('DISCIPLINES', JSON.stringify(updated));
  };

  const handleAddPackage = () => {
    if (!newPackage.id || !newPackage.name) return;
    const updated = [...packages, { ...newPackage, systems: [] }];
    handleChange('PACKAGES', JSON.stringify(updated));
    setNewPackage({ id: '', name: '' });
    setShowAddPackage(false);
  };

  const handleRemovePackage = (id: string) => {
    if(!window.confirm('Remove this package?')) return;
    const updated = packages.filter((p: any) => p.id !== id);
    handleChange('PACKAGES', JSON.stringify(updated));
  };

  const handleAddSystem = (pkgId: string) => {
    const system = newSystemMap[pkgId];
    if (!system) return;
    const updated = packages.map((p: any) => {
        if (p.id === pkgId && !p.systems.includes(system)) {
            return { ...p, systems: [...p.systems, system] };
        }
        return p;
    });
    handleChange('PACKAGES', JSON.stringify(updated));
    setNewSystemMap(prev => ({...prev, [pkgId]: ''}));
  };

  const handleRemoveSystem = (pkgId: string, system: string) => {
    if(!window.confirm('Remove this system?')) return;
    const updated = packages.map((p: any) => {
        if (p.id === pkgId) {
            return { ...p, systems: p.systems.filter((s: string) => s !== system) };
        }
        return p;
    });
    handleChange('PACKAGES', JSON.stringify(updated));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', settings);
      alert('Settings saved successfully!');
      if (activeTab === 'general') window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-dark">System Configuration</h1>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center space-x-2 bg-primary-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md"
        >
          <Save size={16} />
          <span>{loading ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      <div className="flex space-x-1 bg-surface-card p-1 rounded-lg border border-surface-border overflow-x-auto">
        {[
          { id: 'general', icon: SettingsIcon, label: 'General' },
          { id: 'roles', icon: Users, label: 'Role/Group' },
          { id: 'packages', icon: Package, label: 'Packages & Systems' },
          { id: 'disciplines', icon: SettingsIcon, label: 'Disciplines' },
          { id: 'auth', icon: Shield, label: 'Authorization Rules' },
          { id: 'notifications', icon: Bell, label: 'Notifications' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary-blue text-white shadow-sm' 
                : 'text-surface-textMuted hover:bg-surface-app hover:text-primary-dark'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: GENERAL */}
      {activeTab === 'general' && (
        <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden slide-in">
          <div className="p-6 border-b border-surface-border">
            <h2 className="text-lg font-semibold text-primary-dark">General Information</h2>
            <p className="text-sm text-surface-textMuted mt-1">Basic settings for this project instance.</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-dark mb-2">Project Name</label>
              <input 
                type="text" 
                value={settings.PROJECT_NAME || ''}
                onChange={(e) => handleChange('PROJECT_NAME', e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue bg-white"
                placeholder="e.g. Power Plant Alpha"
              />
              <p className="text-xs text-surface-textMuted mt-1">This name appears in the top header and on reports.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-dark mb-2">Running Number Format</label>
              <input 
                type="text" 
                value={settings.RUNNING_NO_FORMAT || ''}
                onChange={(e) => handleChange('RUNNING_NO_FORMAT', e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue bg-surface-app text-surface-textMuted cursor-not-allowed"
                placeholder="DISC-YYYY-SEQ"
                disabled
              />
              <p className="text-xs text-surface-textMuted mt-1">Currently fixed to [DISC]-[YYYY]-[SEQ] (e.g., CIV-2026-0001). Editing this requires backend logic updates.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ROLES */}
      {activeTab === 'roles' && (
        <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden slide-in">
          <div className="p-6 border-b border-surface-border flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-primary-dark">Role / Group</h2>
              <p className="text-sm text-surface-textMuted mt-1">Manage user roles and their descriptions.</p>
            </div>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-app border-b border-surface-border">
                <tr>
                  <th className="px-6 py-3 font-semibold text-primary-dark">Role</th>
                  <th className="px-6 py-3 font-semibold text-primary-dark">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {defaultRoles.map(role => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-bold text-gray-700">{role.name}</td>
                    <td className="px-6 py-3 text-gray-600">{role.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden slide-in">
          <div className="p-6 border-b border-surface-border flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-primary-dark">Packages & Systems</h2>
              <p className="text-sm text-surface-textMuted mt-1">Manage project structural breakdown.</p>
            </div>
            <button onClick={() => setShowAddPackage(!showAddPackage)} className="flex items-center space-x-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-100">
              <Plus size={16} /><span>Add Package</span>
            </button>
          </div>
          <div className="p-6 space-y-6">
            {showAddPackage && (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/30 flex items-end space-x-3 mb-6">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Package ID</label>
                  <input type="text" value={newPackage.id} onChange={e => setNewPackage({...newPackage, id: e.target.value})} placeholder="e.g. C01" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"/>
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Package Name</label>
                  <input type="text" value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} placeholder="e.g. Civil Works Phase 1" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"/>
                </div>
                <button onClick={handleAddPackage} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700">Save</button>
              </div>
            )}
            
            {packages.map((pkg: any) => (
              <div key={pkg.id} className="border border-surface-border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3 pb-2 border-b">
                  <div className="font-bold text-primary-dark flex items-center space-x-2">
                    <span className="bg-primary-blue text-white text-xs px-2 py-0.5 rounded">{pkg.id}</span>
                    <span>{pkg.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleRemovePackage(pkg.id)} className="text-xs text-red-600 hover:underline">Remove</button>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Sub-Systems</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {pkg.systems.map((sys: string) => (
                      <span key={sys} className="bg-white border border-gray-300 px-2 py-1 rounded text-sm text-gray-700 flex items-center space-x-1">
                        <span>{sys}</span>
                        <button onClick={() => handleRemoveSystem(pkg.id, sys)} className="text-gray-400 hover:text-red-500 ml-1"><Trash2 size={12}/></button>
                      </span>
                    ))}
                    <div className="flex items-center space-x-1">
                      <input 
                        type="text" 
                        placeholder="New System" 
                        value={newSystemMap[pkg.id] || ''}
                        onChange={e => setNewSystemMap(prev => ({...prev, [pkg.id]: e.target.value}))}
                        onKeyDown={e => e.key === 'Enter' && handleAddSystem(pkg.id)}
                        className="border border-gray-300 px-2 py-1 rounded text-sm w-32 focus:outline-none focus:border-primary-blue"
                      />
                      <button onClick={() => handleAddSystem(pkg.id)} className="bg-white border border-dashed border-gray-400 text-gray-500 px-2 py-1 rounded text-sm hover:bg-gray-100 flex items-center">
                        <Plus size={14} className="mr-1"/> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DISCIPLINES */}
      {activeTab === 'disciplines' && (
        <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden slide-in">
          <div className="p-6 border-b border-surface-border flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-primary-dark">Disciplines</h2>
              <p className="text-sm text-surface-textMuted mt-1">Configure available engineering disciplines.</p>
            </div>
            <button onClick={() => setShowAddDiscipline(!showAddDiscipline)} className="flex items-center space-x-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-100">
              <Plus size={16} /><span>Add Discipline</span>
            </button>
          </div>
          <div className="p-0">
            {showAddDiscipline && (
              <div className="p-4 border-b border-surface-border bg-green-50/30 flex items-end space-x-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
                  <input type="text" value={newDiscipline.id} onChange={e => setNewDiscipline({...newDiscipline, id: e.target.value})} placeholder="e.g. STR" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"/>
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input type="text" value={newDiscipline.name} onChange={e => setNewDiscipline({...newDiscipline, name: e.target.value})} placeholder="e.g. Structural" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"/>
                </div>
                <button onClick={handleAddDiscipline} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700">Save</button>
              </div>
            )}
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-app border-b border-surface-border">
                <tr>
                  <th className="px-6 py-3 font-semibold text-primary-dark">Code</th>
                  <th className="px-6 py-3 font-semibold text-primary-dark">Name / Description</th>
                  <th className="px-6 py-3 font-semibold text-primary-dark text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {disciplines.map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-bold text-gray-700">{d.id}</td>
                    <td className="px-6 py-3 text-gray-600">{d.name}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleRemoveDiscipline(d.id)} className="text-red-600 hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AUTH RULES */}
      {activeTab === 'auth' && (
        <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden slide-in">
          <div className="p-6 border-b border-surface-border">
            <h2 className="text-lg font-semibold text-primary-dark">Authorization Rules (Matrix)</h2>
            <p className="text-sm text-surface-textMuted mt-1">Configure which roles can perform specific actions in the workflow.</p>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-app border-b border-surface-border">
                <tr>
                  <th className="px-6 py-3 font-semibold text-primary-dark">Action / Feature</th>
                  <th className="px-4 py-3 font-semibold text-center">Contractor</th>
                  <th className="px-4 py-3 font-semibold text-center">OE</th>
                  <th className="px-4 py-3 font-semibold text-center">Owner</th>
                  <th className="px-4 py-3 font-semibold text-center">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {defaultAuthRules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-700">{rule.action}</td>
                    {['contractor', 'oe', 'owner', 'admin'].map(role => (
                      <td key={role} className="px-4 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={(rule as any)[role]} 
                          readOnly
                          className="w-4 h-4 text-primary-blue bg-gray-100 border-gray-300 rounded focus:ring-primary-blue cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-yellow-50 text-yellow-800 text-xs border-t border-yellow-200 flex items-center">
            <Shield size={14} className="mr-2" />
            Note: This mockup shows the Matrix based on the 'Authorization Configuration.xlsx' file. In production, ticking these boxes will dynamically update system permissions.
          </div>
        </div>
      )}

      {/* TAB CONTENT: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden slide-in">
          <div className="p-6 border-b border-surface-border flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-primary-dark">Notification Rules</h2>
              <p className="text-sm text-surface-textMuted mt-1">Configure how and when users are alerted.</p>
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-app border-b border-surface-border">
                <tr>
                  <th className="px-6 py-3 font-semibold text-primary-dark">Trigger Event</th>
                  <th className="px-4 py-3 font-semibold text-center">In-App Alert (Red Mark)</th>
                  <th className="px-4 py-3 font-semibold text-center">Email Notification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {defaultNotifRules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-700">{rule.event}</td>
                    <td className="px-4 py-3 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={rule.app} readOnly/>
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-blue"></div>
                      </label>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={rule.email} readOnly/>
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-blue"></div>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Settings;
