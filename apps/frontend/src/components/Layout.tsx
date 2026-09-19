import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Upload, Users, Settings, LogOut, Bell, Smartphone, Menu, X, CheckSquare, Database, ShieldAlert, Activity } from 'lucide-react';
import api from '../services/api';
import { performCleanLogout, getStoredUser, getStoredToken, getStoredSuperadminProjectId } from '../utils/auth';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = getStoredUser();
  const token = getStoredToken();
  const userRole = user?.role || '';
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth Guard: If no valid token or user session exists, perform clean redirect to /login.
  // Also redirect SUPERADMIN away from project dashboard to STATS Monitoring.
  useEffect(() => {
    if (!token || !user) {
      performCleanLogout();
      return;
    }
    if (userRole === 'SUPERADMIN' && (location.pathname === '/dashboard' || location.pathname === '/')) {
      navigate('/stats', { replace: true });
    }
  }, [token, user, userRole, location.pathname, navigate]);
  
  let initials = 'U';
  if (user?.name) {
    const parts = user.name.trim().split(' ');
    if (parts.length > 1) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].substring(0, 2).toUpperCase();
    }
  } else if (user?.email) {
    initials = user.email.substring(0, 2).toUpperCase();
  }

  const [projectName, setProjectName] = useState(user?.project_name || 'PunchPro');

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const userId = user?.id || user?.email || 'guest';
  const storageKey = `clearedNotifs_${userId}`;

  const [clearedNotifs, setClearedNotifs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
      const oldSaved = localStorage.getItem('clearedNotifs');
      return oldSaved ? JSON.parse(oldSaved) : [];
    } catch {
      return [];
    }
  });

  const getNotifKey = (n: any) => `${n.id}_${n.status}_${n.updated_at ? new Date(n.updated_at).getTime() : ''}`;

  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    userRole === 'SUPERADMIN' ? getStoredSuperadminProjectId() : ''
  );

  useEffect(() => {
    const fetchSettingsAndNotifs = async () => {
      try {
        const [settingsRes, itemsRes] = await Promise.all([
          api.get('/settings'),
          api.get(userRole === 'SUPERADMIN' && selectedProjectId ? `/punch-items?project_id=${selectedProjectId}` : '/punch-items')
        ]);
        
        if (userRole === 'SUPERADMIN') {
          try {
            const projRes = await api.get('/projects');
            setAllProjects(projRes.data);
            if (selectedProjectId) {
              const matched = projRes.data.find((p: any) => p.id === selectedProjectId);
              setProjectName(matched ? matched.name : 'All Projects');
            } else {
              setProjectName('All Projects');
            }
          } catch(e) {}
        } else {
          // Tenant users should see their specific Project Name
          setProjectName(user?.project_name || settingsRes.data.PROJECT_NAME || 'PunchPro');
        }

        const allItems = itemsRes.data;
        const userDiscipline = user?.discipline || null;
        let pendingItems = [];
        
        if (userRole === 'CONTRACTOR') {
          pendingItems = allItems.filter((i: any) => (i.status === 'OPEN' || i.status === 'REJECTED') && (!userDiscipline || i.discipline === userDiscipline));
        } else if (userRole === 'OE') {
          pendingItems = allItems.filter((i: any) => i.status === 'SUBMIT_TO_OE' && (!userDiscipline || i.discipline === userDiscipline));
        } else if (userRole === 'OWNER') {
          pendingItems = allItems.filter((i: any) => i.status === 'SUBMIT_TO_OWNER' && (!userDiscipline || i.discipline === userDiscipline));
        } else if (userRole === 'ADMIN') {
          pendingItems = allItems.filter((i: any) => i.status !== 'CLOSED' && i.status !== 'CANCELED');
        }

        // Sort pending items by latest update so the newest notifications are at the top
        pendingItems.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        
        // Show all pending items in the dropdown
        setNotifications(pendingItems);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };
    fetchSettingsAndNotifs();
  }, [userRole, selectedProjectId]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter(n => !clearedNotifs.includes(getNotifKey(n)) && !clearedNotifs.includes(n.id + n.status)).length;

  const handleClearNotifications = () => {
    const newCleared = [...clearedNotifs, ...notifications.map(getNotifKey), ...notifications.map(n => n.id + n.status)];
    const uniqueCleared = Array.from(new Set(newCleared));
    setClearedNotifs(uniqueCleared);
    localStorage.setItem(storageKey, JSON.stringify(uniqueCleared));
  };

  const handleReadNotification = (notif: any) => {
    const key = getNotifKey(notif);
    if (!clearedNotifs.includes(key)) {
      const newCleared = [...clearedNotifs, key, notif.id + notif.status];
      setClearedNotifs(newCleared);
      localStorage.setItem(storageKey, JSON.stringify(newCleared));
    }
    setShowNotifications(false);
  };

  const handleLogout = () => {
    performCleanLogout();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'SUPERVISOR', 'CONTRACTOR', 'OE', 'OWNER'] },
    { name: 'STATS Monitoring', path: '/stats', icon: <Activity size={20} />, roles: ['SUPERADMIN', 'ADMIN'] },
    { name: 'System Progress', path: '/system-progress', icon: <CheckSquare size={20} />, roles: ['ADMIN', 'SUPERVISOR', 'CONTRACTOR'] },
    { name: 'Punch List', path: '/punch-list', icon: <ListChecks size={20} />, roles: ['ADMIN', 'SUPERVISOR', 'CONTRACTOR', 'OE', 'OWNER'] },
    { name: 'Database Management', path: '/database-management', icon: <Database size={20} />, roles: ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'CONTRACTOR'] },
    ...(user?.pwa_enabled ? [{ name: 'Field App (PWA)', path: '/field-app', icon: <Smartphone size={20} />, roles: ['ADMIN', 'SUPERVISOR', 'CONTRACTOR'] }] : []),
    { name: 'User Management', path: '/users', icon: <Users size={20} />, roles: ['ADMIN', 'SUPERVISOR'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['ADMIN'] },
    { name: 'Superadmin Panel', path: '/superadmin', icon: <ShieldAlert size={20} />, roles: ['SUPERADMIN'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-surface-app text-primary-dark print:h-auto print:bg-white relative">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Sliding drawer on mobile */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-[260px] bg-surface-card border-r border-surface-border flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-surface-border/50 mb-2">
          <div className="flex items-center flex-1">
            <img src="/PunchPro_Ver2_Login.png" alt="PunchPro Logo" className="w-[200px] h-[50px] object-contain" />
          </div>
          <button 
            className="md:hidden p-1 text-surface-textMuted hover:text-primary-dark"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-blue text-white' 
                    : 'text-surface-textMuted hover:bg-surface-app hover:text-primary-dark'
                }`}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-border mt-auto">
          <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 w-full text-left text-surface-textMuted hover:bg-surface-app hover:text-status-open rounded-md transition-colors">
            <LogOut size={20} />
            <span className="font-medium text-sm">Logout</span>
          </button>
          <div className="mt-4 text-center text-xs text-surface-textMuted">
            Version v1.0.0-beta
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full print:overflow-visible">
        <header className="h-16 z-10 bg-surface-card border-b border-surface-border flex items-center justify-between px-4 md:px-8 relative print:hidden">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-surface-textMuted hover:text-primary-dark"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="font-semibold text-base md:text-lg text-primary-dark line-clamp-1">Project: {projectName}</div>
          </div>
          <div className="flex items-center space-x-6 relative">
            
            {userRole === 'SUPERADMIN' && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm font-medium text-surface-textMuted">View Project:</span>
                <select 
                  value={selectedProjectId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedProjectId(newId);
                    sessionStorage.setItem('superadmin_project_id', newId);
                    localStorage.setItem('superadmin_project_id', newId);
                    if (newId) {
                      const matched = allProjects.find(p => p.id === newId);
                      setProjectName(matched ? matched.name : 'All Projects');
                    } else {
                      setProjectName('All Projects');
                    }
                    window.dispatchEvent(new Event('projectChange'));
                  }}
                  className="border border-surface-border rounded-md px-3 py-1.5 text-sm bg-white text-primary-dark outline-none focus:border-primary-blue"
                >
                  <option value="">-- All Projects (Or select one) --</option>
                  {allProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Notification Button */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-surface-textMuted hover:text-primary-blue transition-transform duration-300 ease-out hover:-translate-y-0.5"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface-card"></span>
                )}
              </button>

              {/* Notification Popover - Antigravity Glassmorphism Style */}
              <div 
                className={`absolute right-0 mt-3 w-80 bg-white/80 backdrop-blur-md border border-white/40 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300 ease-out origin-top-right z-50
                  ${showNotifications ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
              >
                <div className="p-4 border-b border-surface-border/50 bg-white/40 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-primary-dark">Notifications</h3>
                    <p className="text-xs text-surface-textMuted">You have {unreadCount} unread items</p>
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleClearNotifications}
                      className="text-xs text-primary-blue hover:text-blue-700 font-medium underline"
                    >
                      Mark All Read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notif => {
                      const isUnread = !clearedNotifs.includes(getNotifKey(notif)) && !clearedNotifs.includes(notif.id + notif.status);
                      return (
                        <Link 
                          key={notif.id} 
                          to={`/punch-list/${notif.id}`}
                          onClick={() => handleReadNotification(notif)}
                          className={`block p-4 border-b border-surface-border/30 transition-colors ${isUnread ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-white/60'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm text-primary-dark flex items-center gap-2">
                              {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                              {notif.running_no}
                            </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-primary-blue">
                            {notif.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-surface-textMuted truncate">{notif.description}</p>
                      </Link>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-surface-textMuted text-sm">
                      All caught up! No pending items.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" title={user?.name || user?.email || 'User'}>
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible print:m-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
