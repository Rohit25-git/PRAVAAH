import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Activity, 
  ShieldCheck, 
  ChevronDown,
  Play,
  RotateCcw,
  Globe
} from 'lucide-react';
import { User, UserRole } from '../types';

interface HeaderProps {
  currentUser: User | null;
  onRoleSwitch: (role: UserRole) => void;
  onTriggerSimulation: () => void;
  isSimulating: boolean;
  simulationStatus: string | null;
  unreadAlertCount: number;
  onOpenNotifications: () => void;
  onSearch: (query: string) => void;
  onOpenLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onRoleSwitch,
  onTriggerSimulation,
  isSimulating,
  simulationStatus,
  unreadAlertCount,
  onOpenNotifications,
  onSearch,
  onOpenLanding,
}) => {
  const [searchVal, setSearchVal] = useState('');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearch(searchVal.trim());
    }
  };

  const roles: { id: UserRole; label: string; agency: string }[] = [
    { id: 'LEA_OFFICER', label: 'LEA Officer (Delhi Police)', agency: 'State Cyber Cell' },
    { id: 'I4C_OFFICER', label: 'I4C Nodal Officer', agency: 'Central Ministry / NCRP' },
    { id: 'BANK_ANALYST', label: 'Bank Fraud Analyst', agency: 'National Commercial Bank' },
    { id: 'ADMIN', label: 'System Administrator', agency: 'PRAVAAH Administration' },
  ];

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 fixed top-0 left-64 right-0 z-30 flex items-center justify-between px-6 shadow-sm">
      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-80 md:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search accounts, ATMs, cases, or complaints..."
          className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />
      </form>

      {/* Center Controller: Admin Simulation OR Official Shield Status */}
      <div className="flex items-center gap-3">
        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-xs"
            title="View Public Landing Page"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Public Portal</span>
          </button>
        )}

        {currentUser?.role === 'ADMIN' ? (
          <>
            <button
              onClick={onTriggerSimulation}
              disabled={isSimulating}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide border transition shadow-sm cursor-pointer ${
                isSimulating
                  ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-600 shadow-md shadow-blue-500/20'
              }`}
            >
              {isSimulating ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  <span>SIMULATION RUNNING...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RUN LIVE SIMULATION</span>
                </>
              )}
            </button>

            {simulationStatus && (
              <span className="hidden lg:inline text-[11px] text-slate-700 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                {simulationStatus}
              </span>
            )}
          </>
        ) : (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs font-bold text-blue-800 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>NATIONAL CYBER SHIELD: ACTIVE</span>
          </div>
        )}
      </div>

      {/* Right Controls: Role Switcher, System Health, Notifications */}
      <div className="flex items-center gap-4">
        {/* System Health Status Indicator */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
          <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
          <span>API & ML ENGINES: ONLINE</span>
        </div>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-semibold transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold text-slate-800">{currentUser?.role?.replace('_', ' ') || 'LEA OFFICER'}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch Demo Role</span>
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onRoleSwitch(r.id);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex flex-col transition ${
                    currentUser?.role === r.id ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600' : 'text-slate-700'
                  }`}
                >
                  <span className="font-semibold text-slate-900">{r.label}</span>
                  <span className="text-[10px] text-slate-500">{r.agency}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition"
          title="Live Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
              {unreadAlertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
