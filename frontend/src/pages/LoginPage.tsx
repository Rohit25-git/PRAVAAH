import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  UserCheck,
  Building2,
  Cpu,
  Fingerprint,
  ArrowLeft,
  Eye,
  EyeOff,
  UserPlus,
  BadgeCheck,
  Globe
} from 'lucide-react';
import { UserRole } from '../types';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void;
  initialMode?: 'signin' | 'register';
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess,
  initialMode = 'signin',
  onBackToLanding
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('LEA_OFFICER');
  const [regAgency, setRegAgency] = useState('Delhi Police Cyber Cell');
  const [regJurisdiction, setRegJurisdiction] = useState('Delhi NCR');
  const [regBadgeId, setRegBadgeId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'I4C_OFFICER' as UserRole,
      title: 'I4C Nodal Officer',
      org: 'Indian Cybercrime Coordination Centre (MHA)',
      email: 'i4c.officer@pravaah.gov.in',
      password: 'password123',
      icon: Shield,
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      iconColor: 'text-cyan-700',
    },
    {
      role: 'LEA_OFFICER' as UserRole,
      title: 'LEA Cyber Investigator',
      org: 'Delhi Police Cyber Cell',
      email: 'lea.officer@delhi.police.gov.in',
      password: 'password123',
      icon: UserCheck,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      iconColor: 'text-blue-700',
    },
    {
      role: 'BANK_ANALYST' as UserRole,
      title: 'Bank Fraud Analyst',
      org: 'National Commercial Bank Consortium',
      email: 'bank.analyst@nationalbank.in',
      password: 'password123',
      icon: Building2,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      iconColor: 'text-amber-700',
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'ML & System Administrator',
      org: 'PRAVAAH Intelligence Operations',
      email: 'admin@pravaah.gov.in',
      password: 'admin123',
      icon: Cpu,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      iconColor: 'text-purple-700',
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(email, password);
      onLoginSuccess(data.access_token, data);
    } catch (err: any) {
      setError(err.message || 'Invalid officer credentials or access token expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRegSuccessMessage(null);

    if (!regName || !regEmail || !regPassword) {
      setError('Please complete all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        agency: regAgency,
        jurisdiction: regJurisdiction,
      });

      setRegSuccessMessage(`Official ID successfully verified! Logged in as ${data.name} (${data.role}).`);
      
      // Auto-login with token returned directly from registration endpoint
      setTimeout(() => {
        onLoginSuccess(data.access_token, data);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Registration failed. The official email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(acc.email, acc.password, acc.role);
      onLoginSuccess(data.access_token, data);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between relative select-none font-sans antialiased">
      {/* Top Bar with Logo & Back Navigation */}
      <header className="px-6 py-4 flex items-center justify-between z-10 border-b border-slate-200 bg-white shadow-xs">
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
                OFFICIAL PORTAL
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Predictive Risk And Vulnerability Analysis for ATM Activity &amp; Hotspots
            </p>
          </div>
        </div>

        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Landing Page</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Mission & Demo Roles Quick Access */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border-2 border-blue-200 text-blue-800 text-xs font-bold shadow-xs">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Authorized Government &amp; Banking Access</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Secure Operational <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Intelligence Terminal
                </span>
              </h1>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Access real-time machine learning predictions, spatial DBSCAN clusters, and inter-bank automated debit holds across Indian jurisdictions.
              </p>
            </div>

            {/* Quick Demo Role Cards (Bright, Clear High-Contrast) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Quick Access Demo Profiles (1-Click Fill)
                </span>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Ready for Review
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {demoAccounts.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.role}
                      onClick={() => handleQuickLogin(acc)}
                      disabled={loading}
                      className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/40 border-2 border-slate-200 hover:border-blue-500 text-left transition flex flex-col justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-4 h-4 ${acc.iconColor}`} />
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${acc.badgeColor}`}>
                          {acc.role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <span className="text-xs font-black text-slate-900 group-hover:text-blue-700 block truncate">
                          {acc.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                          {acc.email}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Sign In & Registration Tabs Form Card */}
          <div className="lg:col-span-6 bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md relative">
            
            {/* Mode Switcher Tabs */}
            <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-blue-600 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900 font-bold'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Officer Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900 font-bold'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Official ID</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-800 text-xs flex items-start gap-2.5 mb-4 font-bold shadow-xs">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {regSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-xs flex items-start gap-2.5 mb-4 font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{regSuccessMessage}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'signin' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Official Email ID</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@pravaah.gov.in"
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 font-semibold placeholder-slate-400 px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-slate-50 text-xs text-slate-900 font-semibold placeholder-slate-400 pl-3.5 pr-10 py-2.5 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Authenticate &amp; Enter Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* REGISTRATION FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">Full Official Name</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Inspector R. Sharma"
                      required
                      className="w-full bg-slate-50 text-xs text-slate-900 font-semibold placeholder-slate-400 px-3 py-2 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">Official Email ID</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@agency.gov.in"
                      required
                      className="w-full bg-slate-50 text-xs text-slate-900 font-semibold placeholder-slate-400 px-3 py-2 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">Operational Role</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 text-xs text-slate-900 font-semibold px-3 py-2 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="LEA_OFFICER">LEA Officer (Police Cyber Cell)</option>
                      <option value="I4C_OFFICER">I4C Nodal Officer (Central)</option>
                      <option value="BANK_ANALYST">Bank Fraud Analyst (FIU)</option>
                      <option value="ADMIN">System Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">Agency / Department</label>
                    <input
                      type="text"
                      value={regAgency}
                      onChange={(e) => setRegAgency(e.target.value)}
                      placeholder="e.g. Delhi Police Cyber Cell"
                      required
                      className="w-full bg-slate-50 text-xs text-slate-900 font-semibold placeholder-slate-400 px-3 py-2 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">Jurisdiction / State</label>
                    <input
                      type="text"
                      value={regJurisdiction}
                      onChange={(e) => setRegJurisdiction(e.target.value)}
                      placeholder="e.g. Delhi NCR / Maharashtra"
                      className="w-full bg-slate-50 text-xs text-slate-900 font-semibold placeholder-slate-400 px-3 py-2 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">Officer Badge / ID</label>
                    <input
                      type="text"
                      value={regBadgeId}
                      onChange={(e) => setRegBadgeId(e.target.value)}
                      placeholder="e.g. DL-CYBER-892"
                      className="w-full bg-slate-50 text-xs text-slate-900 font-semibold placeholder-slate-400 px-3 py-2 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">Create Password</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      className="w-full bg-slate-50 text-xs text-slate-900 font-semibold placeholder-slate-400 px-3 py-2 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className="w-full bg-slate-50 text-xs text-slate-900 font-semibold placeholder-slate-400 px-3 py-2 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Registration &amp; Issue Token</span>
                        <BadgeCheck className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-5 pt-4 border-t border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-medium">
                Encrypted via SHA-256 with salted bcrypt hashing. Authorized government use only.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-200 bg-white text-center text-[10px] text-slate-600 font-bold">
        <span>PRAVAAH AI — Predictive Risk And Vulnerability Analysis for ATM Activity &amp; Hotspots • Helpline: 1930</span>
      </footer>
    </div>
  );
};
