import { randomBytes } from 'crypto';

/**
 * Settings shared by the config, the global setup and the specs. The config is loaded by the runner and by every
 * worker, so values are generated once and stored in process.env: children inherit the first values.
 */
function stable(name: string, make: () => string): string {
  if (!process.env[name]) process.env[name] = make();
  return process.env[name]!;
}

export const API_URL = 'http://127.0.0.1:5143';
export const WEB_URL = 'http://127.0.0.1:4200';

/** Throwaway database on the server named by ERPM_E2E_PG (default: local docker Postgres on 5433). */
export const PG = {
  host: process.env.ERPM_E2E_PG_HOST ?? 'localhost',
  port: Number(process.env.ERPM_E2E_PG_PORT ?? 5433),
  user: process.env.ERPM_E2E_PG_USER ?? 'erpm_user',
  password: process.env.ERPM_E2E_PG_PASSWORD ?? 'erpm_password123'
};
export const DB_NAME = stable('ERPM_E2E_DB', () => 'erpm_e2e_' + randomBytes(4).toString('hex'));
export const CONNECTION = `Host=${PG.host};Port=${PG.port};Database=${DB_NAME};Username=${PG.user};Password=${PG.password}`;

/** Passwords exist only for this run; nothing here is a real credential. */
export const ADMIN_PASSWORD = stable('ERPM_E2E_ADMIN_PW', () => 'Aa1-' + randomBytes(12).toString('hex'));
export const USER_PASSWORD = stable('ERPM_E2E_USER_PW', () => 'Bb2-' + randomBytes(12).toString('hex'));
