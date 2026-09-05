export type RiskPrediction = {
  risk_score: number;
  risk_level: string;
  risk_color: string;
  confidence: number;
  input_data: RiskInput;
  top_contributors: Array<{ factor: string; impact: string }>;
  mitigation_actions: string[];
  evacuation_urgency: string;
  multilingual_alerts: Record<string, string>;
  timestamp: string;
};

export type RiskInput = {
  latitude: number;
  longitude: number;
  location_name: string;
  state: string;
  rainfall_last_24h: number;
  slope_angle: number;
  soil_moisture_index: number;
  elevation: number;
  geological_formation_score: number;
  historical_landslide_count: number;
};

export type Zone = {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number];
  polygon: Array<[number, number]>;
  rainfall_last_24h: number;
  slope_angle: number;
  soil_moisture_index: number;
  elevation: number;
  geological_formation_score: number;
  historical_landslide_count: number;
  risk_score: number;
  risk_level: string;
  active_alert: string;
  evacuation_status: string;
};

export type ZonesResponse = {
  status: string;
  region: string;
  total_monitored_zones: number;
  zones: Zone[];
};

export type CitizenReport = {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  location_name: string;
  state: string;
  severity: string;
  hazard_type: string;
  description: string;
  media_url?: string;
  reporter_name: string;
  reporter_phone: string;
  cv_verification_score: number;
  cv_detected_hazards: string[];
  status: string;
  sync_status?: 'synced' | 'pending_sync';
  device_offline_timestamp?: string;
};

export type CitizenReportInput = {
  latitude: number;
  longitude: number;
  location_name: string;
  state: string;
  severity: string;
  hazard_type: string;
  description: string;
  media_url?: string;
  reporter_name: string;
  reporter_phone: string;
};

// ---------------------------------------------------------------------------
// Shared model types — already imported from '@/types' by components & data
// files but previously undeclared. Added so the live GIS map and the rest of
// the app type-check. `Zone` above stays the API (/api/v1/zones) shape.
// ---------------------------------------------------------------------------

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export type MonitoringZone = Zone & {
  critical_infrastructure: string[];
  nearest_shelter: string;
  estimated_population_at_risk: number;
};

export type FactorContribution = {
  factor_name: string;
  feature_key: string;
  value: number;
  unit: string;
  contribution_percentage: number;
  risk_level_impact: RiskLevel;
  explanation: string;
};

export type LandslideFeatureInput = {
  location_name: string;
  latitude: number;
  longitude: number;
  state: string;
  rainfall_last_24h: number;
  slope_angle: number;
  soil_moisture_index: number;
  elevation: number;
  geological_formation_score: number;
  historical_landslide_count: number;
};

export type RiskPredictionOutput = {
  risk_score: number;
  risk_level: RiskLevel;
  risk_color: string;
  confidence: number;
  input_data: LandslideFeatureInput;
  top_contributors: FactorContribution[];
  mitigation_actions: string[];
  evacuation_urgency: string;
  multilingual_alerts: Record<string, string>;
  timestamp: string;
};

export type DispatchRecord = {
  dispatch_id: string;
  timestamp: string;
  zone_name: string;
  state: string;
  target_audience: string;
  channels: string[];
  languages: string[];
  priority: string;
  message_preview: string;
  sdrf_units_deployed: number;
};

export type TelemetryPoint = {
  time: string;
  rainfall_mm: number;
  soil_saturation_pct: number;
  pore_water_pressure_kpa: number;
  inclinometer_displacement_mm: number;
  risk_score: number;
};

export type AssistantHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

export type AssistantSource = {
  kind: 'zone' | 'shelter' | 'report';
  label: string;
  detail: string;
};

export type AskResponse = {
  question: string;
  answer: string;
  provider: 'offline' | 'llm';
  intents: string[];
  sources: AssistantSource[];
  suggested_questions: string[];
  timestamp: string;
};
