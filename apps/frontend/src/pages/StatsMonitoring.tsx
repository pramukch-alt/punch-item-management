import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Users, 
  ListChecks, 
  HardDrive, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  PauseCircle, 
  RefreshCw,
  FolderKanban
} from 'lucide-react';
import api from '../services/api';
import { getStoredUser } from '../utils/auth';

interface PackageItem {
  id: string;
  package_name: string;
  max_punch_items: number | null;
  pwa_enabled: boolean;
  report_enabled: boolean;
}

interface ProjectItem {
  id: string;
  name: string;
  package_id: string | null;
  package?: PackageItem;
  customer_name: string | null;
  customer_info: string | null;
  admin_name: string | null;
  admin_contact: string | null;
  duration_months: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  users?: Array<{ id: string; email: string; name: string }>;
  _count?: { punch_items: number; users: number };
  history_count?: number;
  storage_bytes?: number;
  storage_formatted?: string;
  created_at: string;
}

const MAX_STORAGE_BYTES = 500 * 1024 * 1024 * 1024; // 500 GB in Bytes

const StatsMonitoring: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const user = getStoredUser();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch stats monitoring projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusBadge = (status: string, endDateStr?: string | null) => {
    const isExpiredDate = endDateStr && new Date(endDateStr) < new Date();
    if (status === 'SUSPENDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <PauseCircle size={12} /> Suspended
        </span>
      );
    }
    if (status === 'EXPIRED' || isExpiredDate) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertCircle size={12} /> Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={12} /> Active
      </span>
    );
  };

  // Total Summary Metrics
  const totalProjects = projects.length;
  const totalPunchItems = projects.reduce((acc, p) => acc + (p._count?.punch_items || 0), 0);
  const totalUsers = projects.reduce((acc, p) => acc + (p._count?.users || 0), 0);
  const totalStorageBytes = projects.reduce((acc, p) => acc + (p.storage_bytes || 0), 0);

  const formatSystemStorage = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Render SVG Semi-Circle Gauge
  const renderGauge = (storageBytes: number = 0, storageFormatted: string = '0 B') => {
    // Calculate percentage against 500 GB Max
    const pct = Math.min(100, Math.max(0, (storageBytes / MAX_STORAGE_BYTES) * 100));
    
    // Gauge Arc math (Semi-circle radius = 65)
    const radius = 65;
    const circumference = Math.PI * radius; // ~204.2
    const strokeDashoffset = circumference - (circumference * pct) / 100;

    // Color gradient / stroke based on percentage
    let strokeColor = '#10B981'; // Emerald
    if (pct > 70 && pct <= 90) strokeColor = '#F59E0B'; // Amber
    if (pct > 90) strokeColor = '#EF4444'; // Red

    const pctDisplay = pct > 0 && pct < 0.01 ? '< 0.01%' : `${pct.toFixed(2)}%`;

    return (
      <div className="flex flex-col items-center justify-center relative py-2">
        <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
          <defs>
            <linearGradient id={`gaugeGradient-${storageBytes}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor={strokeColor} />
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 15,80 A 65,65 0 0,1 145,80"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Usage Arc */}
          <path
            d="M 15,80 A 65,65 0 0,1 145,80"
            fill="none"
            stroke={`url(#gaugeGradient-${storageBytes})`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Usage Text */}
        <div className="absolute top-10 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-primary-dark tracking-tight">
            {storageFormatted}
          </span>
          <span className="text-xs font-bold text-primary-blue bg-blue-50 px-2 py-0.5 rounded-full mt-0.5 border border-blue-100">
            {pctDisplay} of 500 GB
          </span>
        </div>

        {/* Min / Max Labels */}
        <div className="w-48 flex justify-between text-[11px] text-surface-textMuted font-semibold px-2 -mt-2">
          <span>0 GB</span>
          <span>Max 500 GB</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 text-primary-blue rounded-xl shadow-xs">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">STATS Dashboard Monitoring</h1>
            <p className="text-surface-textMuted text-sm mt-0.5">
              Real-time multi-project database storage, user account capacity, and punch item activity tracking.
            </p>
          </div>
        </div>

        <button
          onClick={fetchProjects}
          disabled={loading}
          className="flex items-center space-x-2 bg-surface-card border border-surface-border text-surface-textMuted hover:text-primary-dark px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin text-primary-blue' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Global Summary KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card p-4 rounded-xl shadow-xs border border-surface-border border-l-4 border-l-primary-blue">
          <div className="flex items-center justify-between text-surface-textMuted text-xs font-semibold uppercase tracking-wider">
            <span>Total Projects</span>
            <FolderKanban size={18} className="text-primary-blue" />
          </div>
          <div className="text-2xl font-extrabold text-primary-dark mt-2">{totalProjects}</div>
        </div>

        <div className="bg-surface-card p-4 rounded-xl shadow-xs border border-surface-border border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-surface-textMuted text-xs font-semibold uppercase tracking-wider">
            <span>System Storage Used</span>
            <HardDrive size={18} className="text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700 mt-2">
            {formatSystemStorage(totalStorageBytes)}
          </div>
        </div>

        <div className="bg-surface-card p-4 rounded-xl shadow-xs border border-surface-border border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-surface-textMuted text-xs font-semibold uppercase tracking-wider">
            <span>Total Punch Items</span>
            <ListChecks size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2">
            {totalPunchItems.toLocaleString()}
          </div>
        </div>

        <div className="bg-surface-card p-4 rounded-xl shadow-xs border border-surface-border border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-surface-textMuted text-xs font-semibold uppercase tracking-wider">
            <span>Active Users</span>
            <Users size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {totalUsers.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 3 Column Grid Section: 1 Card per Project */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary-dark flex items-center gap-2">
            <Database size={20} className="text-primary-blue" />
            Project Storage & Capacity Gauges (Max Scale 500 GB)
          </h2>
          <span className="text-xs text-surface-textMuted font-medium">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="bg-surface-card rounded-xl p-12 text-center border border-surface-border text-surface-textMuted">
            <ShieldAlert size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-primary-dark">No projects found</h3>
            <p className="text-sm text-surface-textMuted mt-1">There are no project records available for monitoring.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const punchItemsCount = proj._count?.punch_items || 0;
              const usersCount = proj._count?.users || 0;
              const historyLogsCount = proj.history_count || 0;
              const maxQuota = proj.package?.max_punch_items;

              return (
                <div
                  key={proj.id}
                  className="bg-surface-card rounded-2xl shadow-sm hover:shadow-md border border-surface-border transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-surface-border/60 bg-surface-app/40 flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-primary-dark truncate" title={proj.name}>
                        {proj.name}
                      </h3>
                      {proj.customer_name && (
                        <p className="text-xs text-surface-textMuted truncate mt-0.5">
                          {proj.customer_name}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(proj.status, proj.end_date)}
                  </div>

                  {/* Gauge Section */}
                  <div className="p-5 flex-1 flex flex-col items-center justify-center border-b border-surface-border/40 bg-white">
                    <span className="text-xs font-semibold text-surface-textMuted uppercase tracking-wider mb-1">
                      Database Storage Usage
                    </span>
                    {renderGauge(proj.storage_bytes, proj.storage_formatted)}
                  </div>

                  {/* Project Details & Capacity Metrics */}
                  <div className="p-5 space-y-3 bg-surface-card text-sm">
                    {/* Punch Items Metric */}
                    <div className="flex items-center justify-between">
                      <span className="text-surface-textMuted font-medium text-xs flex items-center gap-1.5">
                        <ListChecks size={15} className="text-amber-500" />
                        Punch Items:
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-primary-dark text-sm">
                          {punchItemsCount.toLocaleString()}
                        </span>
                        {maxQuota !== null && maxQuota !== undefined ? (
                          <span className="text-xs text-surface-textMuted ml-1">
                            / {maxQuota.toLocaleString()} max
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold ml-1">
                            (Unlimited)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Users Metric */}
                    <div className="flex items-center justify-between border-t border-surface-border/40 pt-2.5">
                      <span className="text-surface-textMuted font-medium text-xs flex items-center gap-1.5">
                        <Users size={15} className="text-emerald-500" />
                        User Accounts:
                      </span>
                      <span className="font-bold text-primary-dark text-sm">
                        {usersCount.toLocaleString()} Users
                      </span>
                    </div>

                    {/* History Logs Metric */}
                    <div className="flex items-center justify-between border-t border-surface-border/40 pt-2.5">
                      <span className="text-surface-textMuted font-medium text-xs flex items-center gap-1.5">
                        <Activity size={15} className="text-purple-500" />
                        Audit History Logs:
                      </span>
                      <span className="font-bold text-primary-dark text-sm">
                        {historyLogsCount.toLocaleString()} Logs
                      </span>
                    </div>

                    {/* Subscription Package & Admin Contact */}
                    <div className="pt-2 border-t border-surface-border/40 flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                        Package: {proj.package?.package_name || 'Standard'}
                      </span>
                      {proj.admin_name && (
                        <span className="text-surface-textMuted truncate max-w-[120px]" title={proj.admin_name}>
                          Admin: {proj.admin_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsMonitoring;
