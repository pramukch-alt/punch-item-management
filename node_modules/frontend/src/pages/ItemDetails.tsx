import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Send, Clock } from 'lucide-react';
import ImageCompareViewer from '../components/ImageCompareViewer';
import RejectModal from '../components/RejectModal';
import EditItemModal from '../components/EditItemModal';
import api from '../services/api';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleReply = async () => {
    if (!replyText) return;
    try {
      await api.post(`/punch-items/${id}/reply`, { comment: replyText });
      setReplyText('');
      setIsReplying(false);
      fetchItemDetails();
    } catch (error) {
      console.error(error);
      alert('Reply failed');
    }
  };

  const handleDescSave = async (desc: string, field: string) => {
    try {
      await api.put(`/punch-items/${id}`, { [field]: desc });
      fetchItemDetails();
    } catch (error) {
      alert('Failed to save description');
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUserRole(JSON.parse(userStr).role);
    }
  }, []);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/punch-items/${id}`);
      setItem(response.data);
      setHistory(response.data.history || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const handleAction = async (action: string) => {
    try {
      await api.post(`/punch-items/${id}/${action}`);
      fetchItemDetails();
    } catch (error) {
      console.error(error);
      alert('Action failed');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Item not found</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-surface-textMuted hover:text-primary-dark transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-3">
            <span>{item.running_no}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
              ${item.status === 'OPEN' ? 'bg-red-100 text-status-open' : 
                item.status === 'CLOSED' ? 'bg-green-100 text-status-closed' : 
                'bg-blue-100 text-primary-blue'}`}>
              {item.status.replace(/_/g, ' ').replace('SUBMIT TO', 'SUBMITTED TO')}
            </span>
          </h1>
          <p className="text-surface-textMuted text-sm mt-1">{item.discipline} Discipline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-card p-5 rounded-lg shadow-sm border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary-dark">Description</h2>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                  item.category === 'A' ? 'bg-red-100 text-red-800 border border-red-200' :
                  item.category === 'B' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                  'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  Category {item.category || 'C'}
                </span>
                {(userRole === 'CONTRACTOR' || userRole === 'ADMIN') && (
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors border border-gray-300"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {item.package && (
                <div>
                  <span className="text-xs font-semibold text-surface-textMuted uppercase tracking-wider">Package</span>
                  <p className="text-sm font-medium text-primary-dark">{item.package}</p>
                </div>
              )}
              {item.system && (
                <div>
                  <span className="text-xs font-semibold text-surface-textMuted uppercase tracking-wider">System</span>
                  <p className="text-sm font-medium text-primary-dark">{item.system}</p>
                </div>
              )}
              {item.kks_tag && (
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-surface-textMuted uppercase tracking-wider">KKS Tag</span>
                  <p className="text-sm font-medium text-primary-dark">{item.kks_tag}</p>
                </div>
              )}
            </div>
            <div className="mt-2 border-t border-surface-border pt-4">
              <span className="text-xs font-semibold text-surface-textMuted uppercase tracking-wider">Issue Description</span>
              <p className="text-surface-textMuted mt-1">{item.description}</p>
            </div>
          </div>

          {/* Reject Reason Card */}
          {item.status !== 'CLOSED' && item.status !== 'CANCELED' && history.some(h => h.action === 'REJECTED') && (
            <div className="p-5 rounded-lg shadow-sm border border-[#FFE699]" style={{ backgroundColor: '#FFF2CC' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <XCircle className="text-orange-600" size={20} />
                  <h2 className="text-lg font-semibold text-orange-800">Reject Reason / Remarks</h2>
                </div>
                {(userRole === 'CONTRACTOR' || userRole === 'ADMIN') && !isReplying && (
                  <button 
                    onClick={() => setIsReplying(true)}
                    className="text-xs font-semibold text-primary-blue hover:underline bg-blue-50 px-2 py-1 rounded border border-blue-200"
                  >
                    Reply
                  </button>
                )}
              </div>
              
              <p className="text-orange-900 mt-1">
                {history.find(h => h.action === 'REJECTED')?.comment || 'No reason provided.'}
              </p>
              <div className="mt-3 text-xs text-orange-700/80">
                Rejected by: {history.find(h => h.action === 'REJECTED')?.user?.name || history.find(h => h.action === 'REJECTED')?.user?.email || 'Unknown'}
              </div>

              {/* Show previous replies */}
              {history.filter(h => h.action === 'REPLIED').map(reply => (
                <div key={reply.id} className="mt-3 p-3 bg-white/60 rounded border border-orange-200">
                  <p className="text-sm text-gray-800"><strong>Reply:</strong> {reply.comment}</p>
                  <p className="text-xs text-gray-500 mt-1">By {reply.user?.name || reply.user?.email || 'Unknown'} • {new Date(reply.timestamp).toLocaleString()}</p>
                </div>
              ))}

              {isReplying && (
                <div className="mt-4 space-y-2">
                  <textarea 
                    className="w-full p-2 text-sm border border-orange-300 rounded bg-white" 
                    rows={3} 
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsReplying(false)} className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                    <button onClick={handleReply} className="px-3 py-1 text-xs bg-primary-blue text-white rounded hover:bg-blue-700">Submit Reply</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-surface-card p-5 rounded-lg shadow-sm border border-surface-border">
            <h2 className="text-lg font-semibold mb-4 text-primary-dark">Site Evidence</h2>
            <ImageCompareViewer 
              beforeImage={item.before_image_path ? item.before_image_path : undefined} 
              beforeImage2={item.before_image_2_path ? item.before_image_2_path : undefined} 
              afterImage={item.after_image_path ? item.after_image_path : undefined} 
              afterImage2={item.after_image_2_path ? item.after_image_2_path : undefined} 
              beforeDesc={item.before_image_desc}
              afterDesc={item.after_image_desc}
              canEditDesc={userRole === 'CONTRACTOR' || userRole === 'ADMIN'}
              onBeforeDescSave={(desc) => handleDescSave(desc, 'before_image_desc')}
              onAfterDescSave={(desc) => handleDescSave(desc, 'after_image_desc')}
              onBeforeUpload={(userRole === 'CONTRACTOR' || userRole === 'ADMIN') ? async (file, index) => {
                if (file.size > 1024 * 1024) return alert('File size exceeds 1MB limit');
                const formData = new FormData();
                formData.append(index === 1 ? 'before_image' : 'before_image_2', file);
                try {
                  await api.put(`/punch-items/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  fetchItemDetails();
                } catch (error: any) {
                  alert(error.response?.data?.message || 'Failed to upload before image');
                }
              } : undefined}
              onAfterUpload={(userRole === 'CONTRACTOR' || userRole === 'ADMIN') ? async (file, index) => {
                if (file.size > 1024 * 1024) return alert('File size exceeds 1MB limit');
                const formData = new FormData();
                formData.append(index === 1 ? 'after_image' : 'after_image_2', file);
                try {
                  await api.put(`/punch-items/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  fetchItemDetails();
                } catch (error: any) {
                  alert(error.response?.data?.message || 'Failed to upload after image');
                }
              } : undefined}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface-card p-5 rounded-lg shadow-sm border border-surface-border">
            <h2 className="text-lg font-semibold mb-4 text-primary-dark">Actions</h2>
            <div className="space-y-3">
              {(userRole === 'CONTRACTOR' || userRole === 'ADMIN') && (
                <button 
                  onClick={() => handleAction('submit-oe')}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Send size={18} />
                  <span>Submit to OE</span>
                </button>
              )}
              
              {(userRole === 'OE' || userRole === 'ADMIN') && (
                <button 
                  onClick={() => handleAction('submit-owner')}
                  className="w-full flex items-center justify-center space-x-2 bg-status-submitToOwner text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Send size={18} />
                  <span>Approve & Submit to Owner</span>
                </button>
              )}
              
              {(userRole === 'OE' || userRole === 'OWNER' || userRole === 'ADMIN') && (
                <button 
                  onClick={() => setIsRejectModalOpen(true)}
                  className="w-full flex items-center justify-center space-x-2 bg-status-rejected text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                >
                  <XCircle size={18} />
                  <span>Reject to Contractor</span>
                </button>
              )}
              
              {(userRole === 'OWNER' || userRole === 'ADMIN') && (
                <button 
                  onClick={() => handleAction('close')}
                  className="w-full flex items-center justify-center space-x-2 bg-status-closed text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  <CheckCircle size={18} />
                  <span>Close Item</span>
                </button>
              )}

              {(userRole === 'CONTRACTOR' || userRole === 'ADMIN') && (
                <button 
                  onClick={() => handleAction('cancel')}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors mt-4"
                >
                  <XCircle size={18} />
                  <span>Cancel Item</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-surface-card p-5 rounded-lg shadow-sm border border-surface-border">
            <h2 className="text-lg font-semibold mb-4 text-primary-dark">Audit History</h2>
            <div className="space-y-4">
              {history.map((log) => {
                const actionColors: Record<string, string> = {
                  'CREATED': 'bg-status-open',
                  'SUBMITTED_TO_OE': 'bg-status-submitToOe',
                  'SUBMITTED_TO_OWNER': 'bg-status-submitToOwner',
                  'APPROVED': 'bg-status-closed',
                  'REJECTED': 'bg-status-rejected',
                  'CANCELED': 'bg-status-canceled',
                  'UPDATED': 'bg-primary-blue'
                };
                
                return (
                  <div key={log.id} className="relative pl-4 border-l-2 border-surface-border">
                    <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full ${actionColors[log.action] || 'bg-gray-400'}`}></div>
                    <p className="text-sm font-medium text-primary-dark">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-surface-textMuted">
                      by {log.user?.name || log.user?.email || 'Unknown'} • {new Date(log.timestamp).toLocaleString()}
                    </p>
                    {log.comment && (
                      <p className="text-xs text-surface-textMuted mt-1 italic">"{log.comment}"</p>
                    )}
                  </div>
                );
              })}
              {history.length === 0 && (
                <p className="text-sm text-surface-textMuted">No history logs found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <RejectModal 
        isOpen={isRejectModalOpen} 
        onClose={() => setIsRejectModalOpen(false)} 
        itemId={id || ''}
        onSuccess={fetchItemDetails}
      />

      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={item}
        onSuccess={fetchItemDetails}
      />
    </div>
  );
};

export default ItemDetails;
