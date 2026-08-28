import React, { useState } from 'react';
import Modal from './Modal';
import { AlertCircle } from 'lucide-react';
import api from '../services/api';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);

  const [discipline, setDiscipline] = useState('CIV');
  const [category, setCategory] = useState('C');
  const [pkg, setPkg] = useState('');
  const [system, setSystem] = useState('');
  const [kksTag, setKksTag] = useState('');
  const [description, setDescription] = useState('');
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  // Admin can select any discipline, others are restricted to their assigned discipline
  const userDiscipline = user?.role === 'ADMIN' ? null : user?.discipline;

  React.useEffect(() => {
    if (isOpen) {
      api.get('/settings').then(res => {
        const pkgs = res.data.PACKAGES ? JSON.parse(res.data.PACKAGES) : [];
        const disc = res.data.DISCIPLINES ? JSON.parse(res.data.DISCIPLINES) : [];
        setPackages(pkgs);
        setDisciplines(disc);
        if (pkgs.length > 0) setPkg(pkgs[0].id);
        
        if (userDiscipline) {
          setDiscipline(userDiscipline);
        } else if (disc.length > 0) {
          setDiscipline(disc[0].id);
        }
      }).catch(err => console.error(err));
    }
  }, [isOpen, userDiscipline]);

  // Auto update system when package changes
  React.useEffect(() => {
    if (pkg && packages.length > 0) {
      const selectedPkg = packages.find(p => p.id === pkg);
      if (selectedPkg && selectedPkg.systems.length > 0) {
        const firstSys = selectedPkg.systems[0];
        setSystem(typeof firstSys === 'string' ? firstSys : firstSys.id);
      } else {
        setSystem('');
      }
    }
  }, [pkg, packages]);

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
            disabled={!!userDiscipline}
            className={`w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue ${userDiscipline ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          >
            {disciplines.map(d => (
              <option key={d.id} value={d.id}>{d.id} - {d.name}</option>
            ))}
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
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
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
              {(packages.find(p => p.id === pkg)?.systems || []).map((s: any) => {
                const sId = typeof s === 'string' ? s : s.id;
                const sName = typeof s === 'string' ? s : `${s.id} - ${s.description}`;
                return <option key={sId} value={sId}>{sName}</option>;
              })}
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
