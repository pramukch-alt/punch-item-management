import React, { useState, useEffect } from 'react';
import { Camera, Share2, Moon, Sun, RotateCcw, Save, Trash2, Settings, FileCheck, ClipboardList, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';

const PACKAGES = [
  { id: 'A01', name: 'A01 - Package A' },
  { id: 'B01', name: 'B01 - Package B' }
];

const SYSTEMS: Record<string, { id: string, name: string }[]> = {
  'A01': [
    { id: 'A01-1', name: 'A01-1 - System A01-1' },
    { id: 'A01-2', name: 'A01-2 - System A01-2' },
  ],
  'B01': [
    { id: 'B01-1', name: 'B01-1 - System B01-1' },
  ]
};

interface AppSettings {
  user: string;
  role: string;
  disciplineStep2: string;
  package: string;
  system: string;
  location: string;
}

interface InspectionData {
  kksTag: string;
  description: string;
  category: string;
  image1: string | null;
  image2: string | null;
}

interface SavedItem extends AppSettings, InspectionData {
  id: string;
  itemNo: string;
  date: string;
}

const defaultSettings: AppSettings = {
  user: '',
  role: '',
  disciplineStep2: 'CIV',
  package: '',
  system: '',
  location: '',
};

const defaultInspection: InspectionData = {
  kksTag: '',
  description: '',
  category: '',
  image1: null,
  image2: null,
};

export default function FieldApp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Setting' | 'Inspection' | 'Logs'>('Setting');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('pwa_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [inspection, setInspection] = useState<InspectionData>(defaultInspection);
  
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    const saved = localStorage.getItem('pwa_saved_items');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist settings & saved items
  useEffect(() => {
    localStorage.setItem('pwa_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('pwa_saved_items', JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const updateSettings = (updates: Partial<AppSettings>) => setSettings(prev => ({ ...prev, ...updates }));
  const updateInspection = (updates: Partial<InspectionData>) => setInspection(prev => ({ ...prev, ...updates }));

  const compressImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        callback(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, imageSlot: 'image1' | 'image2') => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file, (base64) => {
      updateInspection({ [imageSlot]: base64 });
    });
  };

  const saveInspection = () => {
    if (!inspection.description) {
      alert('Description is required');
      return;
    }

    const itemNo = String(savedItems.length + 1).padStart(3, '0');
    
    const newItem: SavedItem = {
      id: Date.now().toString(),
      itemNo,
      date: new Date().toLocaleDateString('en-GB'),
      ...settings,
      ...inspection
    };

    setSavedItems([newItem, ...savedItems]);
    setInspection(defaultInspection);
    alert(`Item ${itemNo} saved successfully!`);
  };

  const clearInspection = () => {
    if(window.confirm('Clear all inspection data?')) {
      setInspection(defaultInspection);
    }
  };

  const clearDatabase = () => {
    if(window.confirm('Are you sure you want to clear ALL saved records from this device? This cannot be undone.')) {
      setSavedItems([]);
    }
  };

  const shareData = async () => {
    if (savedItems.length === 0) {
      alert("No items to share");
      return;
    }
    
    // 1. Create CSV
    const headers = ["Item No", "Date", "User", "Role", "Discipline", "Package", "System", "Location", "KKS Tag", "Category", "Description", "Image1", "Image2"];
    const rows = savedItems.map(item => [
      item.itemNo,
      item.date,
      item.user,
      item.role,
      item.disciplineStep2,
      item.package,
      item.system,
      item.location,
      item.kksTag,
      item.category,
      `"${item.description.replace(/"/g, '""')}"`,
      item.image1 ? `${item.itemNo}_1.jpg` : '',
      item.image2 ? `${item.itemNo}_2.jpg` : ''
    ]);

    const csvString = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    
    // 2. Create ZIP
    const zip = new JSZip();
    zip.file("punch_items.csv", csvString);
    
    savedItems.forEach(item => {
      if (item.image1) {
        const base64Data = item.image1.split(',')[1];
        zip.file(`${item.itemNo}_1.jpg`, base64Data, { base64: true });
      }
      if (item.image2) {
        const base64Data = item.image2.split(',')[1];
        zip.file(`${item.itemNo}_2.jpg`, base64Data, { base64: true });
      }
    });

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const file = new File([zipBlob], "punch_items.zip", { type: "application/zip" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Punch Items Export',
          text: 'Here are the exported punch items and photos.',
        });
      } else {
        fallbackDownload(zipBlob, "punch_items.zip");
      }
    } catch (error) {
      console.error('Error creating or sharing zip:', error);
      alert('Could not share the file. Downloading instead...');
      // If generateAsync succeeded but share failed, we try fallback again if possible.
      // But if generateAsync fails, we can't do much.
      zip.generateAsync({ type: "blob" }).then(blob => fallbackDownload(blob, "punch_items.zip"));
    }
  };

  const fallbackDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      {/* App Header */}
      <header className="sticky top-0 z-20 bg-primary-blue text-white shadow-md">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-lg font-bold">Punch Item App</h1>
          <div className="flex gap-4 items-center">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" title="Toggle Theme">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => navigate('/')} className="text-sm font-medium underline px-2">Exit</button>
          </div>
        </div>
        
        {/* Top Navigation Tabs */}
        <div className="flex bg-blue-800">
          <button 
            onClick={() => setActiveTab('Setting')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'Setting' ? 'border-white text-white' : 'border-transparent text-blue-200'}`}
          >
            <Settings size={16} /> Setting
          </button>
          <button 
            onClick={() => setActiveTab('Inspection')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'Inspection' ? 'border-white text-white' : 'border-transparent text-blue-200'}`}
          >
            <FileCheck size={16} /> Inspection
          </button>
          <button 
            onClick={() => setActiveTab('Logs')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'Logs' ? 'border-white text-white' : 'border-transparent text-blue-200'}`}
          >
            <ClipboardList size={16} /> Logs
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full relative pb-24 space-y-4">
        
        {/* TAB: SETTING */}
        {activeTab === 'Setting' && (
          <div className="space-y-4 slide-in">
            {/* Card 1: Inspector identity */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold mb-4 dark:text-white border-b pb-2 dark:border-slate-700">Inspector Identity</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">User Name</label>
                  <input type="text" className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700" value={settings.user} onChange={e => updateSettings({ user: e.target.value })} placeholder="Enter user name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">Role / Group</label>
                  <select className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700" value={settings.role} onChange={e => updateSettings({ role: e.target.value })}>
                    <option value="">Select Role</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="OE">Owner Engineer (OE)</option>
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: System Inspection */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold mb-4 dark:text-white border-b pb-2 dark:border-slate-700">System Inspection</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-slate-300">Discipline</label>
                  <div className="grid grid-cols-5 gap-1">
                    {['CIV', 'MEC', 'ELE', 'CSI', 'COM'].map(d => (
                      <button 
                        key={d}
                        onClick={() => updateSettings({ disciplineStep2: d })}
                        className={`py-2 text-xs rounded-lg font-medium transition ${settings.disciplineStep2 === d ? 'bg-primary-blue text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">Package</label>
                  <select className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700" value={settings.package} onChange={e => updateSettings({ package: e.target.value, system: '' })}>
                    <option value="">Select Package</option>
                    {PACKAGES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">System</label>
                  <select className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700" value={settings.system} onChange={e => updateSettings({ system: e.target.value })} disabled={!settings.package}>
                    <option value="">Select System</option>
                    {(SYSTEMS[settings.package] || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">Location</label>
                  <input type="text" className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700" value={settings.location} onChange={e => updateSettings({ location: e.target.value })} placeholder="Enter location"/>
                </div>
              </div>
            </div>

            {/* Card 3: Data Export */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h2 className="text-md font-bold dark:text-white">Data Export</h2>
                <p className="text-xs text-slate-500">Share {savedItems.length} saved records as CSV</p>
              </div>
              <button onClick={shareData} className="p-3 bg-blue-100 text-primary-blue rounded-xl hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition">
                <Share2 size={24} />
              </button>
            </div>

            {/* Card 4: Database Management */}
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/30 flex justify-between items-center">
              <div>
                <h2 className="text-md font-bold text-red-700 dark:text-red-400">Database Management</h2>
                <p className="text-xs text-red-500/80 dark:text-red-400/80">Clear local records pending in this App</p>
              </div>
              <button onClick={clearDatabase} className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 transition">
                <Trash2 size={24} />
              </button>
            </div>
          </div>
        )}

        {/* TAB: INSPECTION */}
        {activeTab === 'Inspection' && (
          <div className="space-y-4 slide-in">
            {/* Card 1: Information */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <h3 className="font-semibold text-primary-dark dark:text-white mb-3 flex justify-between border-b pb-2 dark:border-slate-700">
                <span>Information</span>
                <button onClick={() => setActiveTab('Setting')} className="text-sm text-primary-blue font-normal underline">Edit Settings</button>
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-slate-500">Date:</div>
                <div className="font-medium dark:text-white">{new Date().toLocaleDateString('en-GB')}</div>
                <div className="text-slate-500">System:</div>
                <div className="font-medium dark:text-white">{settings.system || '-'}</div>
                <div className="text-slate-500">Location:</div>
                <div className="font-medium dark:text-white">{settings.location || '-'}</div>
                <div className="text-slate-500">Next Item No:</div>
                <div className="font-bold text-primary-blue">{String(savedItems.length + 1).padStart(3, '0')}</div>
              </div>
            </div>

            {/* Card 2: Inspection Area */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 space-y-4">
              <h3 className="font-semibold text-primary-dark dark:text-white border-b pb-2 dark:border-slate-700">Inspection Area</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">KKS Tag <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input type="text" className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700" value={inspection.kksTag} onChange={e => updateInspection({ kksTag: e.target.value })} placeholder="Enter KKS Tag"/>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Description <span className="text-red-500">*</span></label>
                <textarea className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 h-24 resize-none" value={inspection.description} onChange={e => updateInspection({ description: e.target.value })} placeholder="Describe the issue..." required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Category <span className="text-slate-400 font-normal">(Optional)</span></label>
                <div className="flex gap-2">
                  {['A', 'B', 'C'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => updateInspection({ category: cat === inspection.category ? '' : cat })}
                      className={`flex-1 py-2 border rounded-lg font-bold transition ${inspection.category === cat ? 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-900 dark:border-slate-700'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Photos <span className="text-slate-400 font-normal">(Max 2)</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Photo 1 */}
                  {inspection.image1 ? (
                    <div className="relative group">
                      <img src={inspection.image1} alt="Photo 1" className="w-full h-32 object-cover rounded-lg border dark:border-slate-700" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <button onClick={() => updateInspection({ image1: null })} className="bg-red-500 text-white p-2 rounded-full"><Trash2 size={16} /></button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">{String(savedItems.length + 1).padStart(3, '0')}_1.jpg</div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700">
                      <Camera size={24} className="text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">Add Photo 1</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleImageUpload(e, 'image1')} />
                    </label>
                  )}
                  
                  {/* Photo 2 */}
                  {inspection.image2 ? (
                    <div className="relative group">
                      <img src={inspection.image2} alt="Photo 2" className="w-full h-32 object-cover rounded-lg border dark:border-slate-700" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <button onClick={() => updateInspection({ image2: null })} className="bg-red-500 text-white p-2 rounded-full"><Trash2 size={16} /></button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">{String(savedItems.length + 1).padStart(3, '0')}_2.jpg</div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700">
                      <Camera size={24} className="text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">Add Photo 2</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleImageUpload(e, 'image2')} />
                    </label>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t dark:border-slate-700">
                <button onClick={clearInspection} className="py-3 flex items-center justify-center gap-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold dark:bg-slate-800 dark:text-slate-300">
                  <RotateCcw size={18} /> Clear
                </button>
                <button onClick={saveInspection} className="py-3 flex items-center justify-center gap-2 text-white bg-primary-blue hover:bg-blue-700 rounded-xl font-semibold shadow-md shadow-blue-500/20">
                  <Save size={18} /> Save Item
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB: LOGS */}
        {activeTab === 'Logs' && (
          <div className="space-y-4 slide-in">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-700">
                <h2 className="text-lg font-bold dark:text-white">Inspection Logs</h2>
                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                  Last 20 records
                </span>
              </div>
              
              <div className="space-y-3">
                {savedItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 flex flex-col items-center">
                    <ClipboardList size={40} className="mb-2 opacity-50" />
                    <p>No records found in local storage</p>
                  </div>
                ) : (
                  savedItems.slice(0, 20).map((item) => (
                    <div key={item.id} className="relative p-3 rounded-lg border border-slate-100 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
                      <div className="flex justify-between items-start pr-8">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-primary-blue">#{item.itemNo}</span>
                            {item.kksTag && <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">{item.kksTag}</span>}
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">{item.description}</p>
                          <div className="text-[10px] text-slate-400 mt-2 flex gap-2">
                            <span>{item.date}</span>
                            <span>•</span>
                            <span>{item.system || 'No System'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Category Badge on the right middle */}
                      {item.category && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm border border-amber-200 dark:bg-amber-900/40 dark:border-amber-700/50 dark:text-amber-400 shadow-sm">
                          {item.category}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* CSS for transition */}
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
}
