import React from 'react';
import { X, Bell, AlertTriangle, ShieldCheck, CheckCheck } from 'lucide-react';
import { Alert } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  onAcknowledgeAlert: (id: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectAlert,
  onAcknowledgeAlert
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-[#141c30] border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0f172a]/80">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Live Intelligence Stream</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {alerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No active alerts at this time.
          </div>
        ) : (
          alerts.map((a) => {
            let color = 'border-l-emerald-500 bg-emerald-500/5';
            if (a.severity === 'CRITICAL') color = 'border-l-red-500 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.15)]';
            else if (a.severity === 'HIGH') color = 'border-l-orange-500 bg-orange-500/10';
            else if (a.severity === 'MEDIUM') color = 'border-l-yellow-500 bg-yellow-500/10';

            return (
              <div
                key={a.id}
                className={`p-3 rounded-lg border border-white/5 border-l-4 ${color} transition cursor-pointer hover:border-white/20`}
                onClick={() => onSelectAlert(a)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-current" />
                    {a.severity} ALERT
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold">Risk {a.risk_score}</span>
                </div>
                <p className="text-xs font-semibold text-slate-200">{a.location}</p>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{a.reason}</p>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400">
                  <span>Window: {a.predicted_time_window}</span>
                  {a.status === 'NEW' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcknowledgeAlert(a.id);
                      }}
                      className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/30 transition"
                    >
                      Acknowledge
                    </button>
                  )}
                  {a.status !== 'NEW' && (
                    <span className="text-emerald-400 font-medium">{a.status}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
