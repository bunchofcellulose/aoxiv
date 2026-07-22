import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

/**
 * Build a Drizzle client backed by a Neon (Postgres) connection.
 * Created lazily per request in hooks.server.ts so the app still boots when
 * DATABASE_URL is unset (auth simply stays disabled until it is configured).
 */
export function createDb(connectionString: string) {
	const sql = neon(connectionString);
	return drizzle(sql, { schema });
}

export type DB = ReturnType<typeof createDb>;
