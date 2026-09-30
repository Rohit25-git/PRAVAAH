import React from 'react';
import { 
  X, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  CreditCard, 
  FileText, 
  Share2, 
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Hotspot } from '../types';

interface HotspotDetailDrawerProps {
  hotspot: Hotspot | null;
  onClose: () => void;
  onNavigateToTab: (tab: string, stateOrId?: any) => void;
}

export const HotspotDetailDrawer: React.FC<HotspotDetailDrawerProps> = ({
  hotspot,
  onClose,
  onNavigateToTab
}) => {
  if (!hotspot) return null;

  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-300';
  if (hotspot.risk_level === 'CRITICAL') badgeColor = 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-400/20';
  else if (hotspot.risk_level === 'HIGH') badgeColor = 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-400/20';
  else if (hotspot.risk_level === 'MEDIUM') badgeColor = 'bg-yellow-50 text-yellow-800 border-yellow-300';

  const factors = [
    { 
      name: 'Transaction Anomaly', 
      score: hotspot.factors?.transaction_anomaly || 88, 
      expl: 'Unusual spike in withdrawal frequency and amount velocity vs. baseline.' 
    },
    { 
      name: 'Complaint Concentration', 
      score: hotspot.factors?.historical_crime || 82, 
      expl: `${hotspot.nearby_complaints} cybercrime complaints registered within geographic radius.` 
    },
    { 
      name: 'Geographic Clustering', 
      score: hotspot.factors?.geographic_concentration || 76, 
      expl: `Dense cluster of ${hotspot.nearby_atms} commercial ATM kiosks in district.` 
    },
    { 
      name: 'Temporal Pattern', 
      score: hotspot.factors?.temporal_pattern || 72, 
      expl: `High concentration in predicted evening window (${hotspot.predicted_time_window}).` 
    },
    { 
      name: 'Network Intelligence', 
      score: hotspot.factors?.network_intelligence || 65, 
      expl: `${hotspot.linked_accounts} suspect mule accounts connected to active investigation cases.` 
    },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-96 md:w-[450px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              {hotspot.zone_id}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
              {hotspot.risk_level} RISK
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-wide">{hotspot.location}</h2>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-blue-600" />
            <span>{hotspot.district}, {hotspot.state}</span>
          </p>
          {(hotspot.associated_case_id || hotspot.zone_id.includes('PATNA')) && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
              <Share2 className="w-3 h-3 text-indigo-600" />
              <span>Linked Case: {hotspot.associated_case_id || 'CASE-2026-0028'}</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold">Risk Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-900">{hotspot.risk_score}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <span className="text-[10px] text-blue-700 font-bold">Confidence: {Math.round(hotspot.confidence * 100)}%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Forecast Window</span>
            </span>
            <p className="text-sm font-bold text-amber-800 mt-1">{hotspot.predicted_time_window}</p>
            <span className="text-[10px] text-slate-500 font-medium">Probability: {Math.round((hotspot.time_window_probability || 0.8) * 100)}%</span>
          </div>
        </div>

        {/* Operational Statistics */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold block">Complaints</span>
            <span className="text-sm font-black text-slate-900">{hotspot.nearby_complaints}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold block">Flagged TX</span>
            <span className="text-sm font-black text-amber-700">{hotspot.suspicious_transactions}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold block">Nearby ATMs</span>
            <span className="text-sm font-black text-blue-700">{hotspot.nearby_atms}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold block">Mule ACC</span>
            <span className="text-sm font-black text-red-700">{hotspot.linked_accounts}</span>
          </div>
        </div>

        {/* Section: WHY IS THIS LOCATION HIGH RISK? */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Why is this location high risk?</h3>
          </div>

          <div className="space-y-3">
            {factors.map((f, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{f.name}</span>
                  <span className="font-bold text-blue-700">{Math.round(f.score)}</span>
                </div>
                {/* Contribution bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    style={{ width: `${Math.min(100, Math.max(5, f.score))}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600">{f.expl}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 italic">
            Risk factors are model-generated analytical indicators based on synthetic demonstration data.
          </p>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigateToTab('transactions', { search: hotspot.district, district: hotspot.district, hotspot })}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-300 transition shadow-xs cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Transactions</span>
          </button>
          <button
            onClick={() => onNavigateToTab('graph-intelligence', {
              focusId: hotspot.associated_case_id,
              caseId: hotspot.associated_case_id,
              district: hotspot.district,
              state: hotspot.state,
              zone_id: hotspot.zone_id,
              hotspot
            })}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-300 transition shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Network Graph</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigateToTab('investigations', {
              caseId: hotspot.associated_case_id,
              district: hotspot.district,
              state: hotspot.state,
              hotspotId: hotspot.id,
              hotspot
            })}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-xs cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Investigate</span>
          </button>
          <button
            onClick={() => onNavigateToTab('reports', {
              caseId: hotspot.associated_case_id,
              hotspot: hotspot,
              district: hotspot.district,
              state: hotspot.state
            })}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
