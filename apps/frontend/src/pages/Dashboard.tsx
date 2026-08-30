import { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [items, setItems] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/punch-items');
        setItems(response.data);
      } catch (error) {
        console.error('Failed to fetch items', error);
      }
    };
    fetchItems();
  }, []);

  const filteredItems = items.filter(item => {
    if (item.status === 'CANCELED') return false;
    const itemDate = new Date(item.created_at).toISOString().split('T')[0];
    const isAfterStart = startDate ? itemDate >= startDate : true;
    const isBeforeEnd = endDate ? itemDate <= endDate : true;
    return isAfterStart && isBeforeEnd;
  });

  const getMetrics = (itemList: any[]) => {
    const total = itemList.length;
    const open = itemList.filter(i => i.status === 'OPEN' || i.status === 'REJECTED').length;
    const pending = itemList.filter(i => i.status === 'SUBMIT_TO_OE' || i.status === 'SUBMIT_TO_OWNER').length;
    const closed = itemList.filter(i => i.status === 'CLOSED').length;
    const progress = total > 0 ? Math.round((closed / total) * 100) : 0;
    return { total, open, pending, closed, progress };
  };

  const overall = getMetrics(filteredItems);

  const disciplines = ['CIV', 'MEC', 'ELE', 'CSI', 'COM'];
  const disciplineData = disciplines.map(disc => {
    const discItems = filteredItems.filter(i => i.discipline === disc);
    return { discipline: disc, ...getMetrics(discItems) };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-dark">Dashboard</h1>
      </div>
      
      <div>
        <h2 className="text-xl font-bold text-primary-dark mb-4">Overall Plant</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="bg-surface-card p-6 rounded-lg shadow-sm border border-surface-border border-l-4 border-l-primary-blue">
            <h3 className="text-surface-textMuted text-sm font-medium">Total Items</h3>
            <p className="text-3xl font-bold mt-2 text-primary-dark">{overall.total}</p>
          </div>
          <div className="bg-surface-card p-6 rounded-lg shadow-sm border border-surface-border border-l-4 border-l-status-open">
            <h3 className="text-surface-textMuted text-sm font-medium">Open</h3>
            <p className="text-3xl font-bold mt-2 text-primary-dark">{overall.open}</p>
          </div>
          <div className="bg-surface-card p-6 rounded-lg shadow-sm border border-surface-border border-l-4 border-l-status-submitToOe">
            <h3 className="text-surface-textMuted text-sm font-medium">Pending Review</h3>
            <p className="text-3xl font-bold mt-2 text-primary-dark">{overall.pending}</p>
          </div>
          <div className="bg-surface-card p-6 rounded-lg shadow-sm border border-surface-border border-l-4 border-l-status-closed">
            <h3 className="text-surface-textMuted text-sm font-medium">Closed</h3>
            <p className="text-3xl font-bold mt-2 text-primary-dark">{overall.closed}</p>
          </div>
          <div className="bg-surface-card p-6 rounded-lg shadow-sm border border-surface-border border-l-4 border-l-green-500 flex flex-col justify-between">
            <h3 className="text-surface-textMuted text-sm font-medium">Progress</h3>
            <div className="flex items-end space-x-2 mt-2">
              <p className="text-3xl font-bold text-green-600">{overall.progress}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden">
        <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-primary-dark">Item by Discipline</h2>
          <div className="flex items-center space-x-2 text-sm text-surface-textMuted">
            <span>Date:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="border border-surface-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary-blue text-primary-dark"
            />
            <span>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="border border-surface-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary-blue text-primary-dark"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-surface-app text-surface-textMuted border-b border-surface-border">
            <tr>
              <th className="px-6 py-4 font-medium">Discipline</th>
              <th className="px-6 py-4 font-medium">Total Items</th>
              <th className="px-6 py-4 font-medium">Open</th>
              <th className="px-6 py-4 font-medium">Pending Review</th>
              <th className="px-6 py-4 font-medium">Closed</th>
              <th className="px-6 py-4 font-medium">%Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {disciplineData.map(row => (
              <tr key={row.discipline} className="hover:bg-surface-app transition-colors">
                <td className="px-6 py-3 font-semibold text-primary-dark">{row.discipline}</td>
                <td className="px-6 py-3 text-primary-dark">{row.total}</td>
                <td className="px-6 py-3 text-status-open font-medium">{row.open}</td>
                <td className="px-6 py-3 text-status-submitToOe font-medium">{row.pending}</td>
                <td className="px-6 py-3 text-status-closed font-medium">{row.closed}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 text-right font-medium text-primary-dark">{row.progress}%</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-blue rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${row.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
