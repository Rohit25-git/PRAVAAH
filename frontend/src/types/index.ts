export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type UserRole = 'I4C_OFFICER' | 'LEA_OFFICER' | 'BANK_ANALYST' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  agency?: string;
  jurisdiction?: string;
  active: boolean;
}

export interface HotspotFactors {
  transaction_anomaly: number;
  historical_crime: number;
  geographic_concentration: number;
  temporal_pattern: number;
  network_intelligence: number;
  disclaimer: string;
}

export interface Hotspot {
  id: number;
  zone_id: string;
  location: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  future_hotspot_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  confidence: number;
  uncertainty: number;
  predicted_time_window: string;
  time_window_probability: number;
  prediction_timestamp: string;
  valid_until: string;
  nearby_atms: number;
  nearby_complaints: number;
  suspicious_transactions: number;
  related_cases: number;
  linked_accounts: number;
  associated_case_id?: string;
  associated_case_title?: string;
  factors?: HotspotFactors;
}

export interface Alert {
  id: number;
  prediction_id?: number;
  severity: RiskLevel;
  risk_score: number;
  location: string;
  predicted_time_window: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'UNDER_INVESTIGATION' | 'RESOLVED';
  assigned_to?: string;
  agency?: string;
  jurisdiction: string;
  reason: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

export interface Transaction {
  id: number;
  transaction_reference: string;
  account_id: string;
  transaction_type: string;
  amount: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  atm_id?: string;
  bank: string;
  district: string;
  state: string;
  risk_indicator: number;
}

export interface Complaint {
  id: number;
  complaint_reference: string;
  category: string;
  amount: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  status: string;
}

export interface ATM {
  id: number;
  atm_reference: string;
  bank: string;
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  location_type: string;
  active: boolean;
}

export interface Case {
  id: number;
  case_reference: string;
  category: string;
  priority: string;
  status: string;
  jurisdiction: string;
  assigned_agency?: string;
  assigned_officer?: string;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: number;
  case_id: number;
  evidence_type: string;
  description: string;
  file_reference: string;
  uploaded_by: string;
  timestamp: string;
  sha256_hash: string;
  integrity_status: string;
}

export interface DashboardSummary {
  active_critical_alerts: number;
  predicted_high_risk_zones: number;
  suspicious_withdrawals: number;
  cybercrime_complaints: number;
  open_investigations: number;
  open_cases: number;
  total_cases?: number;
  total_transactions?: number;
  total_atms?: number;
  model_status: string;
}

export interface ActivitySeries {
  timestamp: string;
  complaints: number;
  transactions: number;
  withdrawals: number;
  predicted_risk: number;
}

export interface DashboardActivity {
  activity_timeline: ActivitySeries[];
  category_distribution: { name: string; value: number; color: string }[];
  time_window_distribution: { window: string; risk_level: string; score: number }[];
  geographic_distribution: { state: string; hotspots: number; risk_score: number }[];
  model_performance: {
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    false_positive_rate: number;
    validation_strategy: string;
  };
}

export interface IntelligenceReport {
  report_id: string;
  generated_at: string;
  title: string;
  executive_summary: string;
  risk_assessment: string;
  predicted_hotspot: {
    district: string;
    state: string;
    latitude: number;
    longitude: number;
    risk_score: number;
    risk_level: string;
  };
  predicted_time_window: string;
  prediction_confidence: number;
  transaction_analysis: {
    anomalous_withdrawals_detected: number;
    total_sample_amount: number;
    transactions: { ref: string; amount: number; atm?: string }[];
  };
  complaint_analysis: {
    complaints_in_district: number;
    complaints: { ref: string; category: string; amount: number }[];
  };
  related_entities: string[];
  timeline: { time: string; event: string }[];
  risk_factors: { factor: string; contribution: number; explanation: string }[];
  related_cases: { reference: string; category: string }[];
  evidence_references: { id: string; desc: string; sha256: string; status: string }[];
  operational_recommendations: string[];
  disclaimer: string;
}
