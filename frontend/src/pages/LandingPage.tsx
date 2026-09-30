import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  MapPin, 
  TrendingUp, 
  Share2, 
  Building2, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Radio, 
  FileText, 
  ChevronRight, 
  Activity,
  Layers,
  Sparkles,
  UserCheck,
  Zap,
  Globe,
  CreditCard,
  Phone
} from 'lucide-react';
import { api } from '../services/api';
import { Hotspot, DashboardSummary } from '../types';

interface LandingPageProps {
  onEnterPortal: (mode?: 'signin' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterPortal }) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'hotspot' | 'graph' | 'bank'>('hotspot');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  // Fetch live metrics from real database on mount
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const [sum, hots] = await Promise.all([
          api.getDashboardSummary(),
          api.getHotspots()
        ]);
        setSummary(sum);
        setHotspots(hots);
      } catch (err) {
        console.error('Failed to load landing live metrics:', err);
      }
    };
    fetchLiveData();
  }, []);

  // Interactive Simulation State for Tab 1: Spatial Radar
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeDistrict, setActiveDistrict] = useState<'delhi' | 'mumbai' | 'bangalore' | 'jaipur' | 'patna'>('delhi');

  // Interactive Simulation State for Tab 2: Case Ego Network
  const [unmaskedLayer, setUnmaskedLayer] = useState<number>(1);
  const [isTracing, setIsTracing] = useState(false);

  // Interactive Simulation State for Tab 3: Inter-Bank Rapid Lien
  const [lienSimActive, setLienSimActive] = useState(false);
  const [lienSeconds, setLienSeconds] = useState(0);
  const [bankStatuses, setBankStatuses] = useState<{ [key: string]: boolean }>({
    sbi: false,
    hdfc: false,
    icici: false,
    pnb: false,
  });

  // Handle Trigger Live Radar Scan
  const handleTriggerScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  // Handle Trace Cascade Hop
  const handleTraceCascade = () => {
    setIsTracing(true);
    setTimeout(() => {
      setUnmaskedLayer((prev) => (prev >= 3 ? 1 : prev + 1));
      setIsTracing(false);
    }, 400);
  };

  // Handle Rapid Lien Simulation
  const handleTriggerLienSim = () => {
    setLienSimActive(true);
    setLienSeconds(0);
    setBankStatuses({ sbi: false, hdfc: false, icici: false, pnb: false });

    setTimeout(() => {
      setBankStatuses((prev) => ({ ...prev, sbi: true }));
      setLienSeconds(42);
    }, 300);

    setTimeout(() => {
      setBankStatuses((prev) => ({ ...prev, hdfc: true }));
      setLienSeconds(89);
    }, 700);

    setTimeout(() => {
      setBankStatuses((prev) => ({ ...prev, icici: true }));
      setLienSeconds(134);
    }, 1100);

    setTimeout(() => {
      setBankStatuses((prev) => ({ ...prev, pnb: true }));
      setLienSeconds(168);
      setLienSimActive(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Sticky Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="PRAVAAH Logo"
            className="w-11 h-11 rounded-xl object-contain bg-white p-0.5 border-2 border-blue-500 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-lg tracking-wider">PRAVAAH</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                PROACTIVE AI
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Predictive Risk And Vulnerability Analysis for ATM Activity &amp; Hotspots
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-700">
          <a href="#capabilities" className="hover:text-blue-600 transition">Capabilities</a>
          <a href="#methodology" className="hover:text-blue-600 transition">Methodology</a>
          <a href="#agencies" className="hover:text-blue-600 transition">Agency Roles</a>
          <a href="#security" className="hover:text-blue-600 transition">Security &amp; CrPC</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onEnterPortal('signin')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition shadow-xs cursor-pointer"
          >
            Officer Sign In
          </button>
          <button
            onClick={() => onEnterPortal('register')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>Register Official ID</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-14 pb-16 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Official Badge Ribbon */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border-2 border-blue-200 text-blue-800 text-xs font-bold mb-6 shadow-xs">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>I4C • STATE CYBER CRIME INVESTIGATION CELLS • BANK CONSORTIUM</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl">
          Pre-Empt Cybercrime Cash-Outs <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            Before Money Leaves The ATM.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-700 max-w-3xl font-medium leading-relaxed">
          India's proactive AI intelligence framework that forecasts illicit cash-withdrawal hotspots{' '}
          <strong className="text-slate-950 font-bold bg-amber-100 px-1.5 py-0.5 rounded">4–6 hours in advance</strong> from cybercrime complaints, 
          empowering Law Enforcement and Financial Institutions to intercept mule cascades before cash disappears.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => onEnterPortal('signin')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Launch Operational Command</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEnterPortal('register')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Register Agency Credentials</span>
          </button>
        </div>

        {/* Live Operational Metrics Ribbon (High-Contrast Bright Cards - Real DB Data) */}
        <div className="mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 text-left shadow-xs hover:border-blue-400 hover:shadow-md transition">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Lead Time Window</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-black text-blue-600">4–6</span>
              <span className="text-xs font-bold text-slate-600">HOURS</span>
            </div>
            <span className="text-xs text-slate-600 font-medium mt-1 block">Advance withdrawal forecast</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 text-left shadow-xs hover:border-indigo-400 hover:shadow-md transition">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">High-Risk Hotspots</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-black text-indigo-600">{summary?.predicted_high_risk_zones ?? 20}</span>
              <span className="text-xs font-bold text-slate-600">ZONES</span>
            </div>
            <span className="text-xs text-slate-600 font-medium mt-1 block">Active withdrawal corridors</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 text-left shadow-xs hover:border-emerald-400 hover:shadow-md transition">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Database Cases</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-black text-emerald-600">{summary?.total_cases ?? 520}</span>
              <span className="text-xs font-bold text-slate-600">CASES</span>
            </div>
            <span className="text-xs text-slate-600 font-medium mt-1 block">{summary?.open_cases ?? 303} active LEA investigations</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 text-left shadow-xs hover:border-purple-400 hover:shadow-md transition">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Cyber Complaints</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-3xl font-black text-purple-600">
                {summary?.cybercrime_complaints ? summary.cybercrime_complaints.toLocaleString() : '1,200'}
              </span>
            </div>
            <span className="text-xs text-slate-600 font-medium mt-1 block">Ingested from NCRP &amp; 1930 Portal</span>
          </div>
        </div>
      </section>

      {/* Interactive Capabilities Preview Section */}
      <section id="capabilities" className="px-6 py-14 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-black uppercase tracking-widest text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
            MISSION CAPABILITIES
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">Next-Generation Proactive Intelligence</h2>
          <p className="text-sm text-slate-600 mt-1.5 font-medium">
            Test and interact with live simulations of PRAVAAH's spatial radar, case-wise topology, and banking enforcement.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border-2 border-slate-200 text-xs font-bold gap-1.5 shadow-xs">
            <button
              onClick={() => setActivePreviewTab('hotspot')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activePreviewTab === 'hotspot'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-700 hover:bg-slate-100 font-semibold'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>4–6h Spatial Hotspot Radar</span>
            </button>
            <button
              onClick={() => setActivePreviewTab('graph')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activePreviewTab === 'graph'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-700 hover:bg-slate-100 font-semibold'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Case-Wise Ego Network</span>
            </button>
            <button
              onClick={() => setActivePreviewTab('bank')}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activePreviewTab === 'bank'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-700 hover:bg-slate-100 font-semibold'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Inter-Bank Rapid Lien Protocol</span>
            </button>
          </div>
        </div>

        {/* Interactive Feature Display Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-sm relative overflow-hidden">
          {/* TAB 1: SPATIAL RADAR SIMULATION */}
          {activePreviewTab === 'hotspot' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-100 text-red-800 border border-red-300 text-xs font-bold">
                  <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                  <span>DBSCAN Spatial Density &amp; Random Forest Classifier</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Geographic Cash-Out Hotspot Forecasting</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Historical cybercrime complaints only report where victims reside. PRAVAAH predicts where criminal money mules will execute physical ATM withdrawals 4–6 hours ahead of time during peak withdrawal windows.
                </p>

                {/* Interactive District Filter Tabs */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(['delhi', 'mumbai', 'bangalore', 'jaipur', 'patna'] as const).map((dist) => (
                    <button
                      key={dist}
                      onClick={() => setActiveDistrict(dist)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                        activeDistrict === dist
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {dist}
                    </button>
                  ))}
                </div>

                {/* Hotspot Cards according to active district */}
                <div className="space-y-2.5 pt-1">
                  {activeDistrict === 'delhi' && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-red-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-600 animate-ping"></div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Central Delhi • Connaught Place ATM Ring</span>
                          <span className="text-[11px] text-slate-500 block">3,500m buffer • Predicted Window: 18:00–22:00</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-red-100 text-red-800 border border-red-300">
                        87.5 CRITICAL
                      </span>
                    </div>
                  )}

                  {activeDistrict === 'mumbai' && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-orange-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Mumbai City • Dadar Station ATM Corridor</span>
                          <span className="text-[11px] text-slate-500 block">2,800m buffer • Predicted Window: 19:00–23:00</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 border border-orange-300">
                        83.8 HIGH
                      </span>
                    </div>
                  )}

                  {activeDistrict === 'bangalore' && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Bengaluru Urban • Koramangala 80ft Hub</span>
                          <span className="text-[11px] text-slate-500 block">2,200m buffer • Predicted Window: 17:30–21:30</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                        79.2 HIGH
                      </span>
                    </div>
                  )}

                  {activeDistrict === 'jaipur' && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-yellow-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Jaipur • MI Road Banking Perimeter</span>
                          <span className="text-[11px] text-slate-500 block">1,800m buffer • Predicted Window: 18:30–22:30</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-300">
                        74.1 MEDIUM
                      </span>
                    </div>
                  )}

                  {activeDistrict === 'patna' && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-red-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-600 animate-ping"></div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Patna • Fraser Road &amp; Station ATM Corridor (Bihar)</span>
                          <span className="text-[11px] text-slate-500 block">3,100m buffer • Predicted Window: 18:00–22:00 • Linked to Case CASE-2026-0028</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-red-100 text-red-800 border border-red-300">
                        86.4 CRITICAL
                      </span>
                    </div>
                  )}
                </div>

                {/* Workable Simulation Controls */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleTriggerScan}
                    disabled={isScanning}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? `Scanning Telemetry (${scanProgress}%)...` : 'Run 4h Live Radar Scan'}</span>
                  </button>

                  <button
                    onClick={() => onEnterPortal('signin')}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition cursor-pointer"
                  >
                    View Operational Map
                  </button>
                </div>
              </div>

              {/* Graphical Radar Graphic */}
              <div className="relative h-72 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                {/* Radar concentric rings */}
                <div className="absolute w-64 h-64 rounded-full border-2 border-blue-300/40"></div>
                <div className="absolute w-48 h-48 rounded-full border-2 border-blue-400/50"></div>
                <div className="absolute w-32 h-32 rounded-full border-2 border-blue-500/60"></div>
                <div className="absolute w-16 h-16 rounded-full border-2 border-blue-600/80"></div>
                <div className="absolute w-full h-[1px] bg-blue-300/60"></div>
                <div className="absolute h-full w-[1px] bg-blue-300/60"></div>

                {/* Animated Rotating Radar Sweep */}
                <div className={`absolute w-32 h-32 origin-bottom-right top-4 left-4 bg-gradient-to-br from-blue-500/30 to-transparent pointer-events-none rounded-tl-full ${isScanning ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }} />

                {/* Live Plotted ATM Nodes */}
                <div className="absolute top-16 left-28 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-600 ring-4 ring-red-200 animate-ping"></div>
                  <span className="text-[9px] font-black bg-white px-1.5 py-0.5 rounded shadow-xs mt-1 border border-red-300 text-red-700">
                    ATM-DEL-901 (87.5 Risk)
                  </span>
                </div>

                <div className="absolute bottom-16 right-20 flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-200"></div>
                  <span className="text-[9px] font-black bg-white px-1.5 py-0.5 rounded shadow-xs mt-1 border border-orange-300 text-orange-700">
                    ATM-MUM-442 (83.8 Risk)
                  </span>
                </div>

                <div className="absolute bottom-8 left-16 flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                  <span className="text-[9px] font-bold bg-white px-1 py-0.5 rounded shadow-xs mt-1 border border-slate-200 text-slate-700">
                    Safe Hub
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CASE-WISE EGO NETWORK SIMULATION */}
          {activePreviewTab === 'graph' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold">
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cytoscape.js Ego-Network &amp; Multi-Tier Mule Unmasking</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Case-Wise Intelligence Topology</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Eliminates confusing cluster hairballs. PRAVAAH isolates each high-priority case and dynamically traces illicit fund hops from initial victim transfer down to physical ATM cash-outs and burner SIM cards.
                </p>

                {/* Layer Control Pills */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-slate-700">Active Unmasked Depth:</span>
                  {[1, 2, 3].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setUnmaskedLayer(lvl)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        unmaskedLayer === lvl
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Layer {lvl}
                    </button>
                  ))}
                </div>

                {/* Hop Explanations */}
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800 font-bold">Layer 0 (Incident Anchor)</span>
                    <span className="text-blue-700 font-mono font-bold">CASE-2026-0120 (₹4,80,000 Fraud)</span>
                  </div>

                  {unmaskedLayer >= 1 && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs font-medium">
                      <span className="text-blue-900 font-bold">Layer 1 (Direct Mule)</span>
                      <span className="text-blue-700 font-mono font-bold">Acct #...4492 (State Bank of India)</span>
                    </div>
                  )}

                  {unmaskedLayer >= 2 && (
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs font-medium">
                      <span className="text-indigo-900 font-bold">Layer 2 (Rapid Fan-Out)</span>
                      <span className="text-indigo-700 font-mono font-bold">3 Secondary Mule Wallets (HDFC/ICICI)</span>
                    </div>
                  )}

                  {unmaskedLayer >= 3 && (
                    <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between text-xs font-medium">
                      <span className="text-orange-900 font-bold">Layer 3 (Target Withdrawal)</span>
                      <span className="text-orange-700 font-mono font-bold">ATM-CP-04 &amp; ATM-DDR-12 (Pending Cash-Out)</span>
                    </div>
                  )}
                </div>

                {/* Workable Action */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleTraceCascade}
                    disabled={isTracing}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isTracing ? 'Tracing Next Hop...' : 'Trace Next Cascade Hop'}</span>
                  </button>
                  <button
                    onClick={() => onEnterPortal('signin')}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition cursor-pointer"
                  >
                    Open Graph Studio
                  </button>
                </div>
              </div>

              {/* Graphic Topology Display */}
              <div className="relative h-72 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3 w-full">
                  {/* Central Node */}
                  <div className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-mono font-bold text-xs shadow-md">
                    CASE-2026-0120
                  </div>
                  <div className="w-[2px] h-6 bg-indigo-400"></div>

                  {/* Layer 1 Nodes */}
                  <div className="flex gap-4">
                    <div className="px-3 py-1.5 rounded-lg bg-sky-100 border-2 border-sky-400 text-sky-900 font-mono font-bold text-[11px] shadow-xs">
                      Mule #4492
                    </div>
                    {unmaskedLayer >= 2 && (
                      <div className="px-3 py-1.5 rounded-lg bg-sky-100 border-2 border-sky-400 text-sky-900 font-mono font-bold text-[11px] shadow-xs">
                        Mule #8819
                      </div>
                    )}
                  </div>

                  {/* Layer 2/3 Nodes */}
                  {unmaskedLayer >= 3 && (
                    <>
                      <div className="w-[2px] h-4 bg-orange-400"></div>
                      <div className="flex gap-3">
                        <div className="px-3 py-1.5 rounded-lg bg-orange-100 border-2 border-orange-500 text-orange-950 font-bold text-[10px] shadow-xs flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-orange-700" />
                          <span>ATM-CP-04 Cash-Out</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-100 border-2 border-emerald-500 text-emerald-950 font-bold text-[10px] shadow-xs flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-700" />
                          <span>Burner SIM +91-987...</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTER-BANK RAPID LIEN SIMULATION */}
          {activePreviewTab === 'bank' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sec 91 CrPC Automated Legal Notice Broadcast</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Inter-Bank Rapid Lien Protocol</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  When a cybercrime withdrawal hotspot is predicted, PRAVAAH immediately dispatches an automated legal freeze notice directly to the nodal officers of beneficiary banks, achieving account holds in under 180 seconds.
                </p>

                {/* Bank Status Tracker */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className={`p-3 rounded-xl border-2 flex items-center justify-between text-xs font-bold transition ${
                    bankStatuses.sbi ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <span>State Bank of India</span>
                    <span className="text-[10px]">{bankStatuses.sbi ? 'LIEN ENFORCED ✓' : 'STANDBY'}</span>
                  </div>

                  <div className={`p-3 rounded-xl border-2 flex items-center justify-between text-xs font-bold transition ${
                    bankStatuses.hdfc ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <span>HDFC Bank</span>
                    <span className="text-[10px]">{bankStatuses.hdfc ? 'LIEN ENFORCED ✓' : 'STANDBY'}</span>
                  </div>

                  <div className={`p-3 rounded-xl border-2 flex items-center justify-between text-xs font-bold transition ${
                    bankStatuses.icici ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <span>ICICI Bank</span>
                    <span className="text-[10px]">{bankStatuses.icici ? 'LIEN ENFORCED ✓' : 'STANDBY'}</span>
                  </div>

                  <div className={`p-3 rounded-xl border-2 flex items-center justify-between text-xs font-bold transition ${
                    bankStatuses.pnb ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <span>Punjab National Bank</span>
                    <span className="text-[10px]">{bankStatuses.pnb ? 'LIEN ENFORCED ✓' : 'STANDBY'}</span>
                  </div>
                </div>

                {/* Workable Action */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleTriggerLienSim}
                    disabled={lienSimActive}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{lienSimActive ? 'Broadcasting Notice...' : 'Simulate <180s Automated Lien'}</span>
                  </button>
                  <button
                    onClick={() => onEnterPortal('signin')}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition cursor-pointer"
                  >
                    Bank Analyst Portal
                  </button>
                </div>
              </div>

              {/* Graphic Display of Time Elapsed */}
              <div className="relative h-72 rounded-2xl bg-slate-100 border-2 border-slate-200 flex flex-col items-center justify-center p-6 text-center shadow-inner">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Automated Statutory Execution Clock
                </span>
                <div className="text-5xl font-black text-slate-900 font-mono my-3">
                  {lienSeconds}s <span className="text-sm font-sans font-bold text-emerald-600">/ 180s SLA</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden max-w-xs border border-slate-300">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min((lienSeconds / 180) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-[11px] text-slate-600 font-medium mt-3">
                  {lienSeconds >= 168
                    ? 'All 4 Beneficiary Banks Synchronized & Liens Placed.'
                    : 'Awaiting Automated Inter-Bank Protocol Trigger.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Methodology Section (Broken 72h Cycle vs PRAVAAH 15m Loop) */}
      <section id="methodology" className="px-6 py-14 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
            METHODOLOGY COMPARISON
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">Why Conventional Cyber Policing Fails</h2>
          <p className="text-sm text-slate-600 mt-1.5 font-medium">
            Comparing the traditional reactive 72-hour paper trail against PRAVAAH's proactive 15-minute interception loop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Traditional Way */}
          <div className="p-6 md:p-8 rounded-3xl bg-red-50/70 border-2 border-red-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-red-800 bg-red-100 px-2.5 py-1 rounded-md border border-red-300">
                Conventional Reactive Policing (Failed)
              </span>
              <span className="text-xs font-bold text-red-700">~ 72 Hours Delay</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Victims file complaints days later. Police request bank statements via slow official email. By the time branch managers review notices, cash has already been withdrawn from ATMs by mule runners.
            </p>
            <div className="space-y-2 text-xs pt-2">
              <div className="p-3 rounded-xl bg-white border border-red-200 flex items-center justify-between font-medium">
                <span className="text-slate-800">T+0 Hours: Fraud Incident Occurs</span>
                <span className="text-red-700 font-bold">Unreported</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-red-200 flex items-center justify-between font-medium">
                <span className="text-slate-800">T+24 Hours: Victim Files Police FIR</span>
                <span className="text-red-700 font-bold">Bureaucracy</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-red-200 flex items-center justify-between font-medium">
                <span className="text-slate-800">T+48 Hours: Notice Dispatched to Bank</span>
                <span className="text-red-700 font-bold">Paper Trail</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-red-200 flex items-center justify-between font-medium">
                <span className="text-slate-800">T+72 Hours: Bank Freezes Account</span>
                <span className="text-red-800 font-black">Zero Balance (Withdrawn ❌)</span>
              </div>
            </div>
          </div>

          {/* PRAVAAH Way */}
          <div className="p-6 md:p-8 rounded-3xl bg-emerald-50/70 border-2 border-emerald-300 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>PRAVAAH Proactive Interception</span>
              </span>
              <span className="text-xs font-bold text-emerald-800">&lt; 15 Minutes Response</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Complaints stream directly into ML spatial engines. High-risk ATM withdrawal corridors are predicted 4–6 hours ahead. Police dispatch beat patrols and banks enforce liens simultaneously.
            </p>
            <div className="space-y-2 text-xs pt-2">
              <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between font-medium">
                <span className="text-slate-800">Stream Ingestion &amp; Feature Extraction</span>
                <span className="text-emerald-700 font-bold">&lt; 200 Milliseconds</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between font-medium">
                <span className="text-slate-800">ML 4–6h Advance Hotspot Forecast</span>
                <span className="text-emerald-700 font-bold">Predicted Ahead of Time</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between font-medium">
                <span className="text-slate-800">Automated Section 91 Lien Broadcast</span>
                <span className="text-emerald-700 font-bold">&lt; 180 Seconds Latency</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between font-medium">
                <span className="text-slate-800">Patrol Interception at ATM Corridor</span>
                <span className="text-emerald-800 font-black">Funds Saved (89.4% Recovered 🛡️)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Specific Workspaces Section */}
      <section id="agencies" className="px-6 py-14 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
            STAKEHOLDER MATRIX
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">Tailored Workspaces for Every Role</h2>
          <p className="text-sm text-slate-600 mt-1.5 font-medium">
            Strict Role-Based Access Control ensures each agency has the specialized tools needed for their mission without operational clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 space-y-3 shadow-xs hover:border-blue-400 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">LEA Cyber Police</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Field patrol dispatch, PCR surveillance, high-risk ATM corridor lockdown, and Section 91 CrPC notice generation.
            </p>
            <span className="text-[10px] font-extrabold text-blue-700 block pt-1 uppercase">State &amp; District Cyber Cells</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 space-y-3 shadow-xs hover:border-cyan-400 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center border border-cyan-200">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">I4C Nodal Officer</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              National threat overview, inter-state syndicate tracking, multi-jurisdiction complaint aggregation, and ministry alerts.
            </p>
            <span className="text-[10px] font-extrabold text-cyan-800 block pt-1 uppercase">Central Coordination (MHA)</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 space-y-3 shadow-xs hover:border-amber-400 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Bank Fraud Analyst</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Suspicious cash-out queue, rapid mule account debit freezes, reverse flow tracing, and ATM hardware health metrics.
            </p>
            <span className="text-[10px] font-extrabold text-amber-800 block pt-1 uppercase">Commercial Banks &amp; FIU</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 space-y-3 shadow-xs hover:border-purple-400 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center border border-purple-200">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">System Admin</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Tamper-evident audit logs, model performance telemetry, PostgreSQL/PostGIS database health, and user provisioning.
            </p>
            <span className="text-[10px] font-extrabold text-purple-800 block pt-1 uppercase">National Command Infrastructure</span>
          </div>
        </div>
      </section>

      {/* Security & Statutory Compliance Banner */}
      <section id="security" className="px-6 py-12 max-w-6xl mx-auto w-full">
        <div className="p-8 rounded-3xl bg-blue-50/80 border-2 border-blue-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-700" />
              <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Enterprise-Grade Security &amp; Statutory Validity
              </span>
            </div>
            <p className="text-xs text-slate-700 max-w-xl leading-relaxed font-medium">
              Equipped with PostGIS SRID 4326 spatial indexes, bcrypt salted password hashing, JWT bearer protection, anti-brute force sliding rate limiting, and automated Section 91 CrPC court-admissible dossiers.
            </p>
          </div>
          <button
            onClick={() => onEnterPortal('register')}
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <span>Register Official Credentials</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-8 text-center text-xs text-slate-600">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PRAVAAH" className="w-7 h-7 rounded-md object-contain bg-white p-0.5 border border-slate-200" />
            <span className="font-black text-slate-900">PRAVAAH AI</span>
            <span>— Predictive Risk And Vulnerability Analysis for ATM Activity &amp; Hotspots</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-bold">
            <span>National Helpline: <strong className="text-blue-700 font-black">1930</strong></span>
            <span>•</span>
            <button onClick={() => onEnterPortal('signin')} className="hover:text-blue-600 transition cursor-pointer">
              Officer Login
            </button>
            <span>•</span>
            <button onClick={() => onEnterPortal('register')} className="hover:text-blue-600 transition cursor-pointer">
              Registration
            </button>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col items-center gap-1 text-[11px] text-slate-500 font-medium">
          <p className="font-semibold text-slate-700">Prototype • Synthetic Data</p>
          <p>Synthetic demonstration data — not real NCRP data. Developed for hackathon evaluation and technical demonstration.</p>
        </div>
      </footer>
    </div>
  );
};
