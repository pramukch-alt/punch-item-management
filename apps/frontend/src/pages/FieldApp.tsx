import React, { useState, useEffect } from 'react';
import { Camera, Download, Share2, Moon, Sun, ChevronRight, CheckCircle2, RotateCcw, Save } from 'lucide-react';
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
    { id: 'A01-3', name: 'A01-3 - System A01-3' },
    { id: 'A01-4', name: 'A01-4 - System A01-4' },
    { id: 'A01-5', name: 'A01-5 - System A01-5' },
    { id: 'A01-6', name: 'A01-6 - System A01-6' },
    { id: 'A01-7', name: 'A01-7 - System A01-7' }
  ],
  'B01': [
    { id: 'B01-1', name: 'B01-1 - System B01-1' },
    { id: 'B01-2', name: 'B01-2 - System B01-2' },
    { id: 'B01-3', name: 'B01-3 - System B01-3' },
    { id: 'B01-4', name: 'B01-4 - System B01-4' },
    { id: 'B01-5', name: 'B01-5 - System B01-5' },
    { id: 'B01-6', name: 'B01-6 - System B01-6' },
    { id: 'B01-7', name: 'B01-7 - System B01-7' }
  ]
};
interface FormData {
  // Step 1
  user: string;
  disciplineStep1: string;
  role: string;
  
  // Step 2
  disciplineStep2: string;
  package: string;
  system: string;
  location: string;
  
  // Step 3
  kksTag: string;
  description: string;
  category: string;
  image: string | null; // base64 string
}

const initialFormData: FormData = {
  user: '',
  disciplineStep1: '',
  role: '',
  disciplineStep2: 'CIV',
  package: '',
  system: '',
  location: '',
  kksTag: '',
  description: '',
  category: '',
  image: null,
};

