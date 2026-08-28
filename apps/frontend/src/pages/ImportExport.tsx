import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import UploadExcelModal from '../components/UploadExcelModal';

const ImportExport = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-dark">Import / Export</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Card */}
        <div className="bg-surface-card p-6 rounded-lg shadow-sm border border-surface-border flex flex-col items-start space-y-4">
          <div className="p-3 bg-blue-50 text-primary-blue rounded-lg">
            <Upload size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary-dark">Bulk Upload Punch Items</h2>
            <p className="text-surface-textMuted text-sm mt-1">
              Upload an Excel (.xlsx) file to quickly create or update multiple punch items. 
              The system will automatically map records based on the unique running number.
            </p>
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-2 bg-primary-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Upload Excel
          </button>
        </div>

        {/* Export Card */}
        <div className="bg-surface-card p-6 rounded-lg shadow-sm border border-surface-border flex flex-col items-start space-y-4">
          <div className="p-3 bg-green-50 text-status-closed rounded-lg">
            <Download size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary-dark">Database Backup (Export All)</h2>
            <p className="text-surface-textMuted text-sm mt-1">
              Download the entire database records including all punch items, regardless of status or filters.
              Useful for periodic data backups or mass offline archiving.
            </p>
          </div>
          <button 
            className="mt-2 bg-status-closed text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
            onClick={() => alert('Database Backup feature will be implemented soon.')}
          >
            Backup Database
          </button>
        </div>
      </div>

      <UploadExcelModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </div>
  );
};

export default ImportExport;
