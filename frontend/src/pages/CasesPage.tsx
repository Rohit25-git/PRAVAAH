import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Building2, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Case } from '../types';
import { api } from '../services/api';

interface CasesPageProps {
  onNavigateTab: (tab: string, state?: any) => void;
}

export const CasesPage: React.FC<CasesPageProps> = ({ onNavigateTab }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Case Form State
  const [newCaseRef, setNewCaseRef] = useState(`CASE-2024-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newCategory, setNewCategory] = useState('Net Banking Fraud');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newJurisdiction, setNewJurisdiction] = useState('Central Delhi');
  const [newAgency, setNewAgency] = useState('Delhi Police Cyber Cell');
  const [newOfficer, setNewOfficer] = useState('Insp. R. Sharma');
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = async () => {
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCase({
        case_reference: newCaseRef,
        category: newCategory,
        priority: newPriority,
        jurisdiction: newJurisdiction,
        assigned_agency: newAgency,
        assigned_officer: newOfficer,
        status: 'UNDER_INVESTIGATION',
      });
      setShowCreateModal(false);
      fetchCases();
      setNewCaseRef(`CASE-2024-${Math.floor(1000 + Math.random() * 9000)}`);
    } catch (err) {
      console.error('Failed to create case:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.case_reference.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.jurisdiction.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: cases.length,
    critical: cases.filter((c) => c.priority === 'CRITICAL').length,
    active: cases.filter((c) => c.status === 'UNDER_INVESTIGATION' || c.status === 'NEW').length,
    resolved: cases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length,
  };

  return (
    <div className="space-y-4 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>INTER-AGENCY CASE MANAGEMENT LEDGER</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
              NATIONAL INTEGRATION
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organized cybercrime syndicate dossiers linked to predictive cash-out interception points
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Cybercrime Case</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Cases</span>
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-red-600 font-bold uppercase block">Critical Priority</span>
            <span className="text-2xl font-black text-red-600">{stats.critical}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-600 font-bold uppercase block">Active Investigations</span>
            <span className="text-2xl font-black text-amber-600">{stats.active}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-600 font-bold uppercase block">Intervened / Solved</span>
            <span className="text-2xl font-black text-emerald-600">{stats.resolved}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by case ref, category, jurisdiction..."
            className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 text-xs text-slate-800 font-semibold p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 text-xs text-slate-800 font-semibold p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION</option>
            <option value="NEW">NEW</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] text-slate-600 uppercase font-bold">
                <th className="py-3 px-4">Case Reference</th>
                <th className="py-3 px-4">Crime Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Assigned Agency & Officer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No cases match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {c.case_reference}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {c.category}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${
                          c.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : c.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-700 border-orange-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {c.jurisdiction}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{c.assigned_agency || 'State Cyber Cell'}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{c.assigned_officer || 'Investigator'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigateTab('investigations', { caseRef: c.case_reference, district: c.jurisdiction })}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Workspace</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCase}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Register New Cybercrime Syndicate Case</span>
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Case Reference ID</label>
                  <input
                    type="text"
                    value={newCaseRef}
                    onChange={(e) => setNewCaseRef(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Crime Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 font-medium"
                  >
                    <option value="Net Banking Fraud">Net Banking Fraud</option>
                    <option value="UPI Impersonation">UPI Impersonation</option>
                    <option value="ATM Cash-Out Syndicate">ATM Cash-Out Syndicate</option>
                    <option value="Investment Scam">Investment Scam</option>
                    <option value="SIM Swap Extortion">SIM Swap Extortion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 font-medium"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Jurisdiction / District</label>
                  <input
                    type="text"
                    value={newJurisdiction}
                    onChange={(e) => setNewJurisdiction(e.target.value)}
                    placeholder="e.g. Central Delhi"
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Assigned Agency</label>
                  <input
                    type="text"
                    value={newAgency}
                    onChange={(e) => setNewAgency(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Lead Investigator</label>
                  <input
                    type="text"
                    value={newOfficer}
                    onChange={(e) => setNewOfficer(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Register Case'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