export default function FieldApp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const updateForm = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress image using Canvas
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

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress to 70% quality
        updateForm({ image: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const clearStep3 = () => {
    updateForm({
      kksTag: '',
      description: '',
      category: '',
      image: null,
    });
  };

  const saveItem = () => {
    const newItem = {
      ...formData,
      date: new Date().toISOString().split('T')[0],
    };
    setSavedItems([...savedItems, newItem]);
  };

  const handleSaveAndNext = () => {
    if (!formData.description) {
      alert("Description is required");
      return;
    }
    saveItem();
    clearStep3();
  };

  const [downloadPromptType, setDownloadPromptType] = useState<'EXIT' | 'STEP2' | null>(null);

  const exportZip = async () => {
    if (savedItems.length === 0) {
      alert("No items to share");
      return;
    }

    const zip = new JSZip();

    const headers = ["Item No", "Date", "User", "Role", "Discipline", "Package", "System", "Location", "KKS Tag", "Category", "Description"];
    const rows = savedItems.map((item, index) => {
      const itemNo = (index + 1).toString();
      
      // If there's an image, add it to the ZIP
      if (item.image) {
        // item.image is a base64 string like "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        const base64Data = item.image.split(',')[1];
        zip.file(`${itemNo}.jpg`, base64Data, { base64: true });
      }

      return [
        itemNo,
        item.date,
        item.user,
        item.role,
        item.disciplineStep2,
        item.package,
        item.system,
        item.location,
        item.kksTag,
        item.category,
        `"${item.description.replace(/"/g, '""')}"`
      ];
    });

    const csvString = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    zip.file("punch_items.csv", csvString);

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const file = new File([zipBlob], "punch_items_export.zip", { type: 'application/zip' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Punch Items Export',
          text: 'Here is the exported punch items list with images.',
        });
      } catch (error) {
        console.error('Error sharing:', error);
        fallbackDownloadZip(zipBlob);
      }
    } else {
      fallbackDownloadZip(zipBlob);
    }
  };

  const fallbackDownloadZip = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "punch_items_export.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveAndDone = () => {
    // If form has data but no description
    if (!formData.description && (formData.kksTag || formData.image || formData.category)) {
      alert("Description is required to save this item.");
      return;
    }
    
    let hasItemsToDownload = savedItems.length > 0;
    
    if (formData.description) {
      saveItem();
      clearStep3();
      hasItemsToDownload = true;
    }
    
    if (hasItemsToDownload) {
      setDownloadPromptType('STEP2');
    } else {
      setStep(2);
    }
  };

  const handleBackToStep2 = () => {
    if (savedItems.length > 0) {
      setDownloadPromptType('STEP2');
    } else {
      setStep(2);
    }
  };

  const handleExit = () => {
    if (savedItems.length > 0) {
      setDownloadPromptType('EXIT');
    } else {
      navigate('/');
    }
  };

  const handlePromptDone = () => {
    const type = downloadPromptType;
    setDownloadPromptType(null);
    if (type === 'EXIT') {
      navigate('/');
    } else if (type === 'STEP2') {
      setStep(2);
    }
  };

  const handlePromptShare = () => {
    exportZip();
    // After download/share, they might still want to proceed
    handlePromptDone();
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      {/* App Header */}
      <header className="sticky top-0 z-10 p-4 bg-primary-blue text-white shadow-md flex justify-between items-center">
        <h1 className="text-lg font-bold">Punch Item Field App</h1>
        <div className="flex gap-4">
          <button onClick={exportZip} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" title="Share via...">
            <Share2 size={20} />
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors" title="Toggle Theme">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={handleExit} className="text-sm font-medium underline px-2">Exit</button>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto relative pb-24">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-primary-blue' : 'bg-slate-300 dark:bg-slate-700'}`} />
          ))}
        </div>

        {/* STEP 1: User Selection */}
        {step === 1 && (
          <div className="space-y-6 slide-in">
            <h2 className="text-xl font-bold dark:text-white">Step 1: User Selection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">User Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                  value={formData.user} 
                  onChange={e => updateForm({ user: e.target.value })} 
                  placeholder="Enter user name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Discipline</label>
                <select 
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={formData.disciplineStep1} 
                  onChange={e => updateForm({ disciplineStep1: e.target.value })}
                >
                  <option value="">Select Discipline</option>
                  <option value="Civil">Civil</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Electrical">Electrical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Role / Group</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                  value={formData.role} 
                  onChange={e => updateForm({ role: e.target.value })} 
                  placeholder="Enter role or group"
                />
              </div>
            </div>
            <button 
              onClick={() => setStep(2)} 
              className="w-full py-4 bg-primary-blue text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
            >
              Next Step <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 2: System Selection */}
        {step === 2 && (
          <div className="space-y-6 slide-in">
            <h2 className="text-xl font-bold dark:text-white">Step 2: System Selection</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-slate-300">Discipline</label>
              <div className="grid grid-cols-3 gap-2">
                {['CIV', 'MEC', 'ELE', 'CSI', 'COM'].map(d => (
                  <button 
                    key={d}
                    onClick={() => updateForm({ disciplineStep2: d })}
                    className={`py-3 rounded-lg font-medium transition ${formData.disciplineStep2 === d ? 'bg-primary-blue text-white border-primary-blue' : 'bg-white text-slate-700 border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Package</label>
                <select 
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={formData.package} 
                  onChange={e => {
                    const pkg = e.target.value;
                    const defaultSystem = pkg && SYSTEMS[pkg] ? SYSTEMS[pkg][0].id : '';
                    updateForm({ package: pkg, system: defaultSystem });
                  }}
                >
                  <option value="">Select Package</option>
                  {PACKAGES.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">System</label>
                <select 
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={formData.system} 
                  onChange={e => updateForm({ system: e.target.value })}
                  disabled={!formData.package}
                >
                  <option value="">Select System</option>
                  {(SYSTEMS[formData.package] || []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Location</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                  value={formData.location} 
                  onChange={e => updateForm({ location: e.target.value })} 
                  placeholder="Enter location"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)} 
                className="py-4 px-6 bg-slate-200 text-slate-800 rounded-lg font-semibold dark:bg-slate-700 dark:text-white hover:bg-slate-300 transition"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)} 
                className="flex-1 py-4 bg-primary-blue text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
              >
                Next Step <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Working Page */}
        {step === 3 && (
          <div className="space-y-4 slide-in">
            {/* Card 1: Information */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <h3 className="font-semibold text-primary-dark dark:text-white mb-3 flex justify-between">
                <span>Information</span>
                <button onClick={handleBackToStep2} className="text-sm text-primary-blue font-normal underline">Edit</button>
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-slate-500 dark:text-slate-400">Date:</div>
                <div className="font-medium dark:text-white">{new Date().toLocaleDateString('en-GB')}</div>
                
                <div className="text-slate-500 dark:text-slate-400">System:</div>
                <div className="font-medium dark:text-white">{formData.system || '-'}</div>
                
                <div className="text-slate-500 dark:text-slate-400">Location:</div>
                <div className="font-medium dark:text-white">{formData.location || '-'}</div>

                <div className="text-slate-500 dark:text-slate-400">Saved Items:</div>
                <div className="font-medium text-green-600 dark:text-green-400 font-bold">{savedItems.length} items</div>
              </div>
            </div>

            {/* Card 2: Working Area */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 space-y-4">
              <h3 className="font-semibold text-primary-dark dark:text-white border-b pb-2 dark:border-slate-700">Item Details</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">KKS Tag <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white" 
                  value={formData.kksTag} 
                  onChange={e => updateForm({ kksTag: e.target.value })} 
                  placeholder="Enter KKS Tag"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Description <span className="text-red-500">*</span></label>
                <textarea 
                  className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white h-24 resize-none" 
                  value={formData.description} 
                  onChange={e => updateForm({ description: e.target.value })} 
                  placeholder="Describe the issue..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Category <span className="text-slate-400 font-normal">(Optional)</span></label>
                <select 
                  className="w-full p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  value={formData.category} 
                  onChange={e => updateForm({ category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  <option value="A">Category A</option>
                  <option value="B">Category B</option>
                  <option value="C">Category C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Photo <span className="text-slate-400 font-normal">(Optional)</span></label>
                {formData.image ? (
                  <div className="relative">
                    <img src={formData.image} alt="Preview" className="w-full h-48 object-cover rounded-lg border dark:border-slate-700" />
                    <button 
                      onClick={() => updateForm({ image: null })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500 dark:text-slate-400">
                      <Camera size={32} className="mb-2" />
                      <p className="text-sm font-medium">Tap to take a photo or browse</p>
                    </div>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Step 3 Fixed Action Bar */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
            <button 
              onClick={clearStep3}
              className="flex flex-col items-center justify-center p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium"
            >
              <RotateCcw size={20} className="mb-1" />
              Clear
            </button>
            <button 
              onClick={handleSaveAndNext}
              className="flex flex-col items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 text-primary-blue hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-medium"
            >
              <Save size={20} className="mb-1" />
              Save & Next
            </button>
            <button 
              onClick={handleSaveAndDone}
              className="flex flex-col items-center justify-center p-2 bg-primary-blue text-white hover:bg-blue-700 rounded-lg text-xs font-medium"
            >
              <CheckCircle2 size={20} className="mb-1" />
              Save & Done
            </button>
          </div>
        </div>
      )}
      
      {/* Toast notification for saved items */}
      {savedItems.length > 0 && step !== 3 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
          <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-100 px-4 py-3 rounded-lg shadow-lg flex justify-between items-center">
            <span className="font-medium">{savedItems.length} items saved locally</span>
            <button onClick={exportZip} className="text-sm font-bold underline flex items-center gap-1">
              Share Now
            </button>
          </div>
        </div>
      )}

      {/* Download Prompt Popup */}
      {downloadPromptType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden slide-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-primary-blue mx-auto rounded-full flex items-center justify-center mb-4">
                <Share2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Share Your Data</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                You have {savedItems.length} unsaved punch item(s) stored on this device. Please share or download them before you leave to prevent data loss.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button 
                onClick={handlePromptDone}
                className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Skip / Done
              </button>
              <button 
                onClick={handlePromptShare}
                className="flex-1 py-3 flex items-center justify-center gap-2 bg-primary-blue text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:bg-blue-700 transition"
              >
                <Share2 size={18} /> Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for transition */}
      <style>{`
        .slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
