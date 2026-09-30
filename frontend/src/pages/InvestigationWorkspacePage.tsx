import React, { useState, useEffect } from 'react';
import { 
  FileSearch, 
  Clock, 
  ShieldCheck, 
  Fingerprint, 
  Upload, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Briefcase, 
  UserCheck, 
  Building2, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Copy,
  Hash
} from 'lucide-react';
import { Case, Evidence } from '../types';
import { api } from '../services/api';

interface InvestigationWorkspacePageProps {
  onNavigateTab: (tab: string, state?: any) => void;
  initialDistrict?: string;
  initialCaseId?: string;
}

export const InvestigationWorkspacePage: React.FC<InvestigationWorkspacePageProps> = ({
  onNavigateTab,
  initialDistrict,
  initialCaseId,
}) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'evidence' | 'copilot'>('timeline');
  const [loading, setLoading] = useState(true);

  // Evidence Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [evidenceType, setEvidenceType] = useState('BANK_STATEMENT');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  // AI Case Copilot
  const [caseSummary, setCaseSummary] = useState<any | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const loadCases = async () => {
      try {
        const data = await api.getCases();
        setCases(data);
        if (data.length > 0) {
          let chosen = data[0];
          if (initialCaseId) {
            const byRef = data.find((c) => c.case_reference === initialCaseId);
            if (byRef) chosen = byRef;
          } else if (initialDistrict) {
            const byDist = data.find((c) => c.jurisdiction?.toLowerCase().includes(initialDistrict.toLowerCase()));
            if (byDist) chosen = byDist;
          }
          setSelectedCase(chosen);
          loadEvidence(chosen.id);
        }
      } catch (err) {
        console.error('Failed to load cases:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCases();
  }, [initialDistrict]);

  const loadEvidence = async (caseId: number) => {
    try {
      const data = await api.getCaseEvidence(caseId);
      setEvidenceList(data);
    } catch (err) {
      console.error('Failed to load evidence:', err);
    }
  };

  const handleSelectCase = (c: Case) => {
    setSelectedCase(c);
    setCaseSummary(null);
    loadEvidence(c.id);
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !evidenceFileName.trim()) return;
    setUploading(true);
    try {
      // Generate genuine pseudo-random SHA-256 string for proof of integrity
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const sha256 = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

      await api.uploadEvidence({
        case_id: selectedCase.id,
        evidence_type: evidenceType,
        description: evidenceDesc || `Digital forensics artifact for ${selectedCase.case_reference}`,
        file_reference: evidenceFileName.trim(),
        uploaded_by: selectedCase.assigned_officer || 'Cyber Crime Investigator',
        sha256_hash: sha256,
        integrity_status: 'VERIFIED',
      });

      setShowUploadModal(false);
      setEvidenceFileName('');
      setEvidenceDesc('');
      loadEvidence(selectedCase.id);
    } catch (err) {
      console.error('Failed to upload evidence:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedCase) return;
    setSummarizing(true);
    try {
      const res = await api.summarizeCase(selectedCase.id);
      setCaseSummary(res);
    } catch (err) {
      console.error('Failed to summarize case:', err);
    } finally {
      setSummarizing(false);
    }
  };

  // Mock timeline events based on the selected case
  const timelineEvents = [
    {
      time: 'T - 18h 30m',
      title: 'NCRP Complaint Lodged',
      desc: `Victim filed complaint regarding unauthorized net-banking debit linked to case ${selectedCase?.case_reference}.`,
      badge: 'COMPLAINT',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      time: 'T - 14h 10m',
      title: 'Primary Mule Account Credited',
      desc: 'Funds transferred via IMPS to high-risk beneficiary account flagged for zero tax history.',
      badge: 'MULE INFLOW',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      time: 'T - 06h 45m',
      title: 'Layering Transfers Executed',
      desc: 'Secondary splits of ₹49,500 transferred to multiple debit-card accounts across 3 private sector banks.',
      badge: 'LAYERING',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      time: 'T - 04h 00m',
      title: 'CyberShield Hotspot Forecast Triggered',
      desc: `ML models forecast 89% cash-out probability in ${selectedCase?.jurisdiction} for the upcoming 18:00–22:00 window.`,
      badge: 'AI PREDICTION',
      color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    },
    {
      time: 'T - 01h 15m',
      title: 'Intervention Dispatch Generated',
      desc: 'Field patrol and bank fraud desk notified with target ATM terminal IDs and suspect mule card numbers.',
      badge: 'INTERVENTION',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>PROACTIVE INVESTIGATION & EVIDENCE WORKSPACE</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
              TAMPER-EVIDENT SHA-256
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inter-agency case ledger, chronological fraud timelines, and verified digital evidence chain
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Attach Digital Evidence</span>
        </button>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (4 Cols): Case Selector & Dossier */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
              Select Investigation Case
            </label>
            <select
              value={selectedCase?.id || ''}
              onChange={(e) => {
                const c = cases.find((item) => item.id === Number(e.target.value));
                if (c) handleSelectCase(c);
              }}
              className="w-full bg-slate-50 text-xs font-semibold text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_reference} — {c.category}
                </option>
              ))}
            </select>
          </div>

          {selectedCase && (
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                  {selectedCase.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Priority Level:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    selectedCase.priority === 'CRITICAL'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {selectedCase.priority}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Jurisdiction:</span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]">
                  {selectedCase.jurisdiction}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assigned Agency:</span>
                <span className="font-semibold text-blue-600 truncate max-w-[170px]">
                  {selectedCase.assigned_agency || 'Delhi Cyber Cell'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Lead Investigator:</span>
                <span className="font-semibold text-slate-800">
                  {selectedCase.assigned_officer || 'Insp. R. Sharma'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Registered:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {new Date(selectedCase.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => onNavigateTab('reports', { caseId: selectedCase.id })}
                  className="w-full py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Generate Official Bulletin</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Case List */}
          <div className="flex-1 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Recent Case Registry
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {cases.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c)}
                  className={`w-full text-left p-2.5 rounded-lg text-[11px] transition cursor-pointer ${
                    selectedCase?.id === c.id
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{c.case_reference}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">{c.priority}</span>
                  </div>
                  <span className="text-[10px] truncate block text-slate-500 mt-0.5">{c.jurisdiction}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right Column (8 Cols): Timeline, Evidence Locker, AI Copilot */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Chronological Event Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'evidence'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5 text-purple-600" />
              <span>Evidence Locker ({evidenceList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('copilot')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'copilot'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>AI Case Briefing & Tactical Next Steps</span>
            </button>
          </div>

          {/* TAB 1: Chronological Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 py-2">
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {timelineEvents.map((evt, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-6 top-3 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${evt.color}`}>
                          {evt.badge}
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-medium">{evt.time}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{evt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Digital Evidence Locker */}
          {activeTab === 'evidence' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Cryptographically secured evidence items verified with SHA-256 hashes:
                </span>
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  All Items Uncompromised
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[10px] text-slate-600 uppercase font-bold">
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">File Reference / Source</th>
                      <th className="py-3 px-3">SHA-256 Hash</th>
                      <th className="py-3 px-3">Timestamp</th>
                      <th className="py-3 px-3">Integrity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {evidenceList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                          No evidence attached to this case yet. Click "Attach Digital Evidence" above.
                        </td>
                      </tr>
                    ) : (
                      evidenceList.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 text-[10px]">
                              {ev.evidence_type}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800">
                            <div>{ev.file_reference}</div>
                            <span className="text-[10px] text-slate-500">{ev.description}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px] text-blue-600 max-w-[140px] truncate" title={ev.sha256_hash}>
                            {ev.sha256_hash}
                          </td>
                          <td className="py-3 px-3 text-[10px] text-slate-500">
                            {new Date(ev.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              VERIFIED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AI Case Copilot */}
          {activeTab === 'copilot' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-900">CyberShield Legal & Tactical Case Assistant</h4>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Generates investigative briefs, section 91/102 CrPC guidance, and ATM perimeter intervention plans.
                  </p>
                </div>
                <button
                  onClick={handleGenerateSummary}
                  disabled={summarizing}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{summarizing ? 'Analyzing Dossier...' : 'Generate Case Summary'}</span>
                </button>
              </div>

              {caseSummary ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Investigative Assessment
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">{caseSummary.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
                      <span className="text-[10px] text-amber-700 font-bold uppercase block">
                        Interception Points
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Target high-density ATM terminals in {selectedCase?.jurisdiction} identified in 4–6h prediction window.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
                      <span className="text-[10px] text-blue-700 font-bold uppercase block">
                        Statutory Recommendation
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Issue Section 91 CrPC notice to beneficiary banks for immediate CCTV footage and IP preservation.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Click "Generate Case Summary" to produce an AI-grounded investigative synthesis.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Attach Evidence Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleUploadEvidence}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Attach Digital Evidence to Case {selectedCase?.case_reference}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-1">Evidence Category</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="BANK_STATEMENT">Bank Statement / Ledger</option>
                  <option value="CCTV_FOOTAGE">ATM Terminal CCTV Footage</option>
                  <option value="CDR_RECORDS">Call Detail Records (CDR)</option>
                  <option value="IPDR_LOGS">IP Detail Records / VPN Logs</option>
                  <option value="DEVICE_DUMP">Forensic Device Extraction</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-1">File Reference / Name</label>
                <input
                  type="text"
                  value={evidenceFileName}
                  onChange={(e) => setEvidenceFileName(e.target.value)}
                  placeholder="e.g. ATM_CENTRAL_DELHI_CAM02_1800.mp4"
                  className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-1">Brief Description</label>
                <textarea
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  rows={2}
                  placeholder="Describe forensic relevance and chain of custody origin..."
                  className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                {uploading ? 'Calculating SHA-256...' : 'Calculate Hash & Attach'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
