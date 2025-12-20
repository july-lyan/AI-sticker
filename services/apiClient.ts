const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

type ApiOk<T> = { success: true; data: T };
type ApiFail = { success: false; error: string; message: string; data?: any };
type ApiResponse<T> = ApiOk<T> | ApiFail;

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!json) throw new Error(`Invalid response (${res.status})`);

  if (!res.ok || (json as any).success === false) {
    const err = json as ApiFail;
    const errorCode = err.error || `HTTP_${res.status}`;
    const message = err.message || '请求失败';
    const e = new Error(message) as Error & { code?: string; data?: any };
    e.code = errorCode;
    e.data = err.data;
    throw e;
  }

  return (json as ApiOk<T>).data;
}

export async function postJson<T>(path: string, body: any, headers: Record<string, string>) {
  return requestJson<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });
}

export async function getJson<T>(path: string, headers: Record<string, string>) {
  return requestJson<T>(path, {
    method: 'GET',
    headers
  });
}
