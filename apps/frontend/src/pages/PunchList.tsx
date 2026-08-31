import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Upload, Printer, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import CreateItemModal from '../components/CreateItemModal';
import UploadExcelModal from '../components/UploadExcelModal';
import api from '../services/api';

const PunchList = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState<string>('');
  const [packages, setPackages] = useState<any[]>([]);
  const [projectName, setProjectName] = useState('Power Plant Project');

  const getFullUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:')) return path;
    if (import.meta.env.DEV) {
      return `http://localhost:3000${path}`;
    }
    return path;
  };

  const fetchItems = async () => {
    try {
      const response = await api.get('/punch-items');
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items', error);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUserRole(JSON.parse(userStr).role);
    }
    fetchItems();
    api.get('/settings').then(res => {
      if (res.data.PACKAGES) setPackages(JSON.parse(res.data.PACKAGES));
      if (res.data.PROJECT_NAME) setProjectName(res.data.PROJECT_NAME);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDiscipline, filterCategory, filterStatus, sortField, sortOrder]);

  const filteredItems = items.filter(item => {
    const displayStatus = item.status.replace(/_/g, ' ').replace('SUBMIT TO', 'SUBMITTED TO');
    const matchesSearch = `${item.running_no} ${item.discipline} ${item.category || 'C'} ${item.description} ${displayStatus} ${item.kks_tag || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiscipline = filterDiscipline ? item.discipline === filterDiscipline : true;
    const matchesCategory = filterCategory ? (item.category || 'C') === filterCategory : true;
    const matchesStatus = filterStatus ? item.status === filterStatus : true;

    return matchesSearch && matchesDiscipline && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortField === 'running_no') {
      return sortOrder === 'asc' ? a.running_no.localeCompare(b.running_no) : b.running_no.localeCompare(a.running_no);
    }
    if (sortField === 'discipline') {
      return sortOrder === 'asc' ? a.discipline.localeCompare(b.discipline) : b.discipline.localeCompare(a.discipline);
    }
    if (sortField === 'package') {
      const pkgA = a.package || '';
      const pkgB = b.package || '';
      return sortOrder === 'asc' ? pkgA.localeCompare(pkgB) : pkgB.localeCompare(pkgA);
    }
    // fallback default sort
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredItems.map(item => ({
      'Running No.': item.running_no,
      'Discipline': item.discipline,
      'Package ID': item.package || '',
      'Package Name': packages.find(p => p.id === item.package)?.name || '',
      'System ID': item.system || '',
      'System Description': (() => {
        const pkg = packages.find(p => p.id === item.package);
        if (!pkg) return '';
        const sys = pkg.systems.find((s: any) => (typeof s === 'string' ? s : s.id) === item.system);
        return sys && typeof sys !== 'string' ? sys.description : '';
      })(),
      'Category': item.category || 'C',
      'KKS Tag': item.kks_tag || '',
      'Description': item.description,
      'Status': item.status.replace(/_/g, ' '),
      'Created Date': new Date(item.created_at).toLocaleDateString(),
      'Closed Date': item.status === 'CLOSED' ? new Date(item.updated_at).toLocaleDateString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Punch List");
    XLSX.writeFile(workbook, `PunchList_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4 print:space-y-0 print:block">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Punch List</h1>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-white border border-surface-border text-green-700 px-4 py-2 rounded-md hover:bg-green-50 transition-colors"
          >
            <Upload size={16} className="rotate-180" />
            <span>Export to Excel</span>
          </button>
        {(userRole === 'CONTRACTOR' || userRole === 'ADMIN') && (
          <>
            <button 
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center space-x-2 bg-white border border-surface-border text-primary-dark px-4 py-2 rounded-md hover:bg-surface-app transition-colors"
            >
              <Printer size={16} />
              <span>Print Report</span>
            </button>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-2 bg-white border border-surface-border text-primary-dark px-4 py-2 rounded-md hover:bg-surface-app transition-colors"
            >
              <Upload size={16} />
              <span>Bulk Upload</span>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 bg-primary-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>New Item</span>
            </button>
          </>
        )}
        </div>
      </div>

      <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden print:hidden">
        <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto">
             <input 
              type="text" 
              placeholder="Search in all columns..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 py-2 border border-surface-border rounded-md w-full sm:w-64 focus:outline-none focus:border-primary-blue bg-white" 
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-surface-textMuted bg-surface-app px-3 py-1.5 rounded-md border border-surface-border">
              Found {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 transition-colors px-3 py-2 border rounded-md whitespace-nowrap ${showFilters ? 'bg-primary-blue text-white border-primary-blue' : 'text-surface-textMuted hover:text-primary-dark border-surface-border bg-white'}`}
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-surface-border bg-surface-app flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-surface-textMuted mb-1">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-surface-border rounded px-3 py-1.5 text-sm bg-white">
                <option value="">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="SUBMIT_TO_OE">SUBMITTED TO OE</option>
                <option value="SUBMIT_TO_OWNER">SUBMITTED TO OWNER</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="CANCELED">CANCELED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-textMuted mb-1">Discipline</label>
              <select value={filterDiscipline} onChange={e => setFilterDiscipline(e.target.value)} className="border border-surface-border rounded px-3 py-1.5 text-sm bg-white">
                <option value="">All Disciplines</option>
                <option value="CIV">CIV</option>
                <option value="MEC">MEC</option>
                <option value="ELE">ELE</option>
                <option value="CSI">CSI</option>
                <option value="COM">COM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-textMuted mb-1">Category</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border border-surface-border rounded px-3 py-1.5 text-sm bg-white">
                <option value="">All Categories</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-surface-app text-surface-textMuted border-b border-surface-border">
            <tr>
              <th className="px-6 py-3 font-medium">
                <button onClick={() => handleSort('running_no')} className="flex items-center gap-1 hover:text-primary-blue transition-colors">
                  Running No. <ArrowUpDown size={14} className={sortField === 'running_no' ? 'text-primary-blue' : 'opacity-50'} />
                </button>
              </th>
              <th className="px-6 py-3 font-medium">
                <button onClick={() => handleSort('discipline')} className="flex items-center gap-1 hover:text-primary-blue transition-colors">
                  Discipline <ArrowUpDown size={14} className={sortField === 'discipline' ? 'text-primary-blue' : 'opacity-50'} />
                </button>
              </th>
              <th className="px-6 py-3 font-medium">
                <button onClick={() => handleSort('package')} className="flex items-center gap-1 hover:text-primary-blue transition-colors">
                  Package <ArrowUpDown size={14} className={sortField === 'package' ? 'text-primary-blue' : 'opacity-50'} />
                </button>
              </th>
              <th className="px-6 py-3 font-medium">System</th>
              <th className="px-6 py-3 font-medium">Cat.</th>
              <th className="px-6 py-3 font-medium">Description</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {paginatedItems.map(item => (
              <tr 
                key={item.id}
                onClick={() => navigate(`/punch-list/${item.id}`)}
                className="hover:bg-surface-app transition-colors cursor-pointer"
              >
                <td className="px-6 py-3 font-medium">{item.running_no}</td>
                <td className="px-6 py-3">{item.discipline}</td>
                <td className="px-6 py-3">{item.package || '-'}</td>
                <td className="px-6 py-3">
                  <div>{item.system || '-'}</div>
                  {(() => {
                    const pkg = packages.find(p => p.id === item.package);
                    if (!pkg) return null;
                    const sys = pkg.systems.find((s: any) => (typeof s === 'string' ? s : s.id) === item.system);
                    if (sys && typeof sys !== 'string' && sys.description) {
                      return <div className="text-xs text-surface-textMuted mt-0.5">{sys.description}</div>;
                    }
                    return null;
                  })()}
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    item.category === 'A' ? 'bg-red-100 text-red-800' :
                    item.category === 'B' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.category || 'C'}
                  </span>
                </td>
                <td className="px-6 py-3 truncate max-w-xs">{item.description}</td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${item.status === 'OPEN' ? 'bg-red-100 text-red-800' : 
                      item.status === 'CLOSED' ? 'bg-green-100 text-green-800' : 
                      item.status === 'SUBMIT_TO_OE' ? 'bg-indigo-100 text-indigo-800' : 
                      item.status === 'SUBMIT_TO_OWNER' ? 'bg-purple-100 text-purple-800' : 
                      item.status === 'REJECTED' ? 'bg-orange-100 text-orange-800' : 
                      item.status === 'CANCELED' ? 'bg-gray-200 text-gray-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                    {item.status.replace(/_/g, ' ').replace('SUBMIT TO', 'SUBMITTED TO')}
                  </span>
                </td>
                <td className="px-6 py-3 text-surface-textMuted">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-surface-textMuted">No punch items found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {totalItems > 0 && (
          <div className="p-4 border-t border-surface-border flex items-center justify-between bg-surface-app/50 text-sm">
            <div className="flex items-center space-x-2 text-surface-textMuted">
              <span>Rows per page:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                className="border border-surface-border rounded-md px-2 py-1 bg-white focus:outline-none focus:border-primary-blue text-primary-dark"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-surface-textMuted font-medium">Page {currentPage} of {totalPages || 1}</span>
              <div className="flex space-x-1">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  className="px-3 py-1 border border-surface-border rounded-md bg-white text-primary-dark hover:bg-surface-app disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <button 
                  disabled={currentPage >= totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  className="px-3 py-1 border border-surface-border rounded-md bg-white text-primary-dark hover:bg-surface-app disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="print:hidden">
        <CreateItemModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={fetchItems}
        />
        <UploadExcelModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      </div>

      {/* Print Confirmation Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-primary-blue mb-4 mx-auto">
                <Printer size={24} />
              </div>
              <h3 className="text-lg font-bold text-center text-primary-dark mb-2">Print Report</h3>
              <p className="text-sm text-center text-surface-textMuted mb-6">
                Punch List Report will be printed as PDF as per shown on the current table. Please check the current Punch Items before printing out.
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  className="flex-1 py-2 border border-surface-border text-primary-dark rounded-md hover:bg-surface-app transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setIsPrintModalOpen(false);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="flex-1 py-2 bg-primary-blue text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-md"
                >
                  Confirm Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Layout (Only visible during printing) */}
      <div className="hidden print:block print:w-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        {filteredItems.map((item) => (
          <div key={item.id} className="print-page w-full min-h-[1000px] mb-8 page-break-after-always" style={{ pageBreakAfter: 'always' }}>
            {/* Header */}
            <table className="w-full border-collapse border border-black mb-1">
              <tbody>
                <tr>
                  <td className="border border-black w-1/4 p-2 text-center h-20 align-middle">
                    <img src="/logos/LogoEGAT-EN.png" alt="EGAT Logo" className="max-h-16 mx-auto object-contain" />
                  </td>
                  <td className="border border-black w-2/4 p-2 text-center align-middle">
                    <h1 className="text-2xl font-bold">Punch List Report</h1>
                  </td>
                  <td className="border border-black w-1/4 p-2 text-center h-20 align-middle">
                    <img src="/logos/Sino-Thai_Logo.svg.webp" alt="Sino-Thai Logo" className="max-h-16 mx-auto object-contain" />
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div className="text-right text-sm font-semibold mb-2">
              Running No. <span className="text-blue-600 ml-2">{item.running_no}</span>
            </div>

            {/* Information */}
            <table className="w-full border-collapse border border-black text-sm mb-4">
              <thead>
                <tr>
                  <th colSpan={4} className="border border-black bg-gray-100 p-1 text-center font-bold">Information</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1 font-semibold w-1/4">Project Name:</td>
                  <td colSpan={3} className="border border-black p-1 text-blue-600">{projectName}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-semibold">Package:</td>
                  <td className="border border-black p-1 text-blue-600 w-1/4">{item.package || '-'}</td>
                  <td colSpan={2} className="border border-black p-1 text-blue-600">
                    {packages.find(p => p.id === item.package)?.name || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-semibold">System:</td>
                  <td className="border border-black p-1 text-blue-600">{item.system || '-'}</td>
                  <td colSpan={2} className="border border-black p-1 text-blue-600">
                    {(() => {
                      const pkg = packages.find(p => p.id === item.package);
                      if (!pkg) return '-';
                      const sys = pkg.systems.find((s: any) => (typeof s === 'string' ? s : s.id) === item.system);
                      return sys && typeof sys !== 'string' && sys.description ? sys.description : '-';
                    })()}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-semibold">Created Date</td>
                  <td className="border border-black p-1 text-blue-600">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="border border-black p-1 font-semibold w-1/4">Closed Date</td>
                  <td className="border border-black p-1 text-blue-600">{item.status === 'CLOSED' ? new Date().toLocaleDateString() : '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Comment */}
            <table className="w-full border-collapse border border-black text-sm mb-4">
              <tbody>
                <tr>
                  <td className="border border-black p-1 font-bold bg-gray-100">Comment:</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 text-blue-600 min-h-[60px] align-top">
                    {item.description}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Site Evidence */}
            <table className="w-full border-collapse border border-black text-sm mb-4">
              <thead>
                <tr>
                  <th colSpan={2} className="border border-black bg-gray-100 p-1 text-center font-bold">Site Evidence</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black w-1/2 p-2 h-48 align-top text-blue-600">
                    <div className="mb-2">Before Image_1</div>
                    {item.before_image_path && <img src={getFullUrl(item.before_image_path)} className="max-h-40 object-contain" alt="Before" />}
                  </td>
                  <td className="border border-black w-1/2 p-2 h-48 align-top text-blue-600">
                    <div className="mb-2">After Image_1</div>
                    {item.after_image_path && <img src={getFullUrl(item.after_image_path)} className="max-h-40 object-contain" alt="After" />}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black w-1/2 p-2 h-48 align-top text-blue-600">
                    <div className="mb-2">Before Image_2</div>
                    {item.before_image_2_path && <img src={getFullUrl(item.before_image_2_path)} className="max-h-40 object-contain" alt="Before 2" />}
                  </td>
                  <td className="border border-black w-1/2 p-2 h-48 align-top text-blue-600">
                    <div className="mb-2">After Image_2</div>
                    {item.after_image_2_path && <img src={getFullUrl(item.after_image_2_path)} className="max-h-40 object-contain" alt="After 2" />}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-black p-1 font-bold bg-gray-100">Description:</td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-black p-2 text-blue-600 min-h-[40px] align-top">
                    {item.before_image_desc || item.after_image_desc ? `${item.before_image_desc || ''} ${item.after_image_desc || ''}` : 'Picture Description'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Acknowledge by */}
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr>
                  <th colSpan={3} className="border border-black bg-gray-100 p-1 text-left font-bold">Acknowledge by:</th>
                </tr>
                <tr>
                  <th className="border border-black w-1/3 p-1 text-center font-bold">Contractor</th>
                  <th className="border border-black w-1/3 p-1 text-center font-bold">OE</th>
                  <th className="border border-black w-1/3 p-1 text-center font-bold">Owner</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black h-20 align-bottom p-1 text-center">
                    {(() => {
                      const log = item.history?.find((h: any) => h.action === 'CREATED' || h.action === 'SUBMITTED_TO_OE');
                      if (log && log.user?.signature_image_path) {
                        return <img src={getFullUrl(log.user.signature_image_path)} className="max-h-16 mx-auto object-contain" alt="Signature" />;
                      } else if (log) {
                        return <span className="text-gray-400 italic">Signed</span>;
                      }
                      return null;
                    })()}
                  </td>
                  <td className="border border-black h-20 align-bottom p-1 text-center">
                    {(() => {
                      const log = item.history?.find((h: any) => h.action === 'APPROVED' || h.action === 'SUBMITTED_TO_OWNER');
                      if (log && log.user?.signature_image_path) {
                        return <img src={getFullUrl(log.user.signature_image_path)} className="max-h-16 mx-auto object-contain" alt="Signature" />;
                      } else if (log) {
                        return <span className="text-gray-400 italic">Signed</span>;
                      }
                      return null;
                    })()}
                  </td>
                  <td className="border border-black h-20 align-bottom p-1 text-center">
                    {(() => {
                      const log = item.history?.find((h: any) => h.action === 'CLOSED');
                      if (log && log.user?.signature_image_path) {
                        return <img src={getFullUrl(log.user.signature_image_path)} className="max-h-16 mx-auto object-contain" alt="Signature" />;
                      } else if (log) {
                        return <span className="text-gray-400 italic">Signed</span>;
                      }
                      return null;
                    })()}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1">Name: {item.history?.find((h: any) => h.action === 'CREATED' || h.action === 'SUBMITTED_TO_OE')?.user?.name || ''}</td>
                  <td className="border border-black p-1">Name: {item.history?.find((h: any) => h.action === 'APPROVED' || h.action === 'SUBMITTED_TO_OWNER')?.user?.name || ''}</td>
                  <td className="border border-black p-1">Name: {item.history?.find((h: any) => h.action === 'CLOSED')?.user?.name || ''}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1">Date: {item.history?.some((h: any) => h.action === 'CREATED' || h.action === 'SUBMITTED_TO_OE') ? new Date().toLocaleDateString() : ''}</td>
                  <td className="border border-black p-1">Date: {item.history?.some((h: any) => h.action === 'APPROVED' || h.action === 'SUBMITTED_TO_OWNER') ? new Date().toLocaleDateString() : ''}</td>
                  <td className="border border-black p-1">Date: {item.history?.some((h: any) => h.action === 'CLOSED') ? new Date().toLocaleDateString() : ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PunchList;
