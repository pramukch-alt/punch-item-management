import React, { useState } from 'react';
import Modal from './Modal';
import { UploadCloud } from 'lucide-react';
import api from '../services/api';

interface UploadExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadExcelModal: React.FC<UploadExcelModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/punch-items/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert(`Import complete!\nImported: ${response.data.importedCount} items\nUpdated: ${response.data.updatedCount} items`);
      onClose();
      // Reload page or trigger fetch items
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert('Failed to upload Excel file. Ensure it has the correct columns.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Excel Upload">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="border-2 border-dashed border-surface-border rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-surface-app transition-colors relative">
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud size={40} className="text-primary-blue mb-4" />
          <h3 className="font-medium text-primary-dark">
            {file ? file.name : 'Click or drag file to this area to upload'}
          </h3>
          <p className="text-surface-textMuted text-sm mt-1">
            Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files.
          </p>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border border-surface-border rounded-md text-surface-textMuted hover:bg-surface-app transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={!file}
            className="px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadExcelModal;
