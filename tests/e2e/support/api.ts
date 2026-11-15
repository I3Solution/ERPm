import { API_URL } from './env';

/** Small client for the public API, used by the seed and by assertions that read stored state. */
export class Api {
  private constructor(private token: string) {}

  /** The API allows 10 logins a minute per address: reuse a user's session and wait out a 429 instead of failing. */
  private static sessions = new Map<string, Api>();

  static async login(userName: string, password: string): Promise<Api> {
    const known = Api.sessions.get(userName);
    if (known) return known;
    for (let attempt = 0; attempt < 8; attempt++) {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName, password })
      });
      if (response.status === 429) { await new Promise(r => setTimeout(r, 10_000)); continue; }
      if (!response.ok) throw new Error(`login ${userName} -> ${response.status}`);
      const api = new Api((await response.json()).accessToken);
      Api.sessions.set(userName, api);
      return api;
    }
    throw new Error(`login ${userName} -> 429 after retries`);
  }

  async call<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_URL}/api/v1${path}`, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`${method} ${path} -> ${response.status}: ${(await response.text()).slice(0, 300)}`);
    const text = await response.text();
    return (text ? JSON.parse(text) : {}).data as T;
  }

  get = <T = any>(path: string) => this.call<T>('GET', path);
  post = <T = any>(path: string, body: unknown) => this.call<T>('POST', path, body);
  put = <T = any>(path: string, body: unknown) => this.call<T>('PUT', path, body);
  del = <T = any>(path: string) => this.call<T>('DELETE', path);
}
