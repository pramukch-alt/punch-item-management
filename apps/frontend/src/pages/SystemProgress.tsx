import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CheckCircle, Circle, Save } from 'lucide-react';

export default function SystemProgress() {
  const [packages, setPackages] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<Record<string, Record<string, string[]>>>({});
  
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/settings');
      const pkgs = res.data.PACKAGES ? JSON.parse(res.data.PACKAGES) : [];
      const disc = res.data.DISCIPLINES ? JSON.parse(res.data.DISCIPLINES) : [];
      const prog = res.data.SYSTEM_PROGRESS ? JSON.parse(res.data.SYSTEM_PROGRESS) : {};
      
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

  const toggleSystem = (pkgId: string, sysId: string) => {
    if (!selectedDiscipline) return;
    
    setProgressData(prev => {
      const newData = { ...prev };
      if (!newData[selectedDiscipline]) newData[selectedDiscipline] = {};
      if (!newData[selectedDiscipline][pkgId]) newData[selectedDiscipline][pkgId] = [];
      
      const isFinished = newData[selectedDiscipline][pkgId].includes(sysId);
      if (isFinished) {
        newData[selectedDiscipline][pkgId] = newData[selectedDiscipline][pkgId].filter(id => id !== sysId);
      } else {
        newData[selectedDiscipline][pkgId] = [...newData[selectedDiscipline][pkgId], sysId];
      }
      return newData;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/settings', {
        key: 'SYSTEM_PROGRESS',
        value: JSON.stringify(progressData)
      });
      alert('Progress saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-dark">System Progress</h1>
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
          <div className="space-y-8">
            {packages.map(pkg => {
              const systems = pkg.systems || [];
              if (systems.length === 0) return null;

              return (
                <div key={pkg.id} className="border border-surface-border rounded-lg overflow-hidden">
                  <div className="bg-surface-app px-4 py-3 border-b border-surface-border">
                    <h2 className="font-bold text-primary-dark">Package: {pkg.id} {pkg.name ? `- ${pkg.name}` : ''}</h2>
                  </div>
                  <div className="divide-y divide-surface-border">
                    {systems.map((sys: any) => {
                      const sysId = typeof sys === 'string' ? sys : sys.id;
                      const sysDesc = typeof sys === 'string' ? '' : sys.description;
                      const isFinished = progressData[selectedDiscipline]?.[pkg.id]?.includes(sysId);

                      return (
                        <div key={sysId} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="font-medium text-primary-dark">System {sysId}</p>
                            {sysDesc && <p className="text-sm text-surface-textMuted">{sysDesc}</p>}
                          </div>
                          <button
                            onClick={() => toggleSystem(pkg.id, sysId)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors border ${
                              isFinished 
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                : 'bg-white text-surface-textMuted border-surface-border hover:bg-gray-50 hover:text-primary-dark'
                            }`}
                          >
                            {isFinished ? <CheckCircle size={18} /> : <Circle size={18} />}
                            <span className="font-medium text-sm">{isFinished ? 'Finished' : 'Mark as Finish'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
