import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CheckCircle, Circle, Save, Plus, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';

interface ProgressSystem {
  id: string;
  finished: boolean;
}

interface ProgressPackage {
  packageId: string;
  systems: ProgressSystem[];
}

export default function SystemProgress() {
  const [packages, setPackages] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<Record<string, ProgressPackage[]>>({});
  
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPackageId, setModalPackageId] = useState<string>('');
  const [modalSelectedSystems, setModalSelectedSystems] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/settings');
      let pkgs = res.data.PACKAGES && res.data.PACKAGES !== '[]' ? JSON.parse(res.data.PACKAGES) : [];
      let disc = res.data.DISCIPLINES && res.data.DISCIPLINES !== '[]' ? JSON.parse(res.data.DISCIPLINES) : [];
      const prog = res.data.SYSTEM_PROGRESS ? JSON.parse(res.data.SYSTEM_PROGRESS) : {};
      
      if (pkgs.length === 0) {
        pkgs = [
          { id: 'A01', name: 'Package A', systems: ['A01-1', 'A01-2', 'A01-3'] },
          { id: 'B01', name: 'Package B', systems: ['B01-1', 'B01-2'] }
        ];
      }
      
      if (disc.length === 0) {
        disc = [
          { id: 'CIV', name: 'Civil' },
          { id: 'MEC', name: 'Mechanical' },
          { id: 'ELE', name: 'Electrical' },
          { id: 'CSI', name: 'Control System' },
          { id: 'COM', name: 'Commissioning' }
        ];
      }

      setPackages(pkgs);
      setDisciplines(disc);
      setProgressData(prog);
      
      if (disc.length > 0) {
        setSelectedDiscipline(disc[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setModalPackageId('');
    setModalSelectedSystems([]);
    setIsModalOpen(true);
  };

  const handleAddPackage = () => {
    if (!selectedDiscipline || !modalPackageId || modalSelectedSystems.length === 0) return;
    
    setProgressData(prev => {
      const newData = { ...prev };
      if (!newData[selectedDiscipline]) newData[selectedDiscipline] = [];
      
      // Check if package already exists
      const existingPkgIndex = newData[selectedDiscipline].findIndex(p => p.packageId === modalPackageId);
      
      if (existingPkgIndex >= 0) {
        // Merge systems
        const existingSystems = newData[selectedDiscipline][existingPkgIndex].systems;
        modalSelectedSystems.forEach(sysId => {
          if (!existingSystems.find(s => s.id === sysId)) {
            existingSystems.push({ id: sysId, finished: false });
          }
        });
      } else {
        // Add new package
        newData[selectedDiscipline].push({
          packageId: modalPackageId,
          systems: modalSelectedSystems.map(sysId => ({ id: sysId, finished: false }))
        });
      }
      
      return newData;
    });
    
    setIsModalOpen(false);
  };

  const handleRemovePackage = (pkgId: string) => {
    if (!selectedDiscipline || !confirm('Are you sure you want to remove this package from this discipline?')) return;
    setProgressData(prev => {
      const newData = { ...prev };
      if (newData[selectedDiscipline]) {
        newData[selectedDiscipline] = newData[selectedDiscipline].filter(p => p.packageId !== pkgId);
      }
      return newData;
    });
  };

  const toggleSystemFinish = (pkgId: string, sysId: string) => {
    if (!selectedDiscipline) return;
    
    setProgressData(prev => {
      const newData = { ...prev };
      const disciplineData = newData[selectedDiscipline] || [];
      const pkgIndex = disciplineData.findIndex(p => p.packageId === pkgId);
      
      if (pkgIndex >= 0) {
        const sysIndex = disciplineData[pkgIndex].systems.findIndex(s => s.id === sysId);
        if (sysIndex >= 0) {
          disciplineData[pkgIndex].systems[sysIndex].finished = !disciplineData[pkgIndex].systems[sysIndex].finished;
        }
      }
      return newData;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/system-progress', {
        systemProgress: progressData
      });
      alert('Progress saved successfully');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const currentDisciplineData = progressData[selectedDiscipline] || [];
  
  // Available systems for modal based on selected package
  const modalPackageObj = packages.find(p => p.id === modalPackageId);
  const modalAvailableSystems = modalPackageObj?.systems || [];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-dark">System Progress (Walkdown)</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 bg-primary-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <Save size={20} />
          <span>{saving ? 'Saving...' : 'Save Progress'}</span>
        </button>
      </div>

      <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden">
        {/* Discipline Tabs */}
        <div className="flex overflow-x-auto border-b border-surface-border bg-surface-app">
          {disciplines.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDiscipline(d.id)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedDiscipline === d.id 
                  ? 'bg-white text-primary-blue border-b-2 border-primary-blue' 
                  : 'text-surface-textMuted hover:text-primary-dark hover:bg-white/50'
              }`}
            >
              {d.id} - {d.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg text-primary-dark">Walkdown Progress for {selectedDiscipline}</h2>
              <p className="text-sm text-surface-textMuted mt-1">Import packages and select relevant sub-systems to track your discipline's walkdown progress.</p>
            </div>
            <button 
              onClick={handleOpenModal}
              className="flex items-center space-x-2 bg-white border border-primary-blue text-primary-blue px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
            >
              <Plus size={18} />
              <span>Add Package</span>
            </button>
          </div>

          {currentDisciplineData.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-surface-border rounded-lg bg-slate-50">
              <p className="text-surface-textMuted mb-4">No packages added for this discipline yet.</p>
              <button 
                onClick={handleOpenModal}
                className="flex items-center space-x-2 bg-white border border-surface-border text-primary-dark px-4 py-2 rounded-md hover:bg-gray-50 transition-colors mx-auto"
              >
                <Plus size={18} />
                <span>Import Package</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {currentDisciplineData.map(pkgData => {
                const pkg = packages.find(p => p.id === pkgData.packageId);
                
                return (
                  <div key={pkgData.packageId} className="border border-surface-border rounded-lg overflow-hidden">
                    <div className="bg-surface-app px-4 py-3 border-b border-surface-border flex items-center justify-between">
                      <h3 className="font-bold text-primary-dark">Package: {pkgData.packageId} {pkg?.name ? `- ${pkg.name}` : ''}</h3>
                      <button 
                        onClick={() => handleRemovePackage(pkgData.packageId)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        title="Remove Package from Discipline"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="divide-y divide-surface-border">
                      {pkgData.systems.map((sysProgress) => {
                        // Find description if available
                        const originalSys = pkg?.systems?.find((s: any) => (typeof s === 'string' ? s : s.id) === sysProgress.id);
                        const sysDesc = originalSys && typeof originalSys !== 'string' ? originalSys.description : '';

                        return (
                          <div key={sysProgress.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-4">
                            <div>
                              <p className="font-medium text-primary-dark">System {sysProgress.id}</p>
                              {sysDesc && <p className="text-sm text-surface-textMuted">{sysDesc}</p>}
                            </div>
                            <button
                              onClick={() => toggleSystemFinish(pkgData.packageId, sysProgress.id)}
                              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors border whitespace-nowrap ${
                                sysProgress.finished 
                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                  : 'bg-white text-surface-textMuted border-surface-border hover:bg-gray-50 hover:text-primary-dark'
                              }`}
                            >
                              {sysProgress.finished ? <CheckCircle size={18} /> : <Circle size={18} />}
                              <span className="font-medium text-sm">{sysProgress.finished ? 'Finished' : 'Mark as Finish'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Import Package to Discipline">
        <div className="space-y-4 p-1">
          <div>
            <label className="block text-sm font-medium text-surface-textMuted mb-1">Select Package</label>
            <select 
              value={modalPackageId}
              onChange={(e) => {
                setModalPackageId(e.target.value);
                setModalSelectedSystems([]); // Reset selected systems when package changes
              }}
              className="w-full border border-surface-border rounded-md px-3 py-2 bg-white focus:outline-none focus:border-primary-blue text-primary-dark"
            >
              <option value="">-- Select a Package --</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.id} {p.name ? `- ${p.name}` : ''}</option>
              ))}
            </select>
          </div>

          {modalPackageId && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-surface-textMuted mb-2">Select Relevant Systems for Walkdown</label>
              <div className="border border-surface-border rounded-md overflow-hidden bg-white max-h-60 overflow-y-auto">
                {modalAvailableSystems.length === 0 ? (
                  <div className="p-3 text-sm text-surface-textMuted text-center">No systems found in this package</div>
                ) : (
                  <div className="divide-y divide-surface-border">
                    {modalAvailableSystems.map((sys: any) => {
                      const sysId = typeof sys === 'string' ? sys : sys.id;
                      const sysDesc = typeof sys === 'string' ? '' : sys.description;
                      const isSelected = modalSelectedSystems.includes(sysId);
                      
                      return (
                        <div 
                          key={sysId} 
                          className="flex items-center p-3 hover:bg-slate-50 cursor-pointer"
                          onClick={() => {
                            if (isSelected) {
                              setModalSelectedSystems(prev => prev.filter(id => id !== sysId));
                            } else {
                              setModalSelectedSystems(prev => [...prev, sysId]);
                            }
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            readOnly
                            className="h-4 w-4 text-primary-blue rounded border-surface-border mr-3" 
                          />
                          <div>
                            <p className="text-sm font-medium text-primary-dark">System {sysId}</p>
                            {sysDesc && <p className="text-xs text-surface-textMuted">{sysDesc}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-surface-border mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-surface-border rounded-md text-surface-textMuted hover:bg-surface-app transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPackage}
              disabled={!modalPackageId || modalSelectedSystems.length === 0}
              className="px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Add Selected Systems
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
