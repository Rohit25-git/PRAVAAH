import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Building2, 
  Clock, 
  Share2, 
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Transaction } from '../types';
import { api } from '../services/api';

interface TransactionsPageProps {
  onNavigateTab: (tab: string, state?: any) => void;
  initialSearch?: string;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onNavigateTab,
  initialSearch,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [bankFilter, setBankFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 25,
      };
      if (suspiciousOnly) params.suspicious_only = true;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (bankFilter !== 'ALL') params.bank = bankFilter;
      if (districtFilter !== 'ALL') params.district = districtFilter;

      const res = await api.getTransactions(params);
      setTransactions(res.items || res);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
      setPage(1);
    }
  }, [initialSearch]);

  useEffect(() => {
    fetchTransactions();
  }, [suspiciousOnly, bankFilter, districtFilter, page, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const banks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Punjab National Bank',
    'Axis Bank',
    'Bank of Baroda',
    'Canara Bank',
  ];

  return (
    <div className="space-y-4 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>HIGH-VELOCITY TRANSACTION LEDGER</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              ISOLATION FOREST ANOMALY SCORED
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ATM cash-outs and account transfers cross-referenced with reported cybercrime victim complaints
          </p>
        </div>

        {/* Suspicious Only Toggle */}
        <button
          onClick={() => {
            setSuspiciousOnly(!suspiciousOnly);
            setPage(1);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-xs ${
            suspiciousOnly
              ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${suspiciousOnly ? 'text-amber-600' : 'text-slate-400'}`} />
          <span>{suspiciousOnly ? 'SHOWING SUSPICIOUS ONLY' : 'FILTER SUSPICIOUS ONLY'}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Tx Ref, Account or ATM..."
            className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-semibold">Bank:</span>
            <select
              value={bankFilter}
              onChange={(e) => {
                setBankFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 text-xs text-slate-800 font-medium p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Banks</option>
              {banks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-600 uppercase font-bold">
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Bank / Institution</th>
                <th className="py-3 px-4">ATM / Terminal</th>
                <th className="py-3 px-4">Amount (INR)</th>
                <th className="py-3 px-4">Anomaly Risk</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Loading high-velocity transaction records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isHigh = tx.risk_indicator >= 75;
                  const isMed = tx.risk_indicator >= 50 && tx.risk_indicator < 75;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {tx.transaction_reference}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-800 font-medium">
                        {tx.account_id}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {tx.bank}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500">
                        {tx.atm_id || 'ONLINE_IMPS'}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${
                            isHigh
                              ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                              : isMed
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {tx.risk_indicator} / 100
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>Page {page} • 25 Records per view</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>
            <span className="font-mono text-slate-900 font-bold px-2">{page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Drawer Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Transaction Forensic Dossier
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded hover:bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Transaction Reference:</span>
                <span className="font-mono font-bold text-blue-700">{selectedTx.transaction_reference}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Amount</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{Number(selectedTx.amount).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Anomaly Score</span>
                  <span
                    className={`text-base font-black ${
                      selectedTx.risk_indicator >= 70 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {selectedTx.risk_indicator} / 100
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Account ID:</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedTx.account_id}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Banking Institution:</span>
                  <span className="font-semibold text-slate-900">{selectedTx.bank}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Terminal Reference:</span>
                  <span className="font-mono text-slate-900">{selectedTx.atm_id || 'IMPS Transfer Gateway'}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-900 font-medium">{selectedTx.district}, {selectedTx.state}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Coordinates:</span>
                  <span className="font-mono text-blue-700 font-semibold">
                    {selectedTx.latitude?.toFixed(4)}, {selectedTx.longitude?.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    const acc = selectedTx.account_id;
                    setSelectedTx(null);
                    onNavigateTab('graph-intelligence', { focusId: acc });
                  }}
                  className="flex-1 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Trace in Mule Graph</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedTx(null);
                    onNavigateTab('bank-workflow', { txRef: selectedTx.transaction_reference });
                  }}
                  className="flex-1 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Flag for Bank Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
