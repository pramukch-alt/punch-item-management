import { useState } from 'react';
import Modal from './Modal';
import { AlertCircle } from 'lucide-react';
import api from '../services/api';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  onSuccess?: () => void;
}

const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, itemId, onSuccess }) => {
  const [comment, setComment] = useState('');
  const [, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    try {
      await api.post(`/punch-items/${itemId}/reject`, { comment });
      setComment('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Reject failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Punch Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-orange-50 border-l-4 border-status-rejected p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-status-rejected" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                You are about to reject this item and send it back to the Contractor. A reason is mandatory.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-textMuted mb-1">Rejection Reason <span className="text-status-open">*</span></label>
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-2 border border-surface-border rounded-md focus:outline-none focus:border-primary-blue h-32 resize-none"
            placeholder="Please detail why this item is being rejected..."
            required
          />
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
            disabled={!comment.trim()}
            className="px-4 py-2 bg-status-rejected text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            Reject Item
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectModal;
