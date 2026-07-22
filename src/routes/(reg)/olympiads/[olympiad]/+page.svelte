<script lang="ts">
	import { page } from '$app/state';
	import { error } from '@sveltejs/kit';
	import { onMount, tick } from 'svelte';
	import { marked } from 'marked';
	import SvelteSeo from 'svelte-seo';
	import { competitions } from '$lib/competitions';
	import { siteConfig } from '$lib/site-config';
	import YearList from '../YearList.svelte';
	import { ChevronLeft, ExternalLink } from '@lucide/svelte';

	const contest = $derived.by(() => {
		const id = page.params.olympiad;
		const match = competitions.find((competition) => competition.id === id);
		if (!match) {
			throw error(404, `Olympiad '${id}' not found`);
		}
		return match;
	});

	const officialSite = $derived(contest.website || contest.url);

	const descHtml = $derived(
		contest.desc ? (marked.parse(contest.desc, { async: false }) as string) : ''
	);

	// Scroll to the year anchor when arriving via the ⌘K search palette.
	onMount(async () => {
		const hash = window.location.hash;
		if (hash) {
			await tick();
			document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
		}
	});
</script>

<SvelteSeo
	title={`${contest.name} — aoXiv`}
	description={contest.desc ??
		`An archive of problems and solutions from the ${contest.name}, in PDF format.`}
	keywords={siteConfig.seo.contestKeywords}
/>

<a
	href="/olympiads"
	class="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline transition-colors hover:text-primary"
>
	<ChevronLeft class="size-4" />
	Back to olympiads
</a>

<header class="flex flex-col gap-3 pt-3 md:pt-5">
	<div class="flex flex-col items-start gap-2.5">
		<h1 class="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{contest.name}</h1>
		{#if officialSite}
			<a
				href={officialSite}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/60 hover:bg-primary/20"
			>
				<ExternalLink class="size-3.5" />
				Official site
			</a>
		{/if}
	</div>
	{#if descHtml}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<div class="prose mb-4 max-w-none">{@html descHtml}</div>
	{/if}
</header>

<YearList olympiadId={contest.id} />
