import React, { useState } from 'react';
import Modal from './Modal';
import { AlertCircle } from 'lucide-react';
import api from '../services/api';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

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

const CreateItemModal: React.FC<CreateItemModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [discipline, setDiscipline] = useState('CIV');
  const [category, setCategory] = useState('C');
  const [pkg, setPkg] = useState('A01');
  const [system, setSystem] = useState('A01-1');
  const [kksTag, setKksTag] = useState('');
  const [description, setDescription] = useState('');
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto update system when package changes
  React.useEffect(() => {
    if (pkg && SYSTEMS[pkg]) {
      setSystem(SYSTEMS[pkg][0].id);
    }
  }, [pkg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    if (beforeImage && beforeImage.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('discipline', discipline);
      formData.append('category', category);
      formData.append('package', pkg);
      formData.append('system', system);
      if (kksTag.trim()) formData.append('kks_tag', kksTag.trim());
      formData.append('description', description);
      if (beforeImage) formData.append('before_image', beforeImage);

      await api.post('/punch-items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDescription('');
      setBeforeImage(null);
      setDiscipline('CIV');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Punch Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-textMuted mb-1">Discipline</label>
          <select 
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue bg-white"
          >
            <option value="CIV">CIV - Civil</option>
            <option value="MEC">MEC - Mechanical</option>
            <option value="ELE">ELE - Electrical</option>
            <option value="CSI">CSI - Control System & Instrument</option>
            <option value="COM">COM - Commissioning</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">Package</label>
            <select 
              value={pkg}
              onChange={(e) => setPkg(e.target.value)}
              className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue bg-white"
            >
              {PACKAGES.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-dark mb-1">System</label>
            <select 
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue bg-white"
            >
              {(SYSTEMS[pkg] || []).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Category (Priority)</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue bg-white"
          >
            <option value="A">A - High / Urgent</option>
            <option value="B">B - Medium</option>
            <option value="C">C - Low / Normal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">KKS Tag (Optional)</label>
          <input 
            type="text"
            value={kksTag}
            onChange={(e) => setKksTag(e.target.value)}
            className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue bg-white"
            placeholder="e.g. 10LAB10 CT001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue min-h-[100px]"
            placeholder="Describe the issue..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">
            Before Image (Optional)
          </label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setBeforeImage(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none text-sm"
          />
          <p className="text-xs text-orange-600 mt-1 flex items-center">
            <AlertCircle size={12} className="mr-1" />
            Maximum file size allowed is 2MB.
          </p>
        </div>
        
        {error && <div className="text-red-600 text-sm">{error}</div>}

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
            disabled={loading}
            className="px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateItemModal;
