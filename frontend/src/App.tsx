import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NotificationDrawer } from './components/NotificationDrawer';
import { HotspotDetailDrawer } from './components/HotspotDetailDrawer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { RiskHeatmapPage } from './pages/RiskHeatmapPage';
import { PredictiveIntelligencePage } from './pages/PredictiveIntelligencePage';
import { AlertCenterPage } from './pages/AlertCenterPage';
import { InvestigationWorkspacePage } from './pages/InvestigationWorkspacePage';
import { GraphIntelligencePage } from './pages/GraphIntelligencePage';
import { TransactionsPage } from './pages/TransactionsPage';
import { CasesPage } from './pages/CasesPage';
import { ReportsPage } from './pages/ReportsPage';
import { AICopilotPage } from './pages/AICopilotPage';
import { BankWorkflowPage } from './pages/BankWorkflowPage';
import { SystemAuditPage } from './pages/SystemAuditPage';
import { ArrowLeft } from 'lucide-react';

import { User, UserRole, Hotspot, Alert } from './types';
import { api } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pravaah_user') || localStorage.getItem('sanketra_user') || localStorage.getItem('cybershield_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => api.getToken());

  // Routing State
  const [currentTab, setCurrentTab] = useState<string>('command-center');
  const [tabState, setTabState] = useState<any>({});

  // Hotspot Drawer State
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // Live Alerts & Notifications
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  // Landing & Portal View State
  const [unauthView, setUnauthView] = useState<'landing' | 'signin' | 'register'>('landing');
  const [isViewingLanding, setIsViewingLanding] = useState(false);

  // Check auth or load demo user if already logged in
  useEffect(() => {
    if (token && !currentUser) {
      api.getMe()
        .then((user) => {
          setCurrentUser(user);
          localStorage.setItem('pravaah_user', JSON.stringify(user));
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [token]);

  // Load initial alerts
  useEffect(() => {
    if (token) {
      api.getAlerts()
        .then((data) => setAlerts(data))
        .catch((err) => console.error('Failed to load initial alerts:', err));
    }
  }, [token]);

  // Establish WebSocket Connection for Real-Time Alert Broadcasts
  useEffect(() => {
    if (!token) return;

    const ws = api.createWebSocket((data) => {
      if (data && data.alert) {
        const newAlert: Alert = data.alert;
        setAlerts((prev) => [newAlert, ...prev]);
        setLiveAlerts((prev) => [newAlert, ...prev]);
        showToast(`CRITICAL ALERT: New Hotspot detected in ${newAlert.location}!`);
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, [token]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleLoginSuccess = (authToken: string, user: User) => {
    setToken(authToken);
    setCurrentUser(user);
    localStorage.setItem('pravaah_user', JSON.stringify(user));
    api.setToken(authToken);
    setIsViewingLanding(false);

    // Tailor default landing view based on user's role
    if (user.role === 'BANK_ANALYST') {
      setCurrentTab('bank-workflow');
    } else if (user.role === 'ADMIN') {
      setCurrentTab('system-audit');
    } else {
      setCurrentTab('command-center');
    }
  };

  const handleLogout = () => {
    api.logout();
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('pravaah_user');
    localStorage.removeItem('sanketra_user');
    localStorage.removeItem('cybershield_user');
    setUnauthView('landing');
    setIsViewingLanding(false);
  };

  const handleRoleSwitch = async (role: UserRole) => {
    // Quick role switch for prototype demo evaluation
    const emailMap: Record<UserRole, string> = {
      I4C_OFFICER: 'i4c.officer@pravaah.gov.in',
      LEA_OFFICER: 'lea.officer@delhi.police.gov.in',
      BANK_ANALYST: 'bank.analyst@nationalbank.in',
      ADMIN: 'admin@pravaah.gov.in',
    };
    const passMap: Record<UserRole, string> = {
      I4C_OFFICER: 'password123',
      LEA_OFFICER: 'password123',
      BANK_ANALYST: 'password123',
      ADMIN: 'admin123',
    };

    try {
      const data = await api.login(emailMap[role], passMap[role], role);
      handleLoginSuccess(data.access_token, data.user);

      // Auto-route tabs based on newly assigned role privileges
      if (role === 'BANK_ANALYST') {
        setCurrentTab('bank-workflow');
      } else if (role !== 'ADMIN' && (currentTab === 'system-audit' || currentTab === 'bank-workflow')) {
        setCurrentTab('command-center');
      }
      showToast(`Switched active profile to ${role.replace('_', ' ')}.`);
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    setSimulationStatus('Injecting high-velocity withdrawal burst into Central Delhi...');
    showToast('Simulation triggered: Generating synthetic ATM fraud spike...');
    try {
      const res = await api.triggerSimulation('Central Delhi');
      setSimulationStatus(`Spike complete: ${res.new_anomalous_transactions} anomalous cashouts injected.`);
      showToast(`Live simulation: ${res.new_alerts_triggered} new alerts broadcast.`);
      // Refresh alerts
      const updated = await api.getAlerts();
      setAlerts(updated);
    } catch (err: any) {
      setSimulationStatus('Simulation encountered an issue.');
      console.error('Simulation error:', err);
    } finally {
      setTimeout(() => {
        setIsSimulating(false);
        setSimulationStatus(null);
      }, 7000);
    }
  };

  const handleNavigateTab = (tab: string, state: any = {}) => {
    const role = currentUser?.role;

    // Strict RBAC Guard: System & Audit Logs strictly ADMIN only
    if (tab === 'system-audit' && role !== 'ADMIN') {
      showToast('ACCESS DENIED: System & Audit Logs are strictly restricted to the System Administrator.');
      return;
    }

    // Bank Analyst restricted from LEA investigations and cases
    if (role === 'BANK_ANALYST' && ['cases', 'investigations', 'graph-intelligence', 'predictive-intelligence', 'reports', 'system-audit'].includes(tab)) {
      showToast('ACCESS RESTRICTED: Feature reserved for Law Enforcement (LEA) and I4C Nodal Officers.');
      return;
    }

    setTabState(state);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearch = (query: string) => {
    handleNavigateTab('transactions', { search: query });
  };

  // If unauthenticated, render the Landing Page or Login/Register Page
  if (!token || !currentUser) {
    if (unauthView === 'landing') {
      return (
        <LandingPage
          onEnterPortal={(targetMode) => setUnauthView(targetMode === 'register' ? 'register' : 'signin')}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        initialMode={unauthView === 'register' ? 'register' : 'signin'}
        onBackToLanding={() => setUnauthView('landing')}
      />
    );
  }

  // If authenticated user chose to view the Public Portal
  if (isViewingLanding) {
    return (
      <div className="relative">
        <div className="fixed top-3.5 right-6 z-50">
          <button
            onClick={() => setIsViewingLanding(false)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to {currentUser.role?.replace('_', ' ')} Console</span>
          </button>
        </div>
        <LandingPage onEnterPortal={() => setIsViewingLanding(false)} />
      </div>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'NEW').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold text-xs shadow-2xl flex items-center gap-3 border border-red-400/50 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">✕</button>
        </div>
      )}

      {/* Persistent App Header */}
      <Header
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
        onTriggerSimulation={handleTriggerSimulation}
        isSimulating={isSimulating}
        simulationStatus={simulationStatus}
        unreadAlertCount={criticalCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onSearch={handleGlobalSearch}
        onOpenLanding={() => setIsViewingLanding(true)}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 pt-16">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={(tab) => handleNavigateTab(tab)}
          currentUser={currentUser}
          onLogout={handleLogout}
          criticalAlertCount={criticalCount}
        />

        {/* Content View Container */}
        <main className="flex-1 ml-64 p-6 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {currentTab === 'command-center' && (
            <CommandCenterPage
              onNavigateTab={handleNavigateTab}
              onOpenHotspotDrawer={(h) => setSelectedHotspot(h)}
              selectedHotspot={selectedHotspot}
              onSelectHotspot={setSelectedHotspot}
              isSimulating={isSimulating}
              simulationStatus={simulationStatus}
            />
          )}

          {currentTab === 'risk-heatmap' && (
            <RiskHeatmapPage
              onNavigateTab={handleNavigateTab}
              selectedHotspot={selectedHotspot}
              onSelectHotspot={setSelectedHotspot}
            />
          )}

          {currentTab === 'predictive-intelligence' && (
            <PredictiveIntelligencePage
              onNavigateTab={handleNavigateTab}
              onOpenCopilotWithQuery={(q) => handleNavigateTab('ai-copilot', { query: q })}
            />
          )}

          {currentTab === 'alerts' && (
            <AlertCenterPage
              onNavigateTab={handleNavigateTab}
              liveAlerts={liveAlerts}
            />
          )}

          {currentTab === 'investigations' && (
            <InvestigationWorkspacePage
              onNavigateTab={handleNavigateTab}
              initialDistrict={tabState.district}
              initialCaseId={tabState.caseId}
            />
          )}

          {currentTab === 'graph-intelligence' && (
            <GraphIntelligencePage
              onNavigateTab={handleNavigateTab}
              initialFocusId={tabState.focusId}
              tabState={tabState}
              currentUserRole={currentUser?.role}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              onNavigateTab={handleNavigateTab}
              initialSearch={tabState.search}
            />
          )}

          {currentTab === 'cases' && (
            <CasesPage onNavigateTab={handleNavigateTab} />
          )}

          {currentTab === 'reports' && (
            <ReportsPage
              onNavigateTab={handleNavigateTab}
              initialHotspot={tabState.hotspot}
              initialCaseId={tabState.caseId}
            />
          )}

          {currentTab === 'ai-copilot' && (
            <AICopilotPage initialQuery={tabState.query} />
          )}

          {currentTab === 'bank-workflow' && (
            <BankWorkflowPage
              onNavigateTab={handleNavigateTab}
              initialTxRef={tabState.txRef}
            />
          )}

          {currentTab === 'system-audit' && (
            currentUser.role === 'ADMIN' ? (
              <SystemAuditPage />
            ) : (
              <div className="p-8 bg-white border border-red-200 rounded-2xl shadow-xs text-center max-w-xl mx-auto mt-12">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 border border-red-200 text-lg">
                  🔒
                </div>
                <h3 className="text-lg font-black text-slate-900">403 — Unauthorized Access</h3>
                <p className="text-xs text-slate-600 mt-2">
                  System &amp; Audit Logs are strictly restricted to the System Administrator role in compliance with Section 43A of the IT Act and LEA RBAC protocol.
                </p>
                <button
                  onClick={() => handleNavigateTab('command-center')}
                  className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Return to Command Center
                </button>
              </div>
            )
          )}
        </main>
      </div>

      {/* Right Drawer: Live Alerts Feed */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        alerts={alerts}
        onSelectAlert={(a) => {
          setIsNotificationsOpen(false);
          handleNavigateTab('alerts');
        }}
        onAcknowledgeAlert={async (id) => {
          try {
            await api.acknowledgeAlert(id);
            setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)));
          } catch (err) {
            console.error(err);
          }
        }}
      />

      {/* Global Hotspot Detail Drawer */}
      <HotspotDetailDrawer
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
        onNavigateToTab={(tab: string, stateOrId?: any) => {
          setSelectedHotspot(null);
          const navState = typeof stateOrId === 'string'
            ? { focusId: stateOrId, hotspot: selectedHotspot }
            : { ...(stateOrId || {}), hotspot: selectedHotspot };
          handleNavigateTab(tab, navState);
        }}
      />
    </div>
  );
}

export default App;
