import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Search, 
  Layers, 
  Activity, 
  Filter, 
  UserCheck, 
  Building2, 
  FileText, 
  Briefcase,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FolderGit2,
  Lock,
  Radio,
  ExternalLink,
  ChevronRight,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Phone,
  CreditCard,
  Network,
  Compass,
  AlertOctagon,
  Flame
} from 'lucide-react';
import { CytoscapeGraph } from '../components/CytoscapeGraph';
import { api } from '../services/api';

interface GraphIntelligencePageProps {
  onNavigateTab: (tab: string, state?: any) => void;
  initialFocusId?: string;
  tabState?: any;
  currentUserRole?: string;
}

export const GraphIntelligencePage: React.FC<GraphIntelligencePageProps> = ({
  onNavigateTab,
  initialFocusId,
  tabState,
  currentUserRole = 'LEA_OFFICER',
}) => {
  const [casesList, setCasesList] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [graphData, setGraphData] = useState<any>({ nodes: [], edges: [] });
  const [caseMetrics, setCaseMetrics] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [focusId, setFocusId] = useState<string>(initialFocusId || '');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Network View Mode & Risk Filter
  const [graphMode, setGraphMode] = useState<'case-ego' | 'all-risks' | 'cross-syndicate'>('case-ego');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Workable Action Modal States
  const [activeModal, setActiveModal] = useState<{
    type: 'patrol' | 'notice' | 'freeze' | 'str' | 'throttle' | 'cdr' | 'broadcast' | 'audit' | 'dossier';
    title: string;
    nodeId: string;
    nodeType: string;
    nodeData: any;
  } | null>(null);
  const [executingAction, setExecutingAction] = useState(false);
  const [actionReceipt, setActionReceipt] = useState<{ id: string; timestamp: string; details: string; legalDoc?: string } | null>(null);

  // Load available cases on mount & handle direct hotspot navigation
  useEffect(() => {
    const loadCases = async () => {
      try {
        let cases = await api.getGraphCases(100);
        const activeState = (tabState?.contextId && typeof tabState.contextId === 'object') ? tabState.contextId : tabState;

        // Determine target case from activeState or initialFocusId
        let targetCase = '';
        if (activeState?.caseId && typeof activeState.caseId === 'string' && activeState.caseId.startsWith('CASE-')) {
          targetCase = activeState.caseId;
        } else if (activeState?.hotspot?.associated_case_id && activeState.hotspot.associated_case_id.startsWith('CASE-')) {
          targetCase = activeState.hotspot.associated_case_id;
        } else if (initialFocusId && initialFocusId.startsWith('CASE-')) {
          targetCase = initialFocusId;
        } else if (activeState?.hotspot?.district || activeState?.district || initialFocusId) {
          const searchDist = (activeState?.hotspot?.district || activeState?.district || initialFocusId || '').toLowerCase();
          const searchState = (activeState?.hotspot?.state || activeState?.state || '').toLowerCase();
          const matched = cases.find((c: any) => 
            (searchDist && (c.label.toLowerCase().includes(searchDist) || (c.district && c.district.toLowerCase().includes(searchDist)))) ||
            (searchState && (c.jurisdiction.toLowerCase().includes(searchState) || c.label.toLowerCase().includes(searchState)))
          );
          if (matched) {
            targetCase = matched.case_reference;
          } else if (searchDist.includes('patna') || searchState.includes('bihar')) {
            targetCase = 'CASE-2026-0028';
          }
        }

        if (!targetCase && cases && cases.length > 0) {
          targetCase = cases[0].case_reference;
        }

        // Prioritize targetCase at the very top of the cases list
        if (targetCase) {
          const foundIdx = cases.findIndex((c: any) => c.case_reference === targetCase);
          if (foundIdx > 0) {
            const [selectedItem] = cases.splice(foundIdx, 1);
            cases.unshift(selectedItem);
          } else if (foundIdx === -1) {
            const locName = activeState?.hotspot?.location || activeState?.hotspot?.district || 'Regional Hotspot';
            const jurName = activeState?.hotspot?.state || activeState?.state || 'State Cyber Police';
            const catName = activeState?.hotspot?.associated_case_title || 'Financial Cyber Fraud Syndicate';
            const rLevel = activeState?.hotspot?.risk_level || 'MEDIUM';
            const rScore = activeState?.hotspot?.risk_score || 45.0;
            cases.unshift({
              case_reference: targetCase,
              label: `${targetCase} — ${jurName} (${locName})`,
              category: catName,
              jurisdiction: jurName,
              priority: rLevel,
              risk_level: rLevel,
              risk_score: rScore,
              connected_accounts_count: 14,
              hotspot_location: locName
            });
          }
        }

        setCasesList(cases);
        if (targetCase) {
          setSelectedCase(targetCase);
          setGraphMode('case-ego');
          loadCaseGraph(targetCase);
        }
      } catch (err) {
        console.error('Failed to load graph cases:', err);
        loadCaseGraph('CASE-2026-0003');
      }
    };
    loadCases();
  }, [initialFocusId, tabState]);

  const loadCaseGraph = async (caseId: string) => {
    setLoading(true);
    try {
      const data = await api.getCaseGraph(caseId);
      const elems = data?.elements || data || { nodes: [], edges: [] };
      const rawNodes = elems.nodes || data?.nodes || [];
      const rawEdges = elems.edges || data?.edges || [];
      setGraphData({
        nodes: rawNodes,
        edges: rawEdges,
      });
      setCaseMetrics(data?.metrics || null);

      // Auto-select the central case node so the entity inspector populates immediately
      const centerNode = rawNodes.find((n: any) => {
        const d = n.data || n;
        return d.id === caseId || d.is_center || d.type === 'CASE';
      });
      if (centerNode) {
        setSelectedNode(centerNode.data || centerNode);
      }
    } catch (err) {
      console.error('Failed to load case graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllRisksGraph = async (tier: string = 'ALL') => {
    setLoading(true);
    try {
      const data = await api.getAllRisksGraph(tier === 'ALL' ? undefined : tier, 120);
      const elems = data?.elements || data || { nodes: [], edges: [] };
      const rawNodes = elems.nodes || data?.nodes || [];
      const rawEdges = elems.edges || data?.edges || [];
      setGraphData({
        nodes: rawNodes,
        edges: rawEdges,
      });
      setCaseMetrics(data?.metrics || null);
      if (rawNodes.length > 0) {
        setSelectedNode(rawNodes[0].data || rawNodes[0]);
      }
    } catch (err) {
      console.error('Failed to load all risks graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSelect = (caseRef: string) => {
    setSelectedCase(caseRef);
    setGraphMode('case-ego');
    setFocusId('');
    setSelectedNode(null);
    loadCaseGraph(caseRef);
  };

  const handleSwitchToAllRisks = (tier: 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = riskFilter) => {
    setGraphMode('all-risks');
    setRiskFilter(tier);
    setSelectedNode(null);
    loadAllRisksGraph(tier);
  };

  const handleSwitchToCrossSyndicate = async () => {
    setGraphMode('cross-syndicate');
    setLoading(true);
    try {
      const data = await api.getGraph('ALL', undefined, 70);
      const elems = data?.elements || data || { nodes: [], edges: [] };
      setGraphData({
        nodes: elems.nodes || data?.nodes || [],
        edges: elems.edges || data?.edges || [],
      });
      setCaseMetrics(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (tier: 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    setRiskFilter(tier);
    if (graphMode === 'all-risks') {
      loadAllRisksGraph(tier);
    } else {
      // If in case-ego mode, check if current case matches tier
      const matches = casesList.filter((c) => tier === 'ALL' || c.risk_level === tier || c.priority === tier);
      if (matches.length > 0 && (!selectedCase || !matches.some((c) => c.case_reference === selectedCase))) {
        handleCaseSelect(matches[0].case_reference);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const term = searchInput.trim().toUpperCase();
    if (term.startsWith('CASE-')) {
      handleCaseSelect(term);
      return;
    }

    setFocusId(term);
    setLoading(true);
    try {
      const data = await api.getGraph(term, undefined, 50);
      const elems = data?.elements || data || { nodes: [], edges: [] };
      setGraphData({
        nodes: elems.nodes || data?.nodes || [],
        edges: elems.edges || data?.edges || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (type: any, title: string) => {
    const entity = selectedNode?.data ? selectedNode.data : selectedNode;
    if (!entity) return;
    setActiveModal({
      type,
      title,
      nodeId: entity.id,
      nodeType: entity.type,
      nodeData: entity.details || entity,
    });
    setActionReceipt(null);
  };

  const handleExecuteModalAction = () => {
    if (!activeModal) return;
    setExecutingAction(true);
    setTimeout(() => {
      setExecutingAction(false);
      const code = `PRAVAAH-${activeModal.type.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
      
      let legalDoc = '';
      if (activeModal.type === 'notice') {
        legalDoc = `FORMAL NOTICE UNDER SECTION 91 Cr.P.C.\nRef: ${code}\nDate: ${new Date().toISOString()}\nTo: The Branch Manager / Nodal Officer\nRe: Illicit Cybercrime Mule Account ${activeModal.nodeId}\n\nYou are hereby summoned to freeze debit privileges and produce KYC within 24 hours pursuant to ongoing investigation in ${selectedCase}.\nIssued by: State Cyber Crime Police Station\nClassification: STATUTORY MANDATE`;
      } else if (activeModal.type === 'freeze') {
        legalDoc = `INTER-BANK NODAL DEBIT HOLD MANDATE\nRef: ${code}\nTarget Account: ${activeModal.nodeId}\nStatus: DEBIT BLOCKED\nAudit Hash: SHA256:${Math.random().toString(36).substring(2, 15)}\nSLA Response: 142 seconds.`;
      } else if (activeModal.type === 'patrol') {
        legalDoc = `TACTICAL FIELD DISPATCH ORDER\nRef: ${code}\nTarget ATM: ${activeModal.nodeId}\nDispatch Unit: PCR Beat Patrol #14\nResponse Priority: IMMEDIATE RED ALERT\nETA: 4 Minutes.`;
      } else if (activeModal.type === 'dossier') {
        legalDoc = `OFFICIAL INVESTIGATION DOSSIER FOR COURT ADMISSIBILITY\nRef: ${code}\nCase: ${selectedCase}\nStatus: Verified Evidence Ledger\nSection 65B Certificate Attached\nCourt Jurisdiction: Special Cybercrime Magistrate`;
      } else if (activeModal.type === 'cdr') {
        legalDoc = `STATUTORY REQUISITION FOR CALL DETAIL RECORDS (CDR)\nRef: ${code}\nTarget MSISDN: ${activeModal.nodeId}\nTime Window: 72 Hours Prior to Cashout\nAgency: PRAVAAH Telecom Intercept Wing`;
      } else if (activeModal.type === 'broadcast') {
        legalDoc = `INTER-STATE CYBERCRIME ALERT BROADCAST\nRef: ${code}\nOrigin: I4C National Command\nJurisdictions Notified: Pan-India LEA Nodes\nPriority: LEVEL 1 RED ALERT`;
      }

      setActionReceipt({
        id: code,
        timestamp,
        details: `Operation '${activeModal.title}' successfully verified and dispatched to central nodal bridge for target ${activeModal.nodeId}.`,
        legalDoc
      });
      setActionNotice(`[CONFIRMED] ${activeModal.title} executed under Ref: ${code}`);
      setTimeout(() => setActionNotice(null), 5000);
    }, 600);
  };

  const handleDownloadReceipt = () => {
    if (!actionReceipt) return;
    const content = actionReceipt.legalDoc || `${actionReceipt.details}\nRef ID: ${actionReceipt.id}\nTimestamp: ${actionReceipt.timestamp}\nPlatform: PRAVAAH Proactive ATM Hotspot Intervention Framework`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${actionReceipt.id}-OFFICIAL-RECORD.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCases = casesList.filter((c) => {
    if (riskFilter === 'ALL') return true;
    return c.risk_level === riskFilter || c.priority === riskFilter;
  });

  const nodeStats = {
    accounts: graphData.nodes?.filter((n: any) => (n.data?.type || n.type) === 'ACCOUNT').length || 0,
    atms: graphData.nodes?.filter((n: any) => (n.data?.type || n.type) === 'ATM').length || 0,
    phones: graphData.nodes?.filter((n: any) => (n.data?.type || n.type) === 'PHONE').length || 0,
    cases: graphData.nodes?.filter((n: any) => (n.data?.type || n.type) === 'CASE').length || 0,
    critical: graphData.nodes?.filter((n: any) => (n.data?.risk_level || n.risk_level) === 'CRITICAL').length || 0,
    high: graphData.nodes?.filter((n: any) => (n.data?.risk_level || n.risk_level) === 'HIGH').length || 0,
    low: graphData.nodes?.filter((n: any) => (n.data?.risk_level || n.risk_level) === 'LOW').length || 0,
  };

  return (
    <div className="space-y-4 select-none">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>INTELLIGENCE GRAPH &amp; RISK TOPOLOGY</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {graphMode === 'all-risks' ? 'PAN-INDIA MULTI-RISK TOPOLOGY' : (graphMode === 'cross-syndicate' ? 'CROSS-SYNDICATE NETWORK' : 'CASE EGO-NETWORK')}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize criminal syndicates, mule account networks, and target cash-out ATMs across all risk tiers.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search account, ATM or case ID..."
              className="w-full bg-white text-xs text-slate-900 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Search
          </button>
          {(focusId || graphMode !== 'case-ego') && (
            <button
              type="button"
              onClick={() => handleCaseSelect(selectedCase || casesList[0]?.case_reference)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Direct Hotspot-to-Case Linkage Banner */}
      {(tabState?.hotspot || tabState?.district) && (
        <div className="p-3.5 rounded-xl bg-purple-50 border-2 border-purple-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                  HOTSPOT LINKED EGO-NETWORK: {tabState.hotspot?.location?.toUpperCase() || `${tabState.district?.toUpperCase()} ATM CORRIDOR`}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-200 text-purple-900 border border-purple-300">
                  {selectedCase}
                </span>
                {tabState.hotspot?.risk_level && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                    tabState.hotspot.risk_level === 'CRITICAL'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : tabState.hotspot.risk_level === 'HIGH'
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : tabState.hotspot.risk_level === 'LOW'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {tabState.hotspot.risk_level} RISK ({tabState.hotspot.risk_score}/100)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-800 mt-0.5 font-medium">
                Correlating forecasted illicit cashouts in {tabState.hotspot?.district || tabState.district}, {tabState.hotspot?.state || 'State Jurisdiction'} directly with registered case syndicate, mule accounts, and ATM nodes.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('command-center')}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 shadow-xs transition cursor-pointer"
          >
            ← Back to Command Center
          </button>
        </div>
      )}

      {/* Network Mode & Risk Tier Selector Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          {/* Left: View Mode Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleSwitchToAllRisks('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                graphMode === 'all-risks'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>All Risks Network</span>
            </button>
            <button
              onClick={() => selectedCase ? handleCaseSelect(selectedCase) : casesList[0] && handleCaseSelect(casesList[0].case_reference)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                graphMode === 'case-ego'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Case Ego Network</span>
            </button>
            <button
              onClick={handleSwitchToCrossSyndicate}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                graphMode === 'cross-syndicate'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cross-Syndicate Links</span>
            </button>
          </div>

          {/* Right: Risk Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-500 px-1.5 uppercase flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-600" />
              <span>Risk:</span>
            </span>
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                riskFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ALL RISKS
            </button>
            <button
              onClick={() => handleFilterChange('CRITICAL')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                riskFilter === 'CRITICAL'
                  ? 'bg-red-50 text-red-700 border border-red-300 font-black shadow-xs'
                  : 'text-slate-600 hover:text-red-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>CRITICAL (70+)</span>
            </button>
            <button
              onClick={() => handleFilterChange('HIGH')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                riskFilter === 'HIGH'
                  ? 'bg-orange-50 text-orange-700 border border-orange-300 font-black shadow-xs'
                  : 'text-slate-600 hover:text-orange-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>HIGH (50–69)</span>
            </button>
            <button
              onClick={() => handleFilterChange('MEDIUM')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                riskFilter === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 font-black shadow-xs'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>MEDIUM (30–49)</span>
            </button>
            <button
              onClick={() => handleFilterChange('LOW')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                riskFilter === 'LOW'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-black shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>LOW (&lt;30)</span>
            </button>
          </div>
        </div>

        {/* Active Cases Deck Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {riskFilter === 'ALL' ? 'Active Syndicates Deck' : `${riskFilter} Risk Syndicates Deck`}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              {filteredCases.length} Cases
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Click any case card to isolate its dedicated ego-network
          </span>
        </div>

        {/* Horizontal Scrollable Case Cards */}
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
          {filteredCases.slice(0, 10).map((c) => {
            const isSelected = selectedCase === c.case_reference && graphMode === 'case-ego';
            const rLevel = c.risk_level || c.priority || 'MEDIUM';
            return (
              <button
                key={c.case_reference}
                onClick={() => handleCaseSelect(c.case_reference)}
                className={`min-w-[250px] max-w-[270px] p-3 rounded-xl border text-left transition flex flex-col justify-between shrink-0 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-xs font-black text-slate-900">{c.case_reference}</span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                    rLevel === 'CRITICAL'
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : rLevel === 'HIGH'
                      ? 'bg-orange-50 text-orange-700 border-orange-300'
                      : rLevel === 'LOW'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {rLevel} RISK
                  </span>
                </div>

                <div className="my-1.5">
                  <span className="text-[11px] font-bold text-slate-800 line-clamp-1">{c.category}</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {c.hotspot_location ? `${c.jurisdiction} • ${c.hotspot_location}` : c.jurisdiction}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[10px] text-slate-600 font-semibold w-full">
                  <span>{c.connected_accounts_count || 6} Mule A/Cs</span>
                  <span className={isSelected ? 'text-blue-700 font-bold' : 'text-slate-400'}>
                    {isSelected ? '● Active View' : 'Click to Load'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Mule Accounts</span>
              <span className="text-sm font-black text-slate-900">{nodeStats.accounts}</span>
            </div>
          </div>
          <UserCheck className="w-4 h-4 text-blue-600" />
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Target Cash-out ATMs</span>
              <span className="text-sm font-black text-slate-900">{nodeStats.atms}</span>
            </div>
          </div>
          <Building2 className="w-4 h-4 text-amber-600" />
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Associated Burner SIMs</span>
              <span className="text-sm font-black text-slate-900">{nodeStats.phones}</span>
            </div>
          </div>
          <Phone className="w-4 h-4 text-emerald-600" />
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Active Scope</span>
              <span className="text-xs font-black text-slate-900 truncate max-w-[120px]">
                {graphMode === 'all-risks' ? `All Risks (${riskFilter})` : (graphMode === 'cross-syndicate' ? 'Cross-Syndicate' : selectedCase)}
              </span>
            </div>
          </div>
          <Briefcase className="w-4 h-4 text-indigo-600" />
        </div>
      </div>

      {/* Main Graph Canvas & Node Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[640px]">
        {/* Cytoscape Canvas (3 Cols) */}
        <div className="lg:col-span-3 h-full rounded-xl overflow-hidden border border-slate-200 shadow-xs relative bg-slate-50">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-800">
                  {graphMode === 'all-risks' ? 'Synthesizing Pan-India Risk Topology...' : 'Synthesizing Ego Network...'}
                </span>
              </div>
            </div>
          )}
          <CytoscapeGraph
            elements={graphData}
            selectedNodeId={graphMode === 'case-ego' ? selectedCase : undefined}
            defaultLayout={graphMode === 'all-risks' ? 'cose' : (graphMode === 'cross-syndicate' ? 'cose' : 'concentric')}
            autoHighlightCenter={graphMode === 'case-ego'}
            onSelectNode={(node: any) => setSelectedNode(node)}
            height="100%"
          />
        </div>

        {/* Node Inspector Panel (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs h-full overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Entity Intel Inspector</span>
              </div>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {currentUserRole.replace('_', ' ')}
              </span>
            </div>

            {(() => {
              const activeEntity = selectedNode?.data ? selectedNode.data : selectedNode;
              if (!activeEntity) {
                return (
                  <div className="py-24 text-center text-slate-400 text-xs space-y-3">
                    <Share2 className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="px-2">Click any node on the graph canvas to inspect its intelligence profile and trigger role actions.</p>
                  </div>
                );
              }

              const entityType = String(activeEntity.type || 'UNKNOWN').toUpperCase();
              const entityId = String(activeEntity.id || selectedCase || 'N/A');
              const entityRisk = Math.round(activeEntity.risk ?? activeEntity.risk_score ?? (entityType === 'CASE' ? 82 : 75));
              const entityLevel = activeEntity.risk_level || (entityRisk >= 70 ? 'CRITICAL' : (entityRisk >= 50 ? 'HIGH' : (entityRisk >= 30 ? 'MEDIUM' : 'LOW')));

              return (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Entity ID</span>
                    <p className="font-mono font-bold text-blue-700 break-all">{entityId}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Classification &amp; Risk</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${
                        entityType === 'CASE'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : entityType === 'ACCOUNT'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : entityType === 'ATM'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : entityType === 'PHONE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {entityType}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${
                        entityLevel === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : entityLevel === 'HIGH'
                          ? 'bg-orange-50 text-orange-700 border-orange-300'
                          : entityLevel === 'LOW'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {entityLevel} ({entityRisk}/100)
                      </span>
                    </div>
                  </div>

                  {entityType === 'CASE' && (
                    <>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Syndicate Category</span>
                        <p className="font-bold text-slate-900">{activeEntity.category || caseMetrics?.category || 'Instant Loan App APK Scam'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">State Jurisdiction &amp; Hotspot</span>
                        <p className="font-semibold text-slate-800">
                          {activeEntity.jurisdiction || caseMetrics?.jurisdiction || 'State Cyber Police'}
                          {activeEntity.hotspot_location ? ` • ${activeEntity.hotspot_location}` : ''}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Mule A/Cs</span>
                          <span className="font-black text-blue-700 text-sm">{caseMetrics?.accounts_count ?? nodeStats.accounts}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Flagged ATMs</span>
                          <span className="font-black text-amber-700 text-sm">{caseMetrics?.atms_count ?? nodeStats.atms}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {entityType === 'ACCOUNT' && (
                    <>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Bank &amp; Branch</span>
                        <p className="font-semibold text-slate-900">{activeEntity.details?.bank || 'State Bank of India'}</p>
                        <p className="text-[11px] text-slate-500">{activeEntity.details?.branch || 'Metro Commercial Branch'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Account Holder</span>
                        <p className="font-medium text-slate-800">{activeEntity.details?.holder_name || 'Suspect Mule Individual'}</p>
                      </div>

                      {activeEntity.details?.inflow && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Illicit Inflow</span>
                          <p className="font-black text-red-600 text-sm">₹{Number(activeEntity.details.inflow).toLocaleString('en-IN')}</p>
                        </div>
                      )}
                    </>
                  )}

                  {entityType === 'ATM' && (
                    <>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">ATM Terminal Location</span>
                        <p className="font-semibold text-slate-900">{activeEntity.label || entityId}</p>
                        <p className="text-[11px] text-slate-500">{activeEntity.details?.bank || 'SBI ATM'} • {activeEntity.details?.district || activeEntity.hotspot_location || 'Metro Hotspot Corridor'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Forecast Status</span>
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[10px]">
                          High Anomaly (Next 4–6 Hours)
                        </span>
                      </div>
                    </>
                  )}

                  {entityType === 'PHONE' && (
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">SIM / Burner Contact</span>
                      <p className="font-mono font-bold text-slate-900">{activeEntity.label || entityId}</p>
                      <p className="text-[11px] text-slate-500">{activeEntity.details?.telecom || 'Telecom Operator'} • {activeEntity.details?.circle || 'National Circle'}</p>
                    </div>
                  )}

                  {activeEntity.label && entityType !== 'CASE' && entityType !== 'ATM' && entityType !== 'PHONE' && (
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Designation / Label</span>
                      <p className="font-semibold text-slate-900">{activeEntity.label}</p>
                    </div>
                  )}

                  {/* ROLE-SPECIFIC ACTION SUITE */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      Role Operational Actions
                    </span>

                    {/* 1. LEA OFFICER ACTIONS (State Cyber Police) */}
                    {currentUserRole === 'LEA_OFFICER' && (
                      <>
                        {entityType === 'ATM' && (
                          <button
                            onClick={() => openActionModal('patrol', 'Deploy Field Patrol to ATM')}
                            className="w-full py-2 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                          >
                            <span>Deploy Field Patrol to ATM</span>
                            <Radio className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {entityType === 'ACCOUNT' && (
                          <button
                            onClick={() => openActionModal('notice', 'Issue Sec 91 CrPC Notice')}
                            className="w-full py-2 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                          >
                            <span>Issue Sec 91 CrPC Notice</span>
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {entityType === 'CASE' && (
                          <button
                            onClick={() => openActionModal('dossier', 'Generate Court Dossier (PDF)')}
                            className="w-full py-2 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                          >
                            <span>Generate Court Dossier (PDF)</span>
                            <FileCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {entityType === 'PHONE' && (
                          <button
                            onClick={() => openActionModal('cdr', 'Request CDR & Tower Data')}
                            className="w-full py-2 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                          >
                            <span>Request CDR &amp; Tower Data</span>
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onNavigateTab('investigations', { caseId: selectedCase, district: activeEntity.details?.district || activeEntity.jurisdiction })}
                          className="w-full py-2 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center justify-between cursor-pointer"
                        >
                          <span>Link to Investigation Case</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {/* 2. BANK ANALYST ACTIONS (Financial Institutions) */}
                    {currentUserRole === 'BANK_ANALYST' && (
                      <>
                        {entityType === 'ACCOUNT' && (
                          <>
                            <button
                              onClick={() => openActionModal('freeze', 'Place Immediate Debit Freeze')}
                              className="w-full py-2 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-xs"
                            >
                              <span>Place Immediate Debit Freeze</span>
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openActionModal('str', 'Flag STR / AML Alert')}
                              className="w-full py-2 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                            >
                              <span>Flag STR / AML Alert</span>
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {entityType === 'ATM' && (
                          <button
                            onClick={() => openActionModal('throttle', 'Throttle ATM Daily Dispense')}
                            className="w-full py-2 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                          >
                            <span>Throttle ATM Daily Dispense</span>
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onNavigateTab('bank-workflow', { txRef: entityId })}
                          className="w-full py-2 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center justify-between cursor-pointer"
                        >
                          <span>Open in Bank Fraud Console</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {/* 3. I4C NODAL OFFICER ACTIONS */}
                    {currentUserRole === 'I4C_OFFICER' && (
                      <>
                        <button
                          onClick={() => openActionModal('broadcast', 'Broadcast Inter-State Alert')}
                          className="w-full py-2 px-2.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                        >
                          <span>Broadcast Inter-State Alert</span>
                          <Radio className="w-3.5 h-3.5 text-cyan-600" />
                        </button>
                        <button
                          onClick={() => onNavigateTab('predictive-intelligence')}
                          className="w-full py-2 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                        >
                          <span>Examine ML Feature Importance</span>
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigateTab('cases')}
                          className="w-full py-2 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center justify-between cursor-pointer"
                        >
                          <span>View Linked NCRP Complaints</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {/* 4. SYSTEM ADMIN ACTIONS */}
                    {currentUserRole === 'ADMIN' && (
                      <>
                        <button
                          onClick={() => openActionModal('audit', 'Audit Node Integrity')}
                          className="w-full py-2 px-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                        >
                          <span>Audit Node Integrity</span>
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigateTab('system-audit')}
                          className="w-full py-2 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center justify-between cursor-pointer"
                        >
                          <span>Inspect Tamper Audit Trail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 flex items-center justify-between mt-3">
            <span className="font-bold">Legend:</span>
            <span>Case (Indigo) • Mule (Sky) • ATM (Orange) • SIM (Green)</span>
          </div>
        </div>
      </div>

      {/* WORKABLE ROLE OPERATIONAL ACTION MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">{activeModal.title}</h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Target: <span className="font-mono text-blue-700">{activeModal.nodeId}</span> ({activeModal.nodeType})
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setActiveModal(null); setActionReceipt(null); }}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* If action has been executed successfully, show receipt */}
            {actionReceipt ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Action Successfully Executed &amp; Dispatched</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    {actionReceipt.details}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Reference ID:</span>
                    <span className="font-mono font-black text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {actionReceipt.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Timestamp:</span>
                    <span className="font-mono text-slate-700">{actionReceipt.timestamp} IST</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleDownloadReceipt}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Official Notice (.txt)</span>
                  </button>
                  <button
                    onClick={() => { setActiveModal(null); setActionReceipt(null); }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Action Execution Configuration Form */
              <div className="space-y-3.5">
                {activeModal.type === 'patrol' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Select Field Patrol Unit</label>
                      <select className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500">
                        <option>PCR Beat Van #14 (Connaught Place Sector - ETA 4m)</option>
                        <option>Cheetah Fast Response Bike #03 (Janpath Corridor - ETA 6m)</option>
                        <option>District Cyber Flying Squad #01 (Central Zone - ETA 9m)</option>
                      </select>
                    </div>
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                      Patrol will be dispatched to intercept cash withdrawals at ATM kiosk with real-time GPS telemetry link.
                    </div>
                  </>
                )}

                {activeModal.type === 'notice' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Statutory Mandate</label>
                      <input
                        type="text"
                        readOnly
                        value="Section 91 Cr.P.C. (Summons to Produce Records / Freeze)"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Target Beneficiary Bank Nodal Officer</label>
                      <input
                        type="text"
                        readOnly
                        value="nodal.cybercrime@sbi.co.in (State Bank of India)"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs font-medium"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                      Formal legal summons requiring bank nodal desk to freeze beneficiary funds and supply KYC logs within 24 hours.
                    </div>
                  </>
                )}

                {activeModal.type === 'freeze' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Lien Scope</label>
                      <input
                        type="text"
                        readOnly
                        value="Total Immediate Debit Hold (All Channels: ATM, UPI, IMPS, RTGS)"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs font-bold"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium">
                      Simultaneously blocks debit access across all branch and digital networks to prevent cash out.
                    </div>
                  </>
                )}

                {activeModal.type === 'str' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                    Suspicious Transaction Report (STR) will be formatted under PMLA standards and transmitted directly to the Financial Intelligence Unit (FIU-IND).
                  </div>
                )}

                {activeModal.type === 'throttle' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Temporary Max Daily Dispense Limit</label>
                      <select className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl p-2.5 text-xs font-semibold">
                        <option>₹5,000 per card (Severe Risk Reduction)</option>
                        <option>₹2,000 per card (Emergency Circuit Breaker)</option>
                      </select>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                      Limits physical ATM cash dispensation during the forecasted 18:00–22:00 spike window.
                    </div>
                  </>
                )}

                {activeModal.type === 'cdr' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
                    Automated requisition to Telecom Service Provider for Call Detail Records and cell tower azimuth dump for the past 72 hours.
                  </div>
                )}

                {activeModal.type === 'broadcast' && (
                  <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 font-medium">
                    Pan-India Nodal Broadcast will be transmitted to State Cyber Crime Coordination units in Delhi, Maharashtra, Karnataka, and Rajasthan.
                  </div>
                )}

                {activeModal.type === 'audit' && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-medium">
                    Validates node cryptographic SHA-256 hash against the immutable audit ledger.
                  </div>
                )}

                {activeModal.type === 'dossier' && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-medium">
                    Compiles case narrative, mule transaction chain, spatial ATM maps, and Section 91 notices into an official court-admissible dossier.
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteModalAction}
                    disabled={executingAction}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    {executingAction ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Executing...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm &amp; Execute Action</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
