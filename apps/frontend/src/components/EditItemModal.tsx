import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  item: any;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, onSuccess, item }) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [disciplines, setDisciplines] = useState<any[]>([]);

  const [discipline, setDiscipline] = useState('CIV');
  const [category, setCategory] = useState('C');
  const [pkg, setPkg] = useState('');
  const [system, setSystem] = useState('');
  const [kksTag, setKksTag] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/settings').then(res => {
        const pkgs = res.data.PACKAGES ? JSON.parse(res.data.PACKAGES) : [];
        const disc = res.data.DISCIPLINES ? JSON.parse(res.data.DISCIPLINES) : [];
        setPackages(pkgs);
        setDisciplines(disc);
      }).catch(err => console.error(err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      setDiscipline(item.discipline || 'CIV');
      setCategory(item.category || 'C');
      setPkg(item.package || '');
      setSystem(item.system || '');
      setKksTag(item.kks_tag || '');
      setDescription(item.description || '');
    }
  }, [item]);

  // Auto update system when package changes if not set
  useEffect(() => {
    if (pkg && packages.length > 0) {
      const selectedPkg = packages.find(p => p.id === pkg);
      if (selectedPkg && selectedPkg.systems.length > 0) {
        const exists = selectedPkg.systems.find((s: any) => (typeof s === 'string' ? s : s.id) === system);
        if (!exists) {
          const firstSys = selectedPkg.systems[0];
          setSystem(typeof firstSys === 'string' ? firstSys : firstSys.id);
        }
      } else {
        setSystem('');
      }
    }
  }, [pkg, packages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('discipline', discipline);
      formData.append('category', category);
      formData.append('package', pkg);
      formData.append('system', system);
      formData.append('kks_tag', kksTag.trim());
      formData.append('description', description);

      await api.put(`/punch-items/${item.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Item: ${item?.running_no}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary-dark mb-1">Discipline</label>
          <select 
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue bg-white"
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

        <div className="pt-4 flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-surface-textMuted hover:text-primary-dark transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditItemModal;
