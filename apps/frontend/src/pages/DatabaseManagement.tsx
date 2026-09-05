import React, { useState } from 'react';
import { Download, Upload, AlertTriangle, Database } from 'lucide-react';
import UploadExcelModal from '../components/UploadExcelModal';
import UploadImagesModal from '../components/UploadImagesModal';
import api from '../services/api';

const DatabaseManagement = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  // Retrieve user role from local storage to check if ADMIN
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'ADMIN';

  const handleBackup = async () => {
    try {
      const res = await api.get('/punch-items');
      const items = res.data;
      if (items.length === 0) {
        alert('No punch items found to backup.');
        return;
      }

      // Very simple CSV generation
      const headers = Object.keys(items[0]).join(',');
      const rows = items.map((item: any) => 
        Object.values(item).map(val => 
          `"${String(val).replace(/"/g, '""')}"`
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `Database_Backup_v1.0.0-beta_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (error) {
      console.error(error);
      alert('Failed to generate backup.');
    }
  };

  const handleFactoryReset = async () => {
    if (confirmText !== 'CONFIRM RESET') return;
    
    setIsResetting(true);
    try {
      const res = await api.delete('/settings/factory-reset');
      alert(res.data.message);
      setConfirmText('');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Factory reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8 pb-24">
      <div className="flex items-center space-x-3">
        <Database size={28} className="text-primary-blue" />
        <h1 className="text-2xl font-bold text-primary-dark">Database Management</h1>
      </div>

      <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-surface-border overflow-x-auto bg-surface-app">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'upload' ? 'bg-white text-primary-blue border-b-2 border-primary-blue' : 'text-surface-textMuted hover:text-primary-dark hover:bg-white/50'
            }`}
          >
            Bulk Upload Punch Items
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'backup' ? 'bg-white text-primary-blue border-b-2 border-primary-blue' : 'text-surface-textMuted hover:text-primary-dark hover:bg-white/50'
            }`}
          >
            Database Backup
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('reset')}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'reset' ? 'bg-red-50 text-red-600 border-b-2 border-red-600' : 'text-red-400 hover:text-red-600 hover:bg-red-50/50'
              }`}
            >
              Factory Reset
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="max-w-2xl space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 text-primary-blue rounded-lg shrink-0">
                  <Upload size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary-dark">Bulk Upload Punch Items</h2>
                  <p className="text-surface-textMuted mt-1">
                    Upload an Excel (.xlsx) file to quickly create or update multiple punch items. 
                    The system will automatically map records based on the unique running number.
                  </p>
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="mt-4 bg-primary-blue text-white px-5 py-2.5 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Upload Excel
                  </button>
                </div>
              </div>
              <div className="flex items-start space-x-4 pt-6 border-t border-surface-border mt-6">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                  <Upload size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary-dark">Bulk Upload Images</h2>
                  <p className="text-surface-textMuted mt-1">
                    Upload multiple images at once to attach to punch items. 
                    Filenames must follow the pattern: <code>[RunningNo]_[before/after]_[1/2].jpg</code> (e.g. <code>ELE-2026-0034_before_1.jpg</code>).
                  </p>
                  <button 
                    onClick={() => setIsImageUploadModalOpen(true)}
                    className="mt-4 bg-purple-600 text-white px-5 py-2.5 rounded-md hover:bg-purple-700 transition-colors font-medium"
                  >
                    Upload Multiple Images
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="max-w-2xl space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-50 text-status-closed rounded-lg shrink-0">
                  <Download size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary-dark">Database Backup (Export All)</h2>
                  <p className="text-surface-textMuted mt-1">
                    Download the entire transactional database (all Punch Items) regardless of status or filters. 
                    This export is generated in real-time as a CSV file and is tagged with the current system version (v1.0.0-beta) for safe keeping.
                  </p>
                  <button 
                    onClick={handleBackup}
                    className="mt-4 bg-status-closed text-white px-5 py-2.5 rounded-md hover:bg-green-600 transition-colors font-medium"
                  >
                    Download CSV Backup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Tab */}
          {activeTab === 'reset' && isAdmin && (
            <div className="max-w-2xl space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-lg shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-4 w-full">
                  <div>
                    <h2 className="text-lg font-bold text-red-600">Danger Zone: Factory Reset</h2>
                    <p className="text-surface-textMuted mt-1">
                      This action is irreversible. It will wipe out all transactional data to prepare for production.
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <h3 className="font-semibold text-red-800 text-sm mb-2">The following data WILL BE DELETED:</h3>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      <li>All Punch Items (including image files)</li>
                      <li>All Punch Item History Logs</li>
                      <li>System Progress (Walkdown Completion)</li>
                    </ul>
                    
                    <h3 className="font-semibold text-green-800 text-sm mt-4 mb-2">The following data WILL BE KEPT:</h3>
                    <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                      <li>User Accounts & Signatures</li>
                      <li>System Settings (Project Name, Packages, Disciplines)</li>
                      <li>Email Configuration</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-medium text-surface-textMuted mb-2">
                      To confirm, type <span className="font-mono bg-gray-100 px-1 rounded text-red-600 font-bold">CONFIRM RESET</span> below:
                    </label>
                    <input 
                      type="text" 
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="CONFIRM RESET"
                      className="w-full max-w-sm border-red-300 border rounded-md px-3 py-2 text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    />
                  </div>

                  <button 
                    onClick={handleFactoryReset}
                    disabled={confirmText !== 'CONFIRM RESET' || isResetting}
                    className="w-full max-w-sm bg-red-600 text-white font-bold py-3 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <AlertTriangle size={18} />
                    <span>{isResetting ? 'Wiping Database...' : 'Erase All Transactional Data'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <UploadExcelModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
      />
      <UploadImagesModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        onSuccess={() => {
          setIsImageUploadModalOpen(false);
          alert('Images uploaded successfully');
        }}
      />
    </div>
  );
};

export default DatabaseManagement;
