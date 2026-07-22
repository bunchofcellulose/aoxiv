import { redirect } from '@sveltejs/kit';
import { competitions } from '$lib/competitions';

const olympiadIds = new Set(competitions.map((c) => c.id));

export function load({ url, locals }) {
	const seg = url.pathname.split('/')[1];

	// Legacy: /contests/* → /olympiads/*
	if (seg === 'contests') {
		redirect(308, url.pathname.replace('/contests', '/olympiads') + url.search);
	}

	// Legacy: bare /<olympiad-id> → /olympiads/<olympiad-id>
	if (olympiadIds.has(seg)) {
		redirect(308, '/olympiads' + url.pathname);
	}

	return { user: locals.user ?? null };
}
