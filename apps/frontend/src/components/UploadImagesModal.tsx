import React, { useState, useRef } from 'react';
import { X, Upload, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';

interface UploadImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadImagesModal: React.FC<UploadImagesModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const pattern = /^([A-Za-z0-9]+-\d+-\d+)_(before|after)_(1|2)(?:\.[a-zA-Z0-9]+)?$/i;
      
      const invalidFiles = filesArray.filter(file => !pattern.test(file.name));
      
      if (invalidFiles.length > 0) {
        setErrorMsg(`Found ${invalidFiles.length} file(s) with invalid names. Pattern required: [RunningNo]_[before/after]_[1/2].jpg (e.g. ELE-2026-0034_before_1.jpg)`);
        setSuccessMsg(null);
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setSelectedFiles(filesArray);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setErrorMsg(null);
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const res = await api.post('/punch-items/bulk-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMsg(res.data.message);
      if (res.data.errors && res.data.errors.length > 0) {
        setErrorMsg(`Some files failed to process: ${res.data.errors.join(', ')}`);
      }
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-surface-border">
          <h2 className="text-xl font-bold text-primary-dark">Bulk Upload Images</h2>
          <button onClick={onClose} className="text-surface-textMuted hover:text-primary-dark transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md border border-red-200 text-sm flex items-start">
              <AlertCircle size={18} className="mr-2 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-md border border-green-200 text-sm flex items-center">
              <CheckCircle size={18} className="mr-2" />
              {successMsg}
            </div>
          )}

          <div className="border-2 border-dashed border-primary-blue/30 rounded-lg p-8 text-center bg-blue-50/30">
            <input 
              type="file" 
              multiple 
              accept="image/jpeg,image/png,image/jpg" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary-blue text-white px-5 py-2.5 rounded-md hover:bg-blue-700 transition-colors font-medium mb-3"
            >
              Select Images
            </button>
            <p className="text-sm text-surface-textMuted">You can select multiple files at once.</p>
            <p className="text-xs text-primary-blue mt-2 font-medium">Filename must be: [RunningNo]_[before/after]_[1/2].jpg</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-primary-dark mb-2">Selected Files ({selectedFiles.length}):</h3>
              <ul className="text-sm text-surface-textMuted max-h-40 overflow-y-auto space-y-1 bg-surface-app p-2 rounded border border-surface-border">
                {selectedFiles.map((file, i) => (
                  <li key={i} className="flex items-center">
                    <FileImage size={14} className="mr-2 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-border bg-surface-app flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border border-surface-border rounded-md text-surface-textMuted hover:text-primary-dark hover:bg-white transition-colors font-medium"
          >
            Close
          </button>
          <button 
            onClick={handleUpload} 
            disabled={selectedFiles.length === 0 || loading}
            className="px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center font-medium"
          >
            {loading ? 'Uploading...' : <><Upload size={18} className="mr-2" /> Upload Images</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadImagesModal;
