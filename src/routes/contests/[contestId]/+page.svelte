<script lang="ts">
	import { page } from '$app/state';
	import { error } from '@sveltejs/kit';
	import SvelteSeo from 'svelte-seo';
	import { competitions } from '$lib/competitions';
	import YearList from '../YearList.svelte';

	const escapeHtml = (input: string) =>
		input
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');

	const renderDescHtml = (input: string) =>
		escapeHtml(input).replace(
			/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
			'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
		);

	const contest = $derived.by(() => {
		const contestId = page.params.contestId;
		const match = competitions.find((competition) => competition.id === contestId);
		if (!match) {
			throw error(404, `Contest '${contestId}' not found`);
		}
		return match;
	});
</script>

<SvelteSeo
	title={contest.name}
	description={contest.desc ?? `An archive of problems and solutions from ${contest.name}, in PDF format.`}
	keywords="problems, solutions, olympiad, astronomy and astrophysics, language"
/>

<h1>{contest.name}</h1>
{#if contest.desc}
	<p>{@html renderDescHtml(contest.desc)}</p>
{/if}

<YearList contestId={contest.id} />
