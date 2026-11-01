import { Client } from 'pg';
import { DB_NAME, PG } from './support/env';

/** Drops the throwaway database once the API has stopped using it (best effort: CI discards the server anyway). */
export default async function globalTeardown(): Promise<void> {
  const client = new Client({ ...PG, database: 'postgres' });
  try {
    await client.connect();
    await client.query(`DROP DATABASE IF EXISTS "${DB_NAME}" WITH (FORCE)`);
  } catch (error) {
    console.warn('E2E teardown: could not drop', DB_NAME, (error as Error).message);
  } finally {
    await client.end().catch(() => undefined);
  }
}
