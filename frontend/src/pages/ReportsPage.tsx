import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  Download, 
  Shield, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Fingerprint, 
  Cpu,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { IntelligenceReport, Hotspot, Case } from '../types';
import { api } from '../services/api';

interface ReportsPageProps {
  onNavigateTab: (tab: string, state?: any) => void;
  initialHotspot?: Hotspot;
  initialCaseId?: number;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  onNavigateTab,
  initialHotspot,
  initialCaseId,
}) => {
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<number | undefined>(initialHotspot?.id);
  const [selectedCaseId, setSelectedCaseId] = useState<number | undefined>(initialCaseId);
  const [reportTitle, setReportTitle] = useState('Tactical Cyber-Fraud Intervention Bulletin');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSelections = async () => {
      try {
        const [hData, cData] = await Promise.all([
          api.getHotspots(),
          api.getCases(),
        ]);
        setHotspots(hData);
        setCases(cData);

        // Auto generate first report if not already generated
        const defaultH = initialHotspot?.id || (hData.length > 0 ? hData[0].id : undefined);
        const defaultC = initialCaseId || (cData.length > 0 ? cData[0].id : undefined);
        handleGenerate(defaultH, defaultC);
      } catch (err) {
        console.error('Failed to load report parameters:', err);
      }
    };
    loadSelections();
  }, [initialHotspot, initialCaseId]);

  const handleGenerate = async (hId?: number, cId?: number) => {
    setGenerating(true);
    try {
      const data = await api.generateReport(hId, cId, reportTitle);
      setReport(data);
    } catch (err) {
      console.error('Failed to generate intelligence report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!report) return;
    const text = `
CYBERSHIELD AI — OFFICIAL INTELLIGENCE BULLETIN
CLASSIFICATION: PROTOTYPE • SYNTHETIC DATA ONLY
REPORT ID: ${report.report_id}
GENERATED: ${new Date(report.generated_at).toLocaleString()}
TITLE: ${report.title}

OFFICIAL PROBLEM STATEMENT:
Development of a Predictive Analytics Framework for Cybercrime Complaints to Forecast Likely Cash Withdrawal Locations in Advance, Enabling Generation of Actionable Intelligence for Timely and Proactive Cybercrime Intervention.

EXECUTIVE SUMMARY:
${report.executive_summary}

RISK ASSESSMENT:
${report.risk_assessment}

TARGET HOTSPOT:
Location: ${report.predicted_hotspot?.district}, ${report.predicted_hotspot?.state}
Coordinates: ${report.predicted_hotspot?.latitude}, ${report.predicted_hotspot?.longitude}
Risk Score: ${report.predicted_hotspot?.risk_score} / 100 (${report.predicted_hotspot?.risk_level})
Forecast Time Window: ${report.predicted_time_window}
Confidence: ${(report.prediction_confidence * 100).toFixed(1)}%

ACTIONABLE INTERVENTION RECOMMENDATIONS:
${report.operational_recommendations?.map((r, i) => `${i + 1}. ${r}`).join('\n')}

DISCLAIMER:
${report.disclaimer}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 select-none print:m-0 print:p-0">
      {/* Top Generator Toolbar (Hidden when printing) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
              <span>INTELLIGENCE REPORT GENERATOR</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                FORMAL LEA DISPATCH
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate standardized National Cybercrime Intelligence Bulletins with verified SHA-256 evidence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bulletin / PDF</span>
            </button>
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[10px] text-slate-600 font-bold block mb-1">Target Hotspot Forecast</label>
            <select
              value={selectedHotspotId || ''}
              onChange={(e) => setSelectedHotspotId(Number(e.target.value))}
              className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {hotspots.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.location} ({h.risk_score} Score • {h.predicted_time_window})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-600 font-bold block mb-1">Associated Investigation Case</label>
            <select
              value={selectedCaseId || ''}
              onChange={(e) => setSelectedCaseId(Number(e.target.value))}
              className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_reference} ({c.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => handleGenerate(selectedHotspotId, selectedCaseId)}
              disabled={generating}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{generating ? 'Compiling Intel...' : 'Regenerate Bulletin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Intelligence Bulletin Document Canvas */}
      {report && (
        <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 shadow-md space-y-6 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
          {/* Official Document Header */}
          <div className="border-b-2 border-blue-600 pb-5 space-y-2 print:border-black">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 print:text-black">
                  <Shield className="w-6 h-6 text-blue-600 print:text-black" />
                </div>
                <div>
                  <h1 className="text-base font-black tracking-widest text-slate-900 print:text-black">
                    CYBERSHIELD AI • INTELLIGENCE BULLETIN
                  </h1>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider print:text-gray-600">
                    National Cybercrime Reporting Portal • Predictive Interception System
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-widest print:border-black print:text-black">
                  PROTOTYPE • SYNTHETIC DATA ONLY
                </span>
                <span className="text-[10px] text-slate-500 block mt-1 font-mono print:text-gray-600">
                  DOC-REF: {report.report_id}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-600 leading-tight italic print:text-gray-600">
              Official Reference: Development of a Predictive Analytics Framework for Cybercrime Complaints to Forecast Likely Cash Withdrawal Locations in Advance, Enabling Generation of Actionable Intelligence for Timely and Proactive Cybercrime Intervention.
            </div>
          </div>

          {/* Bulletin Metadata Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs print:bg-gray-100 print:border-black">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Generated Timestamp</span>
              <span className="font-mono text-slate-900 font-semibold print:text-black">
                {new Date(report.generated_at).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Forecast Window</span>
              <span className="font-mono text-blue-700 font-bold print:text-black">
                {report.predicted_time_window}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Risk Assessment</span>
              <span className="font-bold text-red-600 print:text-black">
                {report.predicted_hotspot?.risk_score} / 100 ({report.predicted_hotspot?.risk_level})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Model Confidence</span>
              <span className="font-mono text-emerald-700 font-bold print:text-black">
                {(report.prediction_confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* SECTION 1: Executive Summary */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
              <span>1.0 Executive Intelligence Summary</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed text-justify font-medium print:text-gray-900">
              {report.executive_summary}
            </p>
          </div>

          {/* SECTION 2: Geographic & Temporal Coordinates */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>2.0 Spatial Forecast & Anomaly Localization</span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs print:bg-gray-100 print:border-black">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium print:text-gray-700">Target Hotspot Zone:</span>
                <span className="font-bold text-slate-900 print:text-black">
                  {report.predicted_hotspot?.district}, {report.predicted_hotspot?.state}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium print:text-gray-700">Centroid Coordinates:</span>
                <span className="font-mono text-blue-700 font-bold print:text-black">
                  {report.predicted_hotspot?.latitude}, {report.predicted_hotspot?.longitude}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium print:text-gray-700">Temporal Lead Time:</span>
                <span className="font-semibold text-slate-900 print:text-black">
                  4 to 6 Hours in Advance of Expected Withdrawal Window
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: 5-Factor Risk Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider print:text-black">
              <span>3.0 Multi-Factor Predictive Signal Weights</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-gray-100">
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-800 print:text-black">Complaint Velocity & Loss Sum:</span>
                  <span className="text-blue-700 font-mono print:text-black">50% Weight</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed print:text-gray-700">
                  Multiple citizen complaints filed against linked beneficiary accounts within the historical observation window.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-gray-100">
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-800 print:text-black">Transaction Anomaly Score:</span>
                  <span className="text-blue-700 font-mono print:text-black">20% Weight</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed print:text-gray-700">
                  Isolation Forest flag triggered for rapid-fire IMPS deposits followed by high off-hours withdrawal velocity.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-gray-100">
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-800 print:text-black">Geographic Concentration:</span>
                  <span className="text-blue-700 font-mono print:text-black">15% Weight</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed print:text-gray-700">
                  Spatial DBSCAN density identified 14 nearby ATM terminals suitable for rapid physical mule cashout.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-gray-100">
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-800 print:text-black">Network Graph Centrality:</span>
                  <span className="text-blue-700 font-mono print:text-black">15% Weight</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed print:text-gray-700">
                  Beneficiary account has high PageRank centrality linking 6 distinct cybercrime syndicate cases.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4: Actionable Law Enforcement Recommendations */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider print:text-black">
              <span>4.0 Actionable Intervention Directives</span>
            </h3>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-xs print:bg-gray-100 print:border-black">
              {report.operational_recommendations?.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-800 print:text-black font-medium">
                  <span className="font-bold text-blue-700 print:text-black">{i + 1}.</span>
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 leading-relaxed text-justify print:border-black print:text-gray-600">
            <span className="font-bold uppercase block text-slate-700 print:text-black mb-0.5">
              Statutory Decision Support Disclaimer
            </span>
            {report.disclaimer ||
              'This bulletin represents automated machine-learning predictive intelligence based on synthetic evaluation records. Predicted hotspots and anomaly scores serve exclusively as operational decision support for law enforcement officers and financial institutions. All formal interventions, bank account freezes, and lawful detentions require adherence to applicable procedural law (CrPC / Bharatiya Nagarik Suraksha Sanhita).'}
          </div>
        </div>
      )}
    </div>
  );
};
