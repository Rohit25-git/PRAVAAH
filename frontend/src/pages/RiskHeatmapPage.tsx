import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Filter, 
  MapPin, 
  Search, 
  AlertTriangle, 
  Info, 
  Clock, 
  TrendingUp, 
  Building2, 
  CreditCard, 
  FileText 
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { HotspotDetailDrawer } from '../components/HotspotDetailDrawer';
import { Hotspot, ATM, Transaction, Complaint } from '../types';
import { api } from '../services/api';

interface RiskHeatmapPageProps {
  onNavigateTab: (tab: string, state?: any) => void;
  selectedHotspot: Hotspot | null;
  onSelectHotspot: (hotspot: Hotspot | null) => void;
}

export const RiskHeatmapPage: React.FC<RiskHeatmapPageProps> = ({
  onNavigateTab,
  selectedHotspot,
  onSelectHotspot,
}) => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [atms, setAtms] = useState<ATM[]>([]);
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Layer Visibility Toggles
  const [showHotspots, setShowHotspots] = useState(true);
  const [showATMs, setShowATMs] = useState(false);
  const [showWithdrawals, setShowWithdrawals] = useState(true);
  const [showComplaints, setShowComplaints] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedWindow, setSelectedWindow] = useState<string>('ALL');
  const [minRiskScore, setMinRiskScore] = useState<number>(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGisData = async () => {
      try {
        const [hotData, atmData, wData, cData] = await Promise.all([
          api.getHotspots(),
          api.getMapATMs(),
          api.getMapWithdrawals(),
          api.getMapComplaints(),
        ]);
        setHotspots(hotData);
        setAtms(atmData);
        setWithdrawals(wData);
        setComplaints(cData);
      } catch (err) {
        console.error('Failed to load GIS data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGisData();
  }, []);

  // Filter Hotspots
  const filteredHotspots = hotspots.filter((h) => {
    if (!showHotspots) return false;
    if (h.risk_score < minRiskScore) return false;
    if (selectedState !== 'ALL' && h.state !== selectedState) return false;
    if (selectedWindow !== 'ALL' && h.predicted_time_window !== selectedWindow) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        h.location.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q) ||
        h.zone_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const uniqueStates = Array.from(new Set(hotspots.map((h) => h.state))).sort();
  const timeWindows = ['00:00-06:00', '06:00-12:00', '12:00-18:00', '18:00-22:00', '22:00-00:00'];

  return (
    <div className="space-y-4 select-none">
      {/* Top Controls & Explanation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>SPATIAL RISK HEATMAP &amp; GIS CONSOLE</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              LEAD-TIME: 4–6 HOURS
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            DBSCAN geospatial density clustering &amp; future cash-out probability surface
          </p>
        </div>

        {/* Layer Toggles Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>LAYERS:</span>
          </span>

          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 text-[11px] ${
              showHotspots
                ? 'bg-red-50 text-red-700 border border-red-300 ring-1 ring-red-400/20'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Forecast Hotspots</span>
          </button>

          <button
            onClick={() => setShowWithdrawals(!showWithdrawals)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 text-[11px] ${
              showWithdrawals
                ? 'bg-amber-50 text-amber-800 border border-amber-300 ring-1 ring-amber-400/20'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <CreditCard className="w-3 h-3 text-amber-600" />
            <span>Suspicious Cash-outs</span>
          </button>

          <button
            onClick={() => setShowATMs(!showATMs)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 text-[11px] ${
              showATMs
                ? 'bg-blue-50 text-blue-700 border border-blue-300 ring-1 ring-blue-400/20'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <Building2 className="w-3 h-3 text-blue-600" />
            <span>ATM Network</span>
          </button>

          <button
            onClick={() => setShowComplaints(!showComplaints)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 text-[11px] ${
              showComplaints
                ? 'bg-purple-50 text-purple-700 border border-purple-300 ring-1 ring-purple-400/20'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <FileText className="w-3 h-3 text-purple-600" />
            <span>Complaints (Hist)</span>
          </button>
        </div>
      </div>

      {/* Critical Analytical Distinction Box */}
      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-800 space-y-0.5">
          <span className="font-bold text-blue-900">Methodological Guarantee: Historical Reports vs Predicted Hotspots</span>
          <p className="text-[11px] text-slate-600">
            Historical complaints denote where fraud victims filed reports. Future hotspot predictions forecast where criminal cash-out mules will execute unauthorized ATM withdrawals during upcoming time windows, derived from multi-factor ML feature importance.
          </p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[640px]">
        {/* Left Side: Filter and Ranked Hotspots List */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col h-full space-y-3 shadow-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location or district..."
              className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">State/UT</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-slate-50 text-xs text-slate-800 font-medium p-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">All States</option>
                {uniqueStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Forecast Window</label>
              <select
                value={selectedWindow}
                onChange={(e) => setSelectedWindow(e.target.value)}
                className="w-full bg-slate-50 text-xs text-slate-800 font-medium p-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="ALL">All Windows</option>
                {timeWindows.map((tw) => (
                  <option key={tw} value={tw}>
                    {tw}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Risk Score Threshold Slider */}
          <div className="space-y-1 pt-1 border-t border-slate-200">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600 font-medium">Min Risk Score:</span>
              <span className="font-bold text-blue-700">{minRiskScore} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minRiskScore}
              onChange={(e) => setMinRiskScore(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Hotspot Count Banner */}
          <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold">
            <span>Showing {filteredHotspots.length} Priority Zones</span>
            <span className="text-amber-700 font-bold">Top Ranked</span>
          </div>

          {/* Ranked Hotspot List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredHotspots.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No hotspots match the selected filter criteria.
              </div>
            ) : (
              filteredHotspots.map((h, idx) => {
                const isSelected = selectedHotspot?.id === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => onSelectHotspot(h)}
                    className={`w-full text-left p-2.5 rounded-lg border transition space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">#{idx + 1} {h.zone_id}</span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                          h.risk_level === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : h.risk_level === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        {h.risk_score} RISK
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 truncate">{h.location}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{h.district}, {h.state}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-600 pt-0.5">
                      <span className="flex items-center gap-1 text-blue-700 font-medium">
                        <Clock className="w-3 h-3" />
                        {h.predicted_time_window}
                      </span>
                      <span className="font-semibold text-slate-800">
                        Prob: {Math.round(h.future_hotspot_probability * 100)}%
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 3 Cols: High Resolution Map */}
        <div className="lg:col-span-3 h-full rounded-xl overflow-hidden relative border border-slate-200 shadow-xs">
          <LeafletMap
            hotspots={filteredHotspots}
            atms={atms}
            withdrawals={withdrawals}
            complaints={complaints}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={onSelectHotspot}
            onOpenInvestigation={(h) => onNavigateTab('investigations', { district: h.district })}
            showATMs={showATMs}
            showWithdrawals={showWithdrawals}
            showComplaints={showComplaints}
            height="100%"
          />
        </div>
      </div>

      {/* Hotspot Drawer */}
      <HotspotDetailDrawer
        hotspot={selectedHotspot}
        onClose={() => onSelectHotspot(null)}
        onNavigateToTab={(tab: string, contextId?: string) => onNavigateTab(tab, { contextId })}
      />
    </div>
  );
};
