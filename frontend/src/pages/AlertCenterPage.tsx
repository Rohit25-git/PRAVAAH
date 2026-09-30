import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  Search, 
  Filter, 
  Radio, 
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Alert, RiskLevel } from '../types';
import { api } from '../services/api';

interface AlertCenterPageProps {
  onNavigateTab: (tab: string, state?: any) => void;
  liveAlerts: Alert[];
}

export const AlertCenterPage: React.FC<AlertCenterPageProps> = ({
  onNavigateTab,
  liveAlerts,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [assigningAlert, setAssigningAlert] = useState<Alert | null>(null);
  const [assignedOfficer, setAssignedOfficer] = useState('');
  const [assignedAgency, setAssignedAgency] = useState('Delhi Police Cyber Cell');

  const [resolvingAlert, setResolvingAlert] = useState<Alert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts(severityFilter, statusFilter);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  // Merge liveAlerts from WebSocket if any new one arrived
  useEffect(() => {
    if (liveAlerts.length > 0) {
      setAlerts((prev) => {
        const ids = new Set(prev.map((a) => a.id));
        const newUniques = liveAlerts.filter((a) => !ids.has(a.id));
        return [...newUniques, ...prev];
      });
    }
  }, [liveAlerts]);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED', acknowledged_at: new Date().toISOString() } : a))
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assigningAlert || !assignedOfficer.trim()) return;
    try {
      await api.assignAlert(assigningAlert.id, assignedOfficer.trim(), assignedAgency);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === assigningAlert.id
            ? { ...a, status: 'ASSIGNED', assigned_to: assignedOfficer.trim(), agency: assignedAgency }
            : a
        )
      );
      setAssigningAlert(null);
      setAssignedOfficer('');
    } catch (err) {
      console.error('Failed to assign alert:', err);
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolvingAlert) return;
    try {
      await api.resolveAlert(resolvingAlert.id, resolutionNotes.trim());
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === resolvingAlert.id
            ? { ...a, status: 'RESOLVED', resolved_at: new Date().toISOString() }
            : a
        )
      );
      setResolvingAlert(null);
      setResolutionNotes('');
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.location.toLowerCase().includes(q) ||
        a.jurisdiction.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>REAL-TIME HOTSPOT ALERT CONSOLE</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
              <Radio className="w-3 h-3 text-red-600 animate-pulse" />
              WEBSOCKET DISPATCH ACTIVE
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deduplicated real-time notifications for automated LEA and banking intervention
          </p>
        </div>

        {/* Severity Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                severityFilter === sev
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by jurisdiction, location or reason..."
            className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] text-slate-500 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 text-xs text-slate-800 font-semibold p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] text-slate-600 uppercase font-bold">
                <th className="py-3 px-4">Severity & Score</th>
                <th className="py-3 px-4">Hotspot Location</th>
                <th className="py-3 px-4">Forecast Window</th>
                <th className="py-3 px-4">Detection Indicator</th>
                <th className="py-3 px-4">Status & Assigned</th>
                <th className="py-3 px-4 text-right">Intervention Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No active alerts matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  let sevClass = 'bg-amber-100 text-amber-800 border-amber-200';
                  if (alert.severity === 'CRITICAL') sevClass = 'bg-red-100 text-red-700 border-red-200 animate-pulse';
                  else if (alert.severity === 'HIGH') sevClass = 'bg-orange-100 text-orange-700 border-orange-200';

                  return (
                    <tr key={alert.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${sevClass}`}>
                            {alert.severity}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{alert.risk_score}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">ID: #{alert.id}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{alert.location}</span>
                        <span className="text-[10px] text-blue-600 font-medium">{alert.jurisdiction}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{alert.predicted_time_window}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed font-medium">
                          {alert.reason}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded border inline-block ${
                            alert.status === 'NEW'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : alert.status === 'ACKNOWLEDGED'
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : alert.status === 'ASSIGNED'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {alert.status}
                        </span>
                        {alert.assigned_to && (
                          <span className="text-[10px] text-slate-600 block mt-1 flex items-center gap-1 font-medium">
                            <UserCheck className="w-3 h-3 text-blue-600" />
                            {alert.assigned_to}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {alert.status === 'NEW' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold transition cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}

                        {alert.status !== 'RESOLVED' && (
                          <>
                            <button
                              onClick={() => {
                                setAssigningAlert(alert);
                                setAssignedOfficer(alert.assigned_to || '');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold transition cursor-pointer"
                            >
                              Assign
                            </button>
                            <button
                              onClick={() => setResolvingAlert(alert)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold transition cursor-pointer"
                            >
                              Resolve
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => onNavigateTab('investigations', { location: alert.location })}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold transition cursor-pointer"
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {assigningAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Assign Alert #{assigningAlert.id} to Investigating Officer
            </h3>
            <p className="text-xs text-slate-500">
              Location: <span className="text-slate-900 font-semibold">{assigningAlert.location}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-1">Enforcement Agency</label>
                <select
                  value={assignedAgency}
                  onChange={(e) => setAssignedAgency(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Delhi Police Cyber Cell">Delhi Police Cyber Cell</option>
                  <option value="Mumbai Cyber Crime Branch">Mumbai Cyber Crime Branch</option>
                  <option value="Bangalore CID Cyber Cell">Bangalore CID Cyber Cell</option>
                  <option value="I4C Central Cyber Unit">I4C Central Cyber Unit</option>
                  <option value="CBI Cyber Crime Division">CBI Cyber Crime Division</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-1">Investigating Officer Name</label>
                <input
                  type="text"
                  value={assignedOfficer}
                  onChange={(e) => setAssignedOfficer(e.target.value)}
                  placeholder="e.g. Insp. Rajesh Sharma"
                  className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAssigningAlert(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs cursor-pointer"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Resolve Hotspot Alert #{resolvingAlert.id}
            </h3>
            <p className="text-xs text-slate-500">
              Document proactive field or banking actions taken prior to cash withdrawal.
            </p>

            <div>
              <label className="text-[10px] text-slate-600 font-bold block mb-1">Intervention & Resolution Notes</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                placeholder="e.g. PCR patrol dispatched to ATM cluster. Suspect ATM terminals alerted to bank security. 2 mule cards frozen in transit."
                className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingAlert(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Mark Resolved & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
