import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createDb } from '$lib/server/db';
import { createAuth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Auth stays disabled until DATABASE_URL is configured, so the site still
	// boots (unauthenticated) without a database.
	if (env.DATABASE_URL) {
		const db = createDb(env.DATABASE_URL);
		const auth = createAuth(db, {
			GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
			GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
			BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
			BETTER_AUTH_URL: env.BETTER_AUTH_URL,
			TRUSTED_ORIGINS: env.TRUSTED_ORIGINS
		});
		event.locals.db = db;
		event.locals.auth = auth;

		const session = await auth.api.getSession({ headers: event.request.headers });
		event.locals.user = (session?.user ?? null) as unknown as App.Locals['user'];
		event.locals.session = (session?.session ?? null) as unknown as App.Locals['session'];
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};
