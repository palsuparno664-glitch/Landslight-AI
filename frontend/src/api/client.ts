import type { RiskInput, RiskPrediction, ZonesResponse, CitizenReportInput, AskResponse, AssistantHistoryItem } from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const payload = await response.json().catch(() => ({ error: 'Invalid API response' }));
  if (!response.ok) throw new Error(payload.error || `API request failed (${response.status})`);
  return payload as T;
}

export function getZones(): Promise<ZonesResponse> {
  return request<ZonesResponse>('/api/v1/zones');
}

export function predictRisk(input: RiskInput): Promise<RiskPrediction> {
  return request<RiskPrediction>('/api/v1/predict-risk', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function submitReport(input: CitizenReportInput): Promise<any> {
  return request<any>('/api/v1/reports', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function askAssistant(question: string, history: AssistantHistoryItem[]): Promise<AskResponse> {
  return request<AskResponse>('/api/v1/ask', {
    method: 'POST',
    body: JSON.stringify({ question, history: history.slice(-8) }),
  });
}
