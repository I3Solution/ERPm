import { API_URL } from './env';

/** Small client for the public API, used by the seed and by assertions that read stored state. */
export class Api {
  private constructor(private token: string) {}

  static async login(userName: string, password: string): Promise<Api> {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName, password })
    });
    if (!response.ok) throw new Error(`login ${userName} -> ${response.status}`);
    return new Api((await response.json()).accessToken);
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
}
