const getBaseUrl = () => {
  // Support explicit Render production backend URL via VITE_API_URL
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }

  if (typeof window !== 'undefined') {
    if (window.location.port === '5173' || window.location.port === '3000') {
      const host = window.location.hostname || 'localhost';
      return `${window.location.protocol}//${host}:8000/api/v1`;
    }
    return '/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const getWsUrl = () => {
  // Support explicit Render production WebSocket URL via VITE_WS_URL
  const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
  if (envWsUrl && typeof envWsUrl === 'string' && envWsUrl.trim() !== '') {
    return envWsUrl.trim();
  }

  // Derive WebSocket URL from VITE_API_URL if provided
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const wsProto = envUrl.startsWith('https') ? 'wss:' : 'ws:';
    const cleanHost = envUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    return `${wsProto}//${cleanHost}/ws/alerts`;
  }

  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (window.location.port === '5173' || window.location.port === '3000') {
      const host = window.location.hostname || 'localhost';
      return `${proto}//${host}:8000/ws/alerts`;
    }
    return `${proto}//${window.location.host}/ws/alerts`;
  }
  return 'ws://localhost:8000/ws/alerts';
};

const API_BASE_URL = getBaseUrl();
const WS_BASE_URL = getWsUrl();

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('pravaah_token') || localStorage.getItem('sanketra_token') || localStorage.getItem('cybershield_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('pravaah_token', token);
      localStorage.setItem('sanketra_token', token);
    } else {
      localStorage.removeItem('pravaah_token');
      localStorage.removeItem('sanketra_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP Error ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.detail || `HTTP Error ${response.status}`);
      }

      return response.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error(`Cannot connect to PRAVAAH backend at ${API_BASE_URL}. Ensure the backend service is running on port 8000.`);
      }
      throw err;
    }
  }

  // --- Auth ---
  async login(email: string, password: string, role?: string) {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    agency?: string;
    jurisdiction?: string;
  }) {
    const data = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // --- Dashboard ---
  async getDashboardSummary() {
    return this.request<any>('/dashboard/summary');
  }

  async getDashboardActivity() {
    return this.request<any>('/dashboard/activity');
  }

  // --- Predictions & Hotspots ---
  async getPredictions() {
    return this.request<any[]>('/predictions');
  }

  async runPredictions() {
    return this.request<any>('/predictions/run', { method: 'POST' });
  }

  async getHotspots() {
    return this.request<any[]>('/hotspots');
  }

  async getHotspotById(id: number) {
    return this.request<any>(`/hotspots/${id}`);
  }

  async getHotspotFactors(id: number) {
    return this.request<any>(`/hotspots/${id}/factors`);
  }

  // --- Map Layers ---
  async getMapRiskZones() {
    return this.request<any[]>('/map/risk-zones');
  }

  async getMapATMs(district?: string) {
    const q = district ? `?district=${encodeURIComponent(district)}` : '';
    return this.request<any[]>(`/map/atms${q}`);
  }

  async getMapWithdrawals() {
    return this.request<any[]>('/map/withdrawals?suspicious_only=true');
  }

  async getMapComplaints(district?: string) {
    const q = district ? `?district=${encodeURIComponent(district)}` : '';
    return this.request<any[]>(`/map/complaints${q}`);
  }

  // --- Transactions ---
  async getTransactions(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/transactions?${query}`);
  }

  // --- Alerts ---
  async getAlerts(severity?: string, status?: string) {
    const params = new URLSearchParams();
    if (severity && severity !== 'ALL') params.append('severity', severity);
    if (status && status !== 'ALL') params.append('status', status);
    return this.request<any[]>(`/alerts?${params.toString()}`);
  }

  async acknowledgeAlert(id: number, assignedTo?: string) {
    return this.request<any>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ assigned_to: assignedTo }),
    });
  }

  async assignAlert(id: number, assignedTo: string, agency?: string) {
    return this.request<any>(`/alerts/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigned_to: assignedTo, agency }),
    });
  }

  async resolveAlert(id: number, notes?: string) {
    return this.request<any>(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_notes: notes }),
    });
  }

  // --- Cases & Evidence ---
  async getCases() {
    return this.request<any[]>('/cases');
  }

  async createCase(data: any) {
    return this.request<any>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCaseEvidence(caseId: number) {
    return this.request<any[]>(`/cases/${caseId}/evidence`);
  }

  async uploadEvidence(data: any) {
    return this.request<any>('/evidence', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Investigations ---
  async getInvestigations() {
    return this.request<any[]>('/investigations');
  }

  // --- Reports ---
  async generateReport(predictionId?: number, caseId?: number, title?: string) {
    return this.request<any>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ prediction_id: predictionId, case_id: caseId, title }),
    });
  }

  async getReports() {
    return this.request<any[]>('/reports');
  }

  // --- Graph ---
  async getGraphCases(limit: number = 30) {
    return this.request<any[]>(`/graph/cases?limit=${limit}`);
  }

  async getCaseGraph(caseId: string) {
    return this.request<any>(`/graph/case/${encodeURIComponent(caseId)}`);
  }

  async getAllRisksGraph(riskLevel?: string, limit: number = 100) {
    const params = new URLSearchParams();
    if (riskLevel && riskLevel !== 'ALL') params.append('risk_level', riskLevel);
    params.append('limit', limit.toString());
    return this.request<any>(`/graph/all-risks?${params.toString()}`);
  }

  async getGraph(focusId?: string, caseId?: string, limit: number = 60) {
    const params = new URLSearchParams();
    if (caseId) params.append('case_id', caseId);
    if (focusId) params.append('focus_id', focusId);
    params.append('limit', limit.toString());
    return this.request<any>(`/graph/relationships?${params.toString()}`);
  }

  // --- AI Copilot ---
  async queryCopilot(query: string, contextType?: string, contextId?: string) {
    return this.request<any>('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query, context_type: contextType, context_id: contextId }),
    });
  }

  async explainRisk(predictionId?: number, district?: string) {
    return this.request<any>('/ai/explain-risk', {
      method: 'POST',
      body: JSON.stringify({ prediction_id: predictionId, district }),
    });
  }

  async summarizeCase(caseId: number) {
    return this.request<any>('/ai/summarize-case', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId }),
    });
  }

  // --- Simulation ---
  async triggerSimulation(district: string = 'Central Delhi') {
    return this.request<any>(`/simulation/trigger?district=${encodeURIComponent(district)}`, {
      method: 'POST',
    });
  }

  // --- System ---
  async getSystemHealth() {
    return this.request<any>('/system/health');
  }

  async getModelStatus() {
    return this.request<any>('/system/model-status');
  }

  async getAuditLogs() {
    return this.request<any[]>('/system/audit');
  }

  // --- WebSocket Setup ---
  createWebSocket(onMessage: (data: any) => void): WebSocket | null {
    try {
      const ws = new WebSocket(WS_BASE_URL);
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessage(parsed);
        } catch {
          // Plain message
        }
      };
      return ws;
    } catch {
      return null;
    }
  }
}

export const api = new ApiClient();
