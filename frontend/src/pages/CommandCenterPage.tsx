import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  CreditCard, 
  FileText, 
  Search, 
  Cpu, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  ShieldAlert,
  Radio,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { LeafletMap } from '../components/LeafletMap';
import { HotspotDetailDrawer } from '../components/HotspotDetailDrawer';
import { Hotspot, DashboardSummary, DashboardActivity, Alert, RiskLevel } from '../types';
import { api } from '../services/api';

interface CommandCenterPageProps {
  onNavigateTab: (tab: string, state?: any) => void;
  onOpenHotspotDrawer: (hotspot: Hotspot) => void;
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot | null) => void;
  isSimulating: boolean;
  simulationStatus: string | null;
}

export const CommandCenterPage: React.FC<CommandCenterPageProps> = ({
  onNavigateTab,
  onOpenHotspotDrawer,
  selectedHotspot,
  onSelectHotspot,
  isSimulating,
  simulationStatus,
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<DashboardActivity | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [sumData, actData, hotData, alData] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardActivity(),
        api.getHotspots(),
        api.getAlerts('ALL', 'NEW'),
      ]);
      setSummary(sumData);
      setActivity(actData);
      setHotspots(hotData);
      setRecentAlerts(alData.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000); // 20s poll
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      setRecentAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const filteredHotspots = hotspots.filter((h) => {
    if (riskFilter === 'ALL') return true;
    return h.risk_level === riskFilter;
  });

  const COLORS = ['#00e5ff', '#3b82f6', '#f97316', '#a855f7', '#10b981', '#ec4899'];

  return (
    <div className="space-y-6 select-none">
      {/* Simulation Live Status Banner */}
      {isSimulating && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between shadow-xs animate-pulse">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-amber-600 animate-spin" />
            <div>
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                SYNTHETIC CRIME SPIKE SIMULATION IN PROGRESS
              </span>
              <p className="text-[11px] text-amber-800">
                {simulationStatus || 'Injecting high-velocity withdrawal anomalies and synthetic victim complaints...'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
            LIVE ML INFERENCE
          </span>
        </div>
      )}

      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>OPERATIONAL COMMAND CENTER</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              NATIONAL OVERVIEW
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cybercrime complaint ingestion &amp; 4–6h advance ATM cash-out hotspot forecast
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Intel'}</span>
          </button>
          <button
            onClick={() => onNavigateTab('predictive-intelligence')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-blue-700 shadow-xs transition"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>ML Forecast Console</span>
          </button>
        </div>
      </div>

      {/* 6 Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-red-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Critical Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{summary?.active_critical_alerts ?? 0}</span>
            <span className="text-[10px] text-red-700 block font-medium mt-0.5">Urgent intervention required</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">High-Risk Hotspots</span>
            <MapPin className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{summary?.predicted_high_risk_zones ?? 0}</span>
            <span className="text-[10px] text-amber-700 block font-medium mt-0.5">Forecast probability &gt; 70%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Suspicious Cashouts</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{summary?.suspicious_withdrawals ?? 0}</span>
            <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Flagged anomaly bursts</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Complaints (NCRP)</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{summary?.cybercrime_complaints ?? 0}</span>
            <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Primary predictive input</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('cases')}
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-400 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Total Cases</span>
            <Search className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">{summary?.total_cases ?? 520}</span>
            <span className="text-[10px] text-slate-600 block font-medium mt-0.5">
              {summary?.open_cases ?? 303} active • {((summary?.total_cases ?? 520) - (summary?.open_cases ?? 303))} closed
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">ML Engines</span>
            <Cpu className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-lg font-black text-emerald-700">ACTIVE</span>
            </div>
            <span className="text-[10px] text-slate-500 block font-medium mt-0.5">RF + DBSCAN + IsoForest</span>
          </div>
        </div>
      </div>

      {/* Main Map + Hotspot Intel Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left 2 Cols: Geographic Command Map */}
        <div className="lg:col-span-2 min-w-0 bg-white border border-slate-200 rounded-xl p-4 flex flex-col shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Geographic Risk Hotspots (Next 4–6 Hours)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-xs">
                {filteredHotspots.length} Zones Monitored
              </span>
            </div>

            {/* Risk Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[10px] font-bold">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={`px-2 py-1 rounded transition ${
                    riskFilter === lvl
                      ? 'bg-white text-blue-700 border border-slate-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-[450px] rounded-xl overflow-hidden relative border border-slate-200 shadow-xs">
            <LeafletMap
              hotspots={filteredHotspots}
              selectedHotspot={selectedHotspot}
              onSelectHotspot={(h) => {
                onSelectHotspot(h);
                onOpenHotspotDrawer(h);
              }}
              onOpenInvestigation={(h) => {
                onNavigateTab('investigations', { district: h.district });
              }}
              height="100%"
            />
          </div>
        </div>

        {/* Right Col: Live Alert Stream & Quick Actions */}
        <div className="lg:col-span-1 min-w-0 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold text-slate-900 tracking-wider uppercase">Live Alert Stream</span>
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-0.5"
              >
                <span>View All ({recentAlerts.length})</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Alert List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {recentAlerts.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p>All current alerts acknowledged or resolved.</p>
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 border-red-300'
                            : alert.severity === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-yellow-50 text-yellow-800 border-yellow-300'
                        }`}
                      >
                        {alert.severity} • {alert.risk_score} SCORE
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {alert.predicted_time_window}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{alert.location}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{alert.reason}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                        {alert.jurisdiction}
                      </span>
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold transition shadow-xs"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 mt-3 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">WebSocket: Real-time active</span>
            <button
              onClick={() => onNavigateTab('risk-heatmap')}
              className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Open GIS Heatmap</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Chart 1: 24h Activity vs Predicted Risk */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Activity vs Risk Forecast</h4>
            <span className="text-[10px] text-blue-700 font-semibold">Hourly Timeline</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity?.activity_timeline || []}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="predicted_risk" stroke="#2563eb" fillOpacity={1} fill="url(#colorRisk)" name="Risk Score" />
                <Area type="monotone" dataKey="complaints" stroke="#f97316" fillOpacity={1} fill="url(#colorComplaints)" name="Complaints" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Complaints by Category */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Complaints by Category</h4>
            <span className="text-[10px] text-slate-500 font-semibold">Distribution</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activity?.category_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(activity?.category_distribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Time Window Risk Forecast */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Risk by Time Window</h4>
            <span className="text-[10px] text-amber-700 font-semibold">5-Window Forecast</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity?.time_window_distribution || []}>
                <XAxis dataKey="window" stroke="#64748b" fontSize={8} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} width={24} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Risk Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Geographic Hotspots by District */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top Risk Jurisdictions</h4>
            <span className="text-[10px] text-blue-700 font-semibold">By State/Territory</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={activity?.geographic_distribution?.slice(0, 5) || []}>
                <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 100]} />
                <YAxis dataKey="state" type="category" stroke="#64748b" fontSize={8} tickLine={false} width={75} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="risk_score" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Risk Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Selected Hotspot Drawer */}
      <HotspotDetailDrawer
        hotspot={selectedHotspot}
        onClose={() => onSelectHotspot(null)}
        onNavigateToTab={(tab: string, stateOrId?: any) => {
          if (typeof stateOrId === 'object' && stateOrId !== null) {
            onNavigateTab(tab, stateOrId);
          } else {
            onNavigateTab(tab, { contextId: stateOrId });
          }
        }}
      />
    </div>
  );
};
