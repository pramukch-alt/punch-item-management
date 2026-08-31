import { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [items, setItems] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [systemProgress, setSystemProgress] = useState<any>({});
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, settingsRes] = await Promise.all([
          api.get('/punch-items'),
          api.get('/settings')
        ]);
        setItems(itemsRes.data);
        if (settingsRes.data.SYSTEM_PROGRESS) {
          setSystemProgress(JSON.parse(settingsRes.data.SYSTEM_PROGRESS));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };
    fetchData();
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

  const disciplineCategoryData = disciplines.map(disc => {
    const discItems = filteredItems.filter(i => i.discipline === disc);
    
    const getCatStats = (cat: string) => {
      const catItems = discItems.filter(i => i.category === cat);
      const total = catItems.length;
      const closed = catItems.filter(i => i.status === 'CLOSED').length;
      const progress = total > 0 ? Math.round((closed / total) * 100) : 0;
      return { total, closed, progress };
    };

    return {
      discipline: disc,
      A: getCatStats('A'),
      B: getCatStats('B'),
      C: getCatStats('C'),
    };
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

      {/* Discipline Category Cards */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-primary-dark mb-4">Punch Item Closure Status by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {disciplineCategoryData.map((data) => {
            const renderCategory = (catName: string, stats: any, colorClass: string, bgClass: string) => {
              const remaining = stats.total - stats.closed;
              return (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-semibold ${colorClass}`}>{catName}</span>
                    <span className="text-surface-textMuted font-medium">Total: {stats.total}</span>
                  </div>
                  <div 
                    className="w-full h-6 bg-gray-200 rounded flex overflow-hidden text-xs font-bold shadow-inner" 
                    title={`Total: ${stats.total} | Closed: ${stats.closed} | Remaining: ${remaining}`}
                  >
                    {stats.closed > 0 && (
                      <div 
                        className={`h-full ${bgClass} flex items-center justify-center text-white transition-all duration-500 ease-out`} 
                        style={{ width: `${stats.progress}%` }}
                        title={`Closed: ${stats.closed}`}
                      >
                        {stats.progress > 15 ? stats.closed : ''}
                      </div>
                    )}
                    {remaining > 0 && (
                      <div 
                        className="h-full flex-1 flex items-center justify-center text-gray-600"
                        title={`Remaining: ${remaining}`}
                      >
                        {stats.progress < 85 ? remaining : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <div key={data.discipline} className="bg-surface-card rounded-lg shadow-sm border border-surface-border p-4 flex flex-col">
                <h3 className="text-lg font-bold text-primary-dark mb-4 text-center border-b border-surface-border pb-2">{data.discipline}</h3>
                
                <div className="space-y-4 flex-1">
                  {renderCategory('Cat A', data.A, 'text-red-600', 'bg-red-500')}
                  {renderCategory('Cat B', data.B, 'text-orange-500', 'bg-orange-400')}
                  {renderCategory('Cat C', data.C, 'text-blue-500', 'bg-blue-400')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-surface-card rounded-lg shadow-sm border border-surface-border overflow-hidden mt-6">
        <div className="p-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-primary-dark">System Progress (Walkdown Completion)</h2>
        </div>
        
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-surface-app text-surface-textMuted border-b border-surface-border">
            <tr>
              <th className="px-6 py-4 font-medium">Discipline</th>
              <th className="px-6 py-4 font-medium">Package</th>
              <th className="px-6 py-4 font-medium">Total Systems (Relevant)</th>
              <th className="px-6 py-4 font-medium">Walkdown Finished</th>
              <th className="px-6 py-4 font-medium">%Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {Object.keys(systemProgress).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-surface-textMuted">No system progress data available yet.</td>
              </tr>
            ) : (
              Object.keys(systemProgress).map(disc => {
                const pkgs = systemProgress[disc] || [];
                return pkgs.map((pkg: any) => {
                  const totalSys = pkg.systems?.length || 0;
                  const finishedSys = pkg.systems?.filter((s: any) => s.finished).length || 0;
                  const progress = totalSys > 0 ? Math.round((finishedSys / totalSys) * 100) : 0;
                  
                  return (
                    <tr key={`${disc}-${pkg.packageId}`} className="hover:bg-surface-app transition-colors">
                      <td className="px-6 py-3 font-semibold text-primary-dark">{disc}</td>
                      <td className="px-6 py-3 text-primary-dark">{pkg.packageId}</td>
                      <td className="px-6 py-3 text-primary-dark">{totalSys}</td>
                      <td className="px-6 py-3 text-status-closed font-medium">{finishedSys}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="w-8 text-right font-medium text-primary-dark">{progress}%</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-status-closed rounded-full transition-all duration-500 ease-out" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
