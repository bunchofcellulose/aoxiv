<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { competitions, getTotalProblems } from '$lib/competitions';
	import { cn } from '$lib/utils.js';

	const totalOlympiads = competitions.length;
	const totalEditions = competitions.reduce((sum, competition) => sum + competition.editions.length, 0);
	const totalProblems = getTotalProblems();

	const stats = [
		{ value: String(totalOlympiads), label: 'olympiads' },
		{ value: String(totalEditions), label: 'editions' },
		{ value: String(totalProblems), label: 'problems' }
	] as const;
</script>

<section class="my-5 sm:my-8">
	<!-- Title -->
	<div class="mb-3 flex flex-col items-start gap-1">
		<h1 class="my-2 p-0 text-left text-5xl sm:text-6xl">aoXiv</h1>
		<p class="mb-0 text-left text-sm text-muted-foreground">/ ˌeɪ.oʊ.ˈkaɪv /</p>
	</div>

	<!-- Description -->
	<p class="my-5 max-w-prose text-left text-base leading-relaxed text-foreground/80">
		A comprehensive archive of astronomy and astrophysics olympiads — from the prestigious IOAA and INAO to regional competitions like OAC and USAAAO. Includes problem statements, solutions, and grading schemes you rarely find elsewhere, all in a mobile-friendly UI.
	</p>
	<p class="mt-1 mb-4 text-xs text-muted-foreground">
		This project is a fork of
		<a href="https://phoxiv.org" target="_blank" rel="noopener noreferrer" class="underline hover:text-foreground"
			>phoxiv.org</a
		>.
	</p>

	<!-- CTAs -->
	<div class="my-5 flex flex-wrap gap-3 sm:mb-8">
		<a href="#contests" class={cn(buttonVariants({ variant: 'default' }))}>Browse contests</a>
		<a href="https://github.com/bunchofcellulose/aoXiv" class={cn(buttonVariants({ variant: 'outline' }))}>
			Contribute
		</a>
	</div>

	<!-- Stats strip -->
	<div
		class="flex w-fit flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border bg-card px-5 py-3"
	>
		{#each stats as stat, i (stat.label)}
			<div class="flex flex-col gap-0.5">
				<span class="font-mono text-lg leading-none font-semibold text-foreground"
					>{stat.value}</span
				>
				<span class="text-xs text-muted-foreground">{stat.label}</span>
			</div>
			{#if i < stats.length - 1}
				<div class="hidden h-7 w-px bg-border sm:block"></div>
			{/if}
		{/each}
	</div>
</section>
