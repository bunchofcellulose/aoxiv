import { fail } from '@sveltejs/kit';
import { contests } from '$lib/competitions.js';
import { getAssignedOlympiadIds } from '$lib/server/guard.js';

// aoXiv's olympiad *content* lives in static YAML (see static/aoxiv/**), not in
// the database — so the contribute forms below can't persist changes yet. They
// return this notice instead, pointing contributors at the real workflow.
const NOTICE =
	"aoXiv's problem data is currently file-based (YAML), so edits aren't saved to a database yet. " +
	'To add problems or a new olympiad, open a pull request on GitHub or reach out on Discord.';

export const load = ({ locals }) => {
	const all = contests
		.map((c) => ({ id: c.id, name: c.name }))
		.sort((a, b) => a.name.localeCompare(b.name));

	if (locals.user?.role === 'admin') return { olympiads: all };

	const assigned = new Set(getAssignedOlympiadIds(locals.user));
	return { olympiads: all.filter((o) => assigned.has(o.id)) };
};

export const actions = {
	selectYear: async () => fail(400, { selectError: NOTICE }),
	createOlympiad: async () => fail(400, { createError: NOTICE })
};
