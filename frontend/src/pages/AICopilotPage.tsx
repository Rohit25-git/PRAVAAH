import React, { useState } from 'react';
import { 
  Cpu, 
  Send, 
  Sparkles, 
  User, 
  Shield, 
  AlertTriangle, 
  Clock, 
  RotateCcw,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';

interface AICopilotPageProps {
  initialQuery?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  structured?: {
    what?: string;
    why?: string;
    where?: string;
    when?: string;
    confidence?: string;
    what_next?: string;
  };
}

export const AICopilotPage: React.FC<AICopilotPageProps> = ({ initialQuery }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Greetings Officer. I am PRAVAAH AI Copilot, your analytical intelligence assistant. I synthesize cybercrime complaints, transaction velocity anomalies, temporal windows, and mule graph centrality to provide actionable proactive intervention briefings. How may I assist your investigation today?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputVal, setInputVal] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const suggestedQueries = [
    'Explain case CASE-2026-0003 in Hyderabad Telangana',
    'Why is Hyderabad ATM corridor considered high risk for 18:00–22:00?',
    'How many cases are present in the system?',
    'Draft a Section 91 CrPC notice for ATM CCTV and IP log preservation',
    'How does PRAVAAH predict cash withdrawals 4 to 6 hours in advance?',
    'What actionable intervention steps should LEA take for high-risk ATMs?',
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputVal;
    if (!q.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const res = await api.queryCopilot(q.trim());
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.response || res.answer || res.text || 'Analysis completed.',
        timestamp: new Date().toLocaleTimeString(),
        structured: res.structured,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Error generating response: ${err.message || 'Model service temporarily unreachable'}.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (msg: Message) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-3 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>PRAVAAH AI COPILOT &amp; DECISION ASSISTANT</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              GROUNDED LLM INFERENCE
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analytical natural language synthesis powered by local LangChain decision-support pipelines
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Deterministic Fallback &amp; Fact-Verification Active</span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
          Suggested Intel Queries:
        </span>
        {suggestedQueries.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-xs text-xs text-slate-700 font-medium transition hover:border-blue-400"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs space-y-2 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-sm'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-200 pb-1 mb-1">
                <span className={`font-bold uppercase tracking-wider ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-600'}`}>
                  {msg.sender === 'user' ? 'Investigating Officer' : 'PRAVAAH AI Copilot'}
                </span>
                <span className={`font-mono ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>{msg.timestamp}</span>
              </div>

              <div className={`whitespace-pre-line leading-relaxed ${msg.sender === 'user' ? 'text-white' : 'text-slate-800'}`}>{msg.text}</div>

              {msg.structured && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                  {msg.structured.what && (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-blue-700 block uppercase">WHAT:</span>
                      <p className="text-slate-700 mt-0.5">{msg.structured.what}</p>
                    </div>
                  )}
                  {msg.structured.why && (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-amber-700 block uppercase">WHY:</span>
                      <p className="text-slate-700 mt-0.5">{msg.structured.why}</p>
                    </div>
                  )}
                  {msg.structured.where && (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-purple-700 block uppercase">WHERE &amp; WHEN:</span>
                      <p className="text-slate-700 mt-0.5">{msg.structured.where} • {msg.structured.when}</p>
                    </div>
                  )}
                  {msg.structured.what_next && (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-emerald-700 block uppercase">ACTION:</span>
                      <p className="text-slate-700 mt-0.5">{msg.structured.what_next}</p>
                    </div>
                  )}
                </div>
              )}

              {msg.sender === 'ai' && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
                    Decision Support Only • Verify via Legal Process
                  </span>
                  <button
                    onClick={() => handleCopyMessage(msg)}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[10px] font-semibold"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 animate-pulse">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Analyzing cross-sector complaints, anomaly embeddings, and cashout probabilities...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-300 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask PRAVAAH Copilot about hotspots, cases, mule networks, legal notices, or tactical next steps..."
          className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 px-3 py-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
