const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function backendRequest(path: string, init?: RequestInit) {
  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
}