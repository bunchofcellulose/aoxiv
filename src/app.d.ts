// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { InferSelectModel } from 'drizzle-orm';
import type * as schema from '$lib/server/db/schema';
import type { DB } from '$lib/server/db';
import type { Auth } from '$lib/server/auth';

type SessionUser = InferSelectModel<typeof schema.user>;
type SessionSession = InferSelectModel<typeof schema.session>;

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db?: DB;
			auth?: Auth;
			user: SessionUser | null;
			session: SessionSession | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
