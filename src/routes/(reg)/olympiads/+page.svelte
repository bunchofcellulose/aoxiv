<script lang="ts">
	import { resolve } from '$app/paths';
	import { contests, type ContestTag } from '$lib/competitions';
	import { Badge } from '$lib/components/ui/badge/index';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import SearchEmptyState from '$lib/components/SearchEmptyState.svelte';
	import OlympiadIcon from '$lib/components/OlympiadIcon.svelte';
	import { ArrowRight } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import Title from '$lib/components/Title.svelte';
	import SvelteSeo from 'svelte-seo';
	import { siteConfig } from '$lib/site-config';

	const ALL_TAGS: ContestTag[] = ['International', 'Regional', 'National', 'Open'];

	let query = $state('');
	let activeTag = $state<ContestTag | null>(null);

	const filtered = $derived(() => {
		const q = query.trim().toLowerCase();
		return contests.filter((c) => {
			const matchesTag = activeTag === null || c.tag === activeTag;
			const matchesQuery =
				!q ||
				c.name.toLowerCase().includes(q) ||
				c.summary.toLowerCase().includes(q) ||
				c.id.toLowerCase().includes(q);
			return matchesTag && matchesQuery;
		});
	});
</script>

<SvelteSeo title="Olympiads — aoXiv" description="Explore astronomy and astrophysics olympiads" />

<section id="olympiads" class="mb-4">
	<Title
		title="Olympiads"
		description="Click any card to explore problems, solutions &amp; marking schemes."
	/>

	<!-- Search + filter toolbar -->
	<div class="mb-6">
		<SearchBar placeholder="Search olympiads…" bind:value={query}>
			{#snippet filters()}
				<ToggleGroup.Root
					type="single"
					variant="outline"
					spacing={2}
					value={activeTag ?? ''}
					onValueChange={(v) => (activeTag = (v as ContestTag) || null)}
					class="flex-wrap justify-center sm:flex-nowrap"
				>
					<ToggleGroup.Item value="">All</ToggleGroup.Item>
					{#each ALL_TAGS as tag (tag)}
						<ToggleGroup.Item value={tag}>{tag}</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			{/snippet}
		</SearchBar>
	</div>

	<!-- Olympiad grid — glass cards -->
	{#if filtered().length > 0}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
			{#each filtered() as olympiad (olympiad.id)}
				<a href={resolve(`/olympiads/${olympiad.id}`)} class="group z-10 block">
					<Card.Root
						class="h-full p-5 inset-ring shadow-primary inset-ring-accent transition-all duration-250 hover:-translate-y-2 hover:shadow-lg/15 hover:inset-ring-primary/50"
					>
						<!-- Top row: icon + badge -->
						<div class="flex items-start justify-between">
							<OlympiadIcon
								icon={olympiad.icon}
								id={olympiad.id}
								class="h-9 w-auto text-4xl leading-none"
							/>
							<Badge variant="outline">
								{olympiad.tag}
							</Badge>
						</div>

						<!-- Body -->
						<div class="flex flex-1 flex-col gap-1">
							<h3
								class="py-0 text-base leading-snug font-semibold text-foreground transition-colors duration-150 group-hover:text-primary"
							>
								{olympiad.name}
							</h3>
							<span class="text-sm leading-relaxed text-muted-foreground">
								{olympiad.summary}
							</span>
						</div>

						<!-- Footer arrow -->
						<div
							class="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-all duration-150 group-hover:gap-2 group-hover:text-primary"
						>
							View archive
							<ArrowRight class="size-4" />
						</div>
					</Card.Root>
				</a>
			{/each}
		</div>
	{:else}
		<SearchEmptyState
			message="No olympiads found"
			hint="Try a different search term or clear the filter."
			clearLabel="Clear filters"
			onClear={() => {
				query = '';
				activeTag = null;
			}}
		/>
	{/if}
</section>

<!-- Contribute CTA — glass tinted banner -->
<section class="mt-2 mb-6">
	<div
		class="flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/70
		       to-primary/90 px-6 py-5
		       shadow-lg shadow-primary/20
		       sm:flex-row
		       sm:items-center"
	>
		<p class="mb-0 text-sm font-medium text-primary-foreground/90">
			Want to add problems or new olympiads? Get involved!
		</p>
		<a
			href={siteConfig.githubUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="flex shrink-0 flex-row items-center gap-1.5 rounded-xl
			       border border-white/30 bg-white/20 px-4
			       py-2 text-sm font-semibold text-primary-foreground transition-all
			       hover:gap-2.5 hover:bg-white/30"
		>
			Get in touch <ArrowRight class="size-4" />
		</a>
	</div>
</section>
