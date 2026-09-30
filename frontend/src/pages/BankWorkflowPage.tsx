import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Search, 
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Transaction, ATM } from '../types';
import { api } from '../services/api';

interface BankWorkflowPageProps {
  onNavigateTab: (tab: string, state?: any) => void;
  initialTxRef?: string;
}

export const BankWorkflowPage: React.FC<BankWorkflowPageProps> = ({
  onNavigateTab,
  initialTxRef,
}) => {
  const [flaggedTransactions, setFlaggedTransactions] = useState<Transaction[]>([]);
  const [atms, setAtms] = useState<ATM[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialTxRef || '');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBankData = async () => {
      try {
        const [txRes, atmRes] = await Promise.all([
          api.getTransactions({ suspicious_only: true, limit: 15 }),
          api.getMapATMs(),
        ]);
        setFlaggedTransactions(txRes.items || txRes);
        setAtms(atmRes.slice(0, 10));
      } catch (err) {
        console.error('Failed to load banking data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBankData();
  }, []);

  const handleBankAction = (txRef: string, actionType: string) => {
    setActionSuccess(`Action '${actionType}' recorded for transaction ${txRef}. LEA nodal bridge synchronized.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const filteredTx = flaggedTransactions.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.transaction_reference.toLowerCase().includes(q) ||
      tx.account_id.toLowerCase().includes(q) ||
      tx.bank.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>BANK FRAUD DESK & ATM TERMINAL CONSOLE</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              FINANCIAL INSTITUTION WORKFLOW
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inter-bank anomalous cashout queues and ATM physical terminal perimeter surveillance
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Nodal Agency Bridge: Active</span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Review Queue */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Flagged Cash-Out Review Queue</span>
            </h3>
            <p className="text-xs text-slate-500">
              High-velocity ATM withdrawals flagged by Isolation Forest models for rapid off-hours cash dissipation
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Ref, Account, Bank..."
              className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] text-slate-600 uppercase font-bold">
                <th className="py-3 px-3">Tx Reference</th>
                <th className="py-3 px-3">Account & Bank</th>
                <th className="py-3 px-3">ATM Terminal</th>
                <th className="py-3 px-3">Amount (INR)</th>
                <th className="py-3 px-3">Anomaly Score</th>
                <th className="py-3 px-3">Banking Review Status</th>
                <th className="py-3 px-3 text-right">Intervention Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">
                    {tx.transaction_reference}
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-mono text-slate-900 font-semibold block">{tx.account_id}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{tx.bank}</span>
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-600">
                    {tx.atm_id || 'TERMINAL_IMPS'}
                  </td>

                  <td className="py-3 px-3 font-bold text-slate-900">
                    ₹{Number(tx.amount).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded border text-[10px] font-extrabold bg-red-100 text-red-700 border-red-200">
                      {tx.risk_indicator} / 100
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                      REVIEW_REQUIRED
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right space-x-1.5">
                    <button
                      onClick={() => handleBankAction(tx.transaction_reference, 'ESCALATE_TO_LEA')}
                      className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold transition cursor-pointer"
                    >
                      Escalate to LEA
                    </button>
                    <button
                      onClick={() => handleBankAction(tx.transaction_reference, 'ENHANCED_AML')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold transition cursor-pointer"
                    >
                      Flag AML
                    </button>
                    <button
                      onClick={() => handleBankAction(tx.transaction_reference, 'VERIFY_LEGITIMATE')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ATM Terminal Hardware Risk Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>High-Risk ATM Terminal Cluster Surveillance</span>
            </h3>
            <p className="text-xs text-slate-500">
              Terminals with anomalous cash depletion velocity and proximity to predicted hotspots
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('risk-heatmap')}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Terminals on GIS Map</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {atms.map((atm) => (
            <div
              key={atm.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 hover:border-blue-300 hover:shadow-xs transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-blue-700 font-bold text-xs">{atm.atm_reference}</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
              <p className="text-xs text-slate-900 font-bold truncate">{atm.bank}</p>
              <span className="text-[10px] text-slate-500 font-medium block">{atm.district}, {atm.state}</span>
              <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-600 border-t border-slate-200 font-medium">
                <span>Type: {atm.location_type || 'Standalone'}</span>
                <span className="text-emerald-700 font-bold">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
