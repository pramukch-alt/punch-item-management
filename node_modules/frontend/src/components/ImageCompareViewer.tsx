import React, { useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface ImageCompareViewerProps {
  beforeImage?: string | null;
  beforeImage2?: string | null;
  afterImage?: string | null;
  afterImage2?: string | null;
  beforeDesc?: string | null;
  afterDesc?: string | null;
  onBeforeDescSave?: (desc: string) => void;
  onAfterDescSave?: (desc: string) => void;
  onBeforeUpload?: (file: File, index: 1 | 2) => void;
  onAfterUpload?: (file: File, index: 1 | 2) => void;
  canEditDesc?: boolean;
}

const ImageCompareViewer: React.FC<ImageCompareViewerProps> = ({ 
  beforeImage, 
  beforeImage2,
  afterImage, 
  afterImage2,
  beforeDesc,
  afterDesc,
  onBeforeDescSave,
  onAfterDescSave,
  onBeforeUpload, 
  onAfterUpload,
  canEditDesc
}) => {
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'before' | 'after'>('side-by-side');
  
  const [tempBeforeDesc, setTempBeforeDesc] = useState(beforeDesc || '');
  const [tempAfterDesc, setTempAfterDesc] = useState(afterDesc || '');

  React.useEffect(() => {
    setTempBeforeDesc(beforeDesc || '');
  }, [beforeDesc]);

  React.useEffect(() => {
    setTempAfterDesc(afterDesc || '');
  }, [afterDesc]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after', index: 1 | 2) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (type === 'before' && onBeforeUpload) onBeforeUpload(file, index);
      if (type === 'after' && onAfterUpload) onAfterUpload(file, index);
    }
  };

  const ImageBox = ({ 
    src, 
    type, 
    index,
    label 
  }: { 
    src?: string | null, 
    type: 'before' | 'after', 
    index: 1 | 2,
    label: string 
  }) => (
    <div className="flex-1 flex flex-col items-center justify-center border border-surface-border rounded-md bg-surface-app p-2 min-h-[250px] relative overflow-hidden group">
      <div className="absolute top-2 left-2 bg-surface-card px-2 py-1 text-xs font-semibold rounded shadow-sm z-10">
        {label}
      </div>
      
      {src ? (
        <img src={src} alt={label} className="w-full h-full object-contain" />
      ) : (
        <div className="flex flex-col items-center text-surface-textMuted">
          <CameraOff size={48} className="mb-2 opacity-50" />
          <span className="text-sm">No image provided</span>
        </div>
      )}

      {/* Upload Overlay */}
      {((type === 'before' && onBeforeUpload) || (type === 'after' && onAfterUpload)) && (
        <label className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
          <div className="bg-white text-primary-dark px-4 py-2 rounded-md flex items-center space-x-2 font-medium">
            <Camera size={18} />
            <span>Upload {label}</span>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleFileUpload(e, type, index)}
          />
        </label>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-center space-x-2">
        <button 
          onClick={() => setActiveTab('side-by-side')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'side-by-side' ? 'bg-primary-blue text-white' : 'bg-surface-app text-surface-textMuted hover:bg-gray-200'}`}
        >
          Side-by-Side
        </button>
        <button 
          onClick={() => setActiveTab('before')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'before' ? 'bg-primary-blue text-white' : 'bg-surface-app text-surface-textMuted hover:bg-gray-200'}`}
        >
          Before Only
        </button>
        <button 
          onClick={() => setActiveTab('after')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'after' ? 'bg-primary-blue text-white' : 'bg-surface-app text-surface-textMuted hover:bg-gray-200'}`}
        >
          After Only
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(activeTab === 'side-by-side' || activeTab === 'before') && (
          <div className="space-y-2">
            <ImageBox src={beforeImage} type="before" index={1} label="Before (Image 1)" />
            <ImageBox src={beforeImage2} type="before" index={2} label="Before (Image 2)" />
            {canEditDesc ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={tempBeforeDesc} 
                  onChange={e => setTempBeforeDesc(e.target.value)} 
                  placeholder="Before description..." 
                  className="flex-1 text-sm border rounded px-3 py-2"
                />
                <button onClick={() => onBeforeDescSave && onBeforeDescSave(tempBeforeDesc)} className="bg-primary-blue text-white px-3 py-1 rounded text-sm">Save</button>
              </div>
            ) : (
              beforeDesc && <div className="text-sm text-surface-textMuted p-2 bg-gray-50 rounded border">{beforeDesc}</div>
            )}
          </div>
        )}
        {(activeTab === 'side-by-side' || activeTab === 'after') && (
          <div className="space-y-2">
            <ImageBox src={afterImage} type="after" index={1} label="After (Image 1)" />
            <ImageBox src={afterImage2} type="after" index={2} label="After (Image 2)" />
            {canEditDesc ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={tempAfterDesc} 
                  onChange={e => setTempAfterDesc(e.target.value)} 
                  placeholder="After description..." 
                  className="flex-1 text-sm border rounded px-3 py-2"
                />
                <button onClick={() => onAfterDescSave && onAfterDescSave(tempAfterDesc)} className="bg-primary-blue text-white px-3 py-1 rounded text-sm">Save</button>
              </div>
            ) : (
              afterDesc && <div className="text-sm text-surface-textMuted p-2 bg-gray-50 rounded border">{afterDesc}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCompareViewer;
