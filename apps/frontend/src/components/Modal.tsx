import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-surface-card rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-primary-dark">{title}</h2>
          <button 
            onClick={onClose}
            className="text-surface-textMuted hover:text-primary-dark transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
