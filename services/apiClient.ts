const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

type ApiOk<T> = { success: true; data: T };
type ApiFail = { success: false; error: string; message: string; data?: any };
type ApiResponse<T> = ApiOk<T> | ApiFail;

// 带超时的 fetch 包装函数
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw error;
  }
}

// 带重试的请求函数
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeout: number,
  retries = 2,
  delay = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchWithTimeout(url, options, timeout);
    } catch (error: any) {
      lastError = error;
      console.warn(`请求失败 (第 ${i + 1}/${retries + 1} 次)`, error.message);

      // 如果还有重试次数，等待后重试
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // 递增延迟
      }
    }
  }

  throw lastError || new Error('请求失败');
}

async function requestJson<T>(path: string, init: RequestInit, timeout = 30000): Promise<T> {
  // 对 GET 请求启用重试，POST 请求只尝试一次（避免重复提交）
  const shouldRetry = init.method === 'GET';
  const res = shouldRetry
    ? await fetchWithRetry(`${API_BASE}${path}`, init, timeout, 2, 1000)
    : await fetchWithTimeout(`${API_BASE}${path}`, init, timeout);

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

export async function postJson<T>(path: string, body: any, headers: Record<string, string>, timeout?: number) {
  return requestJson<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  }, timeout);
}

export async function getJson<T>(path: string, headers: Record<string, string>, timeout?: number) {
  return requestJson<T>(path, {
    method: 'GET',
    headers
  }, timeout);
}
