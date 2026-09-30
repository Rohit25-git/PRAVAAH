import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Map, 
  TrendingUp, 
  AlertTriangle, 
  FileSearch, 
  Share2, 
  CreditCard, 
  Briefcase, 
  FileText, 
  Cpu, 
  Terminal, 
  Building2,
  LogOut,
  UserCheck
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  criticalAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
  criticalAlertCount
}) => {
  const allNavItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'risk-heatmap', label: 'Risk Heatmap (GIS)', icon: Map },
    { id: 'predictive-intelligence', label: 'Predictive Intelligence', icon: TrendingUp },
    { 
      id: 'alerts', 
      label: 'Alert Center', 
      icon: AlertTriangle,
      badge: criticalAlertCount > 0 ? criticalAlertCount : undefined 
    },
    { id: 'investigations', label: 'Investigations', icon: FileSearch },
    { id: 'graph-intelligence', label: 'Intelligence Graph', icon: Share2 },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'cases', label: 'Case Management', icon: Briefcase },
    { id: 'reports', label: 'Intelligence Reports', icon: FileText },
    { id: 'ai-copilot', label: 'PRAVAAH Copilot', icon: Cpu },
    { id: 'bank-workflow', label: 'Bank Analyst Console', icon: Building2 },
    { id: 'system-audit', label: 'System & Audit Logs', icon: Terminal },
  ];

  const userRole = currentUser?.role || 'LEA_OFFICER';

  // Strict RBAC Filtering: System Audit is strictly ADMIN only; Bank Console is BANK_ANALYST & ADMIN; Police views for LEA/I4C
  const navItems = allNavItems.filter((item) => {
    if (item.id === 'system-audit') {
      return userRole === 'ADMIN';
    }
    if (item.id === 'bank-workflow') {
      return userRole === 'BANK_ANALYST' || userRole === 'ADMIN';
    }
    if (item.id === 'cases' || item.id === 'investigations' || item.id === 'graph-intelligence') {
      return userRole !== 'BANK_ANALYST';
    }
    if (item.id === 'predictive-intelligence') {
      return userRole !== 'BANK_ANALYST';
    }
    return true;
  });

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-40 select-none shadow-sm">
      {/* Brand Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center gap-3">
        <img
          src="/logo.png"
          alt="PRAVAAH Logo"
          className="w-11 h-11 rounded-xl object-contain shadow-xs bg-white p-0.5 border border-slate-200 shrink-0"
        />
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-widest text-slate-900 text-lg leading-tight">PRAVAAH</span>
          </div>
          <p className="text-[9px] text-blue-700 font-bold uppercase tracking-wider truncate">
            PREDICT • ANTICIPATE • INTERVENE
          </p>
        </div>
      </div>

      {/* Synthetic Data Notice */}
      <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
        <span className="text-[10px] font-bold text-amber-800 tracking-wide uppercase">Prototype • Synthetic Data</span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white text-blue-700' : 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.name || 'Active Officer'}</p>
              <span className="text-[10px] text-blue-600 font-bold uppercase">{currentUser?.role?.replace('_', ' ') || 'LEA OFFICER'}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
