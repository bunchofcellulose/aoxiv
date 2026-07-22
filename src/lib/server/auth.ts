import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import * as schema from './db/schema';
import type { DB } from './db';

export type AuthEnv = {
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	TRUSTED_ORIGINS?: string;
};

export function createAuth(db: DB, env: AuthEnv) {
	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		trustedOrigins: env.TRUSTED_ORIGINS?.split(',') ?? [],
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification
			}
		}),
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID ?? '',
				clientSecret: env.GITHUB_CLIENT_SECRET ?? ''
			}
		},
		user: {
			additionalFields: {
				assignedOlympiads: {
					type: 'string',
					required: false,
					defaultValue: '[]',
					// Never settable by the user themselves through BetterAuth's own
					// update-user endpoint — only our admin panel writes this directly via Drizzle.
					input: false
				}
			}
		},
		plugins: [
			admin({
				// Only "admin" gets BetterAuth's privileged admin powers (ban/setRole).
				// "contributor" is a purely app-level role enforced by guard.ts.
				adminRoles: ['admin']
			})
		]
	});
}

export type Auth = ReturnType<typeof createAuth>;
